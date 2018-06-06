namespace Vidyano {
    const CACHE_NAME = "vidyano.offline";

    export type Store = "Requests" | "Queries" | "PersistentObjects";
    type RequestMapKey = "GetQuery" | "GetPersistentObject"

    export abstract class IndexedDB {
        private _initializing: Promise<void>;
        private _db: IDBDatabase;

        constructor(private _store?: Store) {
            this._initializing = new Promise<void>(resolve => {
                const dboOpen = indexedDB.open("vidyano.offline", 1);
                dboOpen.onupgradeneeded = () => {
                    var db = <IDBDatabase>dboOpen.result;
                    db.createObjectStore("Requests", { keyPath: "id" });
                    db.createObjectStore("Queries", { keyPath: "id" });
                    db.createObjectStore("PersistentObjects", { keyPath: "id" });
                };

                dboOpen.onsuccess = () => {
                    this._db = <IDBDatabase>dboOpen.result;
                    resolve();
                };
            });
        }

        get initializing(): Promise<void> {
            return this._initializing;
        }

        get db(): IDBDatabase {
            return this._db;
        }

        protected save(entry: any, store: Store = this._store) {
            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            requests.put(entry);
        }

        protected async load(key: any, store: Store = this._store) {
            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            return await new Promise<any>((resolve, reject) => {
                const getData = requests.get(key);
                getData.onsuccess = () => resolve(getData.result);
                getData.onerror = () => resolve(null);
            });
        }
    }

    export class ServiceWorker extends IndexedDB {
        //private _requestHandlerMap = new Map<RequestMapKey, ServiceWorkerRequestHandler[]>();
        private _rootPath: string;
        private _authToken: string;
        private _service: IService;

        constructor(private _verbose?: boolean) {
            super();

            self.addEventListener("install", (e: ExtendableEvent) => e.waitUntil(this._onInstall(e)));
            self.addEventListener("activate", (e: ExtendableEvent) => e.waitUntil(this._onActivate(e)));
            self.addEventListener("fetch", (e: FetchEvent) => e.respondWith(this._onFetch(e)));
        }

        private _log(message: string) {
            if (!this._verbose)
                return;

            console.log("SW: " + message);
        }

        private async _onInstall(e: ExtendableEvent) {
            this._log("Installed ServiceWorker");

            const base = location.href.substr(location.origin.length).split("service-worker.js")[0];
            const urls = [
                `${base}`,
            ].concat(vidyanoFiles.map(f => `${base}web2/${f}`));

            const cache = await caches.open(CACHE_NAME);
            await Promise.all(urls.map(async url => {
                const request = new Request(url);
                const response = await fetch(request);

                if (request.url !== response.url) {
                    const redirect = new Response(null, {
                        status: 302,
                        headers: new Headers({
                            "location": response.url
                        })
                    });

                    cache.put(request, redirect);
                    cache.put(new Request(response.url), response);
                }
                else
                    cache.put(request, response);
            }));
        }

        private async _onActivate(e: ExtendableEvent) {
            this._log("Activated ServiceWorker");

            await Promise.all([
                await this.initializing,
                await (self as ServiceWorkerGlobalScope).clients.claim()
            ]);
        }

        private async _onFetch(e: FetchEventInit) {
            this._log(`Fetch (${e.request.url})`);
            await this.initializing;

            try {
                if (e.request.method === "GET" && e.request.url.endsWith("GetClientData?v=2")) {
                    this._rootPath = e.request.url.split("/GetClientData?v=2")[0];

                    const fetcher = await this._createFetcher<any, IClientData>(e.request);
                    let clientData = await this.onGetClientData(fetcher.fetch);
                    if (clientData) {
                        this.save({
                            id: "GetClientData",
                            response: JSON.stringify(clientData)
                        }, "Requests");
                    }
                    else {
                        const cachedClientData = await this.load("GetClientData", "Requests");
                        if (cachedClientData)
                            clientData = cachedClientData.response;
                    }

                    return this.createResponse(clientData);
                }

                if (ServiceWorker.prototype.onCache !== this.onCache && e.request.method === "POST" && e.request.url.startsWith(this._rootPath)) {
                    if (e.request.url.endsWith("GetApplication")) {
                        const fetcher = await this._createFetcher<IGetApplicationRequest, IApplication>(e.request);
                        let application = await this.onGetApplication(fetcher.payload, fetcher.fetch);
                        if (application) {
                            this.save({
                                id: "GetApplication",
                                response: JSON.stringify(application)
                            }, "Requests");

                            if (fetcher.response)
                                this.onCache(this._service = new Service(this, this._rootPath, application.userName, this._authToken = application.authToken));
                        }
                        else {
                            const cachedApplication = await this.load("GetApplication", "Requests");
                            if (cachedApplication)
                                application = cachedApplication.response;
                        }

                        return this.createResponse(application);
                    }
                    else if (e.request.url.endsWith("GetQuery")) {
                        const fetcher = await this._createFetcher<IGetQueryRequest, IGetQueryResponse>(e.request);
                        let query = await this.onGetQuery(fetcher.payload, fetcher.fetch);
                        if (!query) {
                            const cachedQuery = await this.load(fetcher.payload.id, "Queries");
                            if (cachedQuery) {
                                query = { authToken: this._authToken, query: JSON.parse(cachedQuery.response) };

                                const actionsClass = ServiceWorkerActions.get(query.query.persistentObject.type, this.db);
                                if (actionsClass)
                                    query.query = await actionsClass.onGetQuery(query.query);
                            }
                        }
                        else
                            this._authToken = query.authToken;

                        return this.createResponse(query);
                    }
                }

                let response: Response;
                try {
                    response = await fetch(e.request);
                }
                catch (error) { }

                if (e.request.method === "GET") {
                    if (response) {
                        const cache = await caches.open(CACHE_NAME);
                        if (response.status !== 0 && e.request.url !== response.url) {
                            cache.put(new Request(response.url), response);
                            response = new Response(null, {
                                status: 302,
                                headers: new Headers({
                                    "location": response.url
                                })
                            });

                            cache.put(e.request, response);
                        }
                        else
                            cache.put(e.request, response.clone());
                    }
                    else
                        response = await caches.match(e.request);
                }

                if (!response && e.request.url.startsWith(this._rootPath) && e.request.method === "GET")
                    return await caches.match(this._rootPath); // Fallback to root document when a deeplink is loaded directly

                return response;
            }
            catch (ee) {
                console.log(ee);
                return this.createResponse(null);
            }
        }

        private async _createFetcher<TPayload, TResult>(originalRequest: Request): Promise<IFetcher<TPayload, TResult>> {
            const fetcher: IFetcher<any, any> = {
                payload: originalRequest.headers.get("Content-type") === "application/json" ? await originalRequest.clone().json() : await originalRequest.text(),
                fetch: null
            };

            fetcher.fetch = async payload => {
                const fetchRquest = this.createRequest(payload, originalRequest);
                try {
                    fetcher.response = await fetch(fetchRquest);
                }
                catch (ex) {
                    return;
                }

                return await fetcher.response.json();
            };

            return fetcher;
        }

        protected async onGetClientData(fetch: Fetcher<any, IClientData>): Promise<IClientData> {
            return await fetch();
        }

        protected async onGetApplication(payload: IGetApplicationRequest, fetch: Fetcher<IGetApplicationRequest, IApplication>): Promise<IApplication> {
            return await fetch(payload);
        }

        protected async onGetQuery(payload: IGetQueryRequest, fetch: Fetcher<IGetQueryRequest, IGetQueryResponse>): Promise<IGetQueryResponse> {
            return await fetch(payload);
        }

        protected async onCache(service: IService) {
        }

        protected createRequest(data: any, request: Request): Request {
            if (typeof data === "object")
                data = JSON.stringify(data);

            return new Request(request.url, {
                headers: request.headers,
                body: data,
                cache: request.cache,
                credentials: request.credentials,
                integrity: request.integrity,
                keepalive: request.keepalive,
                method: request.method,
                mode: request.mode,
                referrer: request.referrer,
                referrerPolicy: request.referrerPolicy
            });
        }

        protected createResponse(data: any, response?: Response): Response {
            if (!data) {
                return new Response("<h1>Service Unavailable</h1>", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({
                        "Content-Type": "text/html"
                    })
                });
            }

            if (typeof data === "object")
                data = JSON.stringify(data);

            return new Response(data, response ? {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText
            } : null);
        }
    }

    /// IService and Service implementation
    export interface IService {
        cachePersistentObject(parent: Service.IPersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<void>;
        cacheQuery(id: string): Promise<void>;
    }

    class Service implements IService {
        constructor(private _serviceWorker: ServiceWorker, readonly serviceUri: string, private _userName: string, private _authToken: string) {
        }

        private _createPayload(): any {
            const payload: Service.IRequest = {
                authToken: this._authToken,
                userName: this._userName,
                environment: "Web,ServiceWorker",
                environmentVersion: "2",
                clientVersion: ""
            };

            return payload;
        }

        private _createUri(method: string) {
            let uri = this.serviceUri;
            if (!uri.endsWith("/"))
                uri += "/";

            return uri + method;
        }

        private async _fetch(method: string, payload: any): Promise<any> {
            let uri = this.serviceUri;
            if (!uri.endsWith("/"))
                uri += "/";

            const response = await fetch(new Request(this._createUri(method), {
                body: JSON.stringify(payload),
                cache: "no-cache",
                headers: {
                    "content-type": "application/json",
                    "user-agent": navigator.userAgent
                },
                method: "POST",
                referrer: self.location.toString()
            }));

            if (!response.headers.get("content-type").startsWith("application/json"))
                return response.clone().text();

            const result = await response.clone().json();
            if (method === "GetQuery" && result.query)
                return result.query;
            else if (method === "GetPersistentObject" && result.persistentObject)
                return result.persistentObject;

            return result;
        }

        async cachePersistentObject(parent: IPersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<void> {
            const payload = <IGetPersistentObjectRequest>this._createPayload();
            payload.parent = parent;
            payload.persistentObjectTypeId = id;

            if (objectId)
                payload.objectId = objectId;
            if (isNew)
                payload.isNew = isNew;

            const po = <IPersistentObject>await this._fetch("GetPersistentObject", payload);
            if (!po)
                return;

            const actionsClass = ServiceWorkerActions.get(po.type, this._serviceWorker.db);
            if (!actionsClass)
                return;

            await actionsClass.onCachePersistentObject(po);
        }

        async cacheQuery(id: string): Promise<void> {
            const payload = <IGetQueryRequest>this._createPayload();
            payload.id = id;

            const query = <IQuery>await this._fetch("GetQuery", payload);
            if (!query || !query.persistentObject)
                return;

            const actionsClass = ServiceWorkerActions.get(query.persistentObject.type, this._serviceWorker.db);
            if (!actionsClass)
                return;

            await actionsClass.onCacheQuery(query);
        }
    }

    // ServiceWorker Request Handlers
    export type Fetcher<TPayload, TResult> = (payload?: TPayload) => Promise<TResult>;
    interface IFetcher<TPayload, TResult> {
        payload?: TPayload;
        request?: Request;
        response?: Response;
        fetch: Fetcher<TPayload, TResult>;
    }

    export type IClientData = Service.IClientData;
    export type IGetApplicationRequest = Service.IGetApplicationRequest;
    export type IApplication = Service.IApplication;
    export type IGetQueryRequest = Service.IGetQueryRequest;
    export type IGetQueryResponse = Service.IGetQueryResponse;
    export type IQuery = Service.IQuery;
    export type IGetPersistentObjectRequest = Service.IGetPersistentObjectRequest;
    export type IGetPersistentObjectResponse = Service.IGetPersistentObjectResponse;
    export type IPersistentObject = Service.IPersistentObject;

    export class ServiceWorkerActions {
        private static _types = new Map<string, any>();
        static get<T>(name: string, db: IDBDatabase): ServiceWorkerActions {
            if (!(/^\w+$/.test(name)))
                return null;

            let actionsClass = ServiceWorkerActions._types.get(name);
            if (actionsClass === undefined) {
                try {
                    actionsClass = eval.call(null, `ServiceWorker${name}Actions`);
                }
                catch (e) {
                    actionsClass = null;
                }
                finally {
                    ServiceWorkerActions._types.set(name, actionsClass);
                }
            }

            if (!actionsClass)
                return null;

            const instance = new actionsClass();
            instance._db = db;

            return instance;
        }

        private _db: IDBDatabase;

        get db(): IDBDatabase {
            return this._db;
        }

        protected save(entry: any, store: Store) {
            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            requests.put(entry);
        }

        private _isPersistentObject(arg: any): arg is IPersistentObject {
            return (arg as IPersistentObject).type !== undefined;
        }

        private _isQuery(arg: any): arg is IQuery {
            return (arg as IQuery).persistentObject !== undefined;
        }

        async onCache<T extends IPersistentObject | IQuery>(persistentObjectOrQuery: T): Promise<void> {
            if (this._isPersistentObject(persistentObjectOrQuery))
                await this.onCachePersistentObject(persistentObjectOrQuery);
            else if (this._isQuery(persistentObjectOrQuery))
                await this.onCacheQuery(persistentObjectOrQuery);
        }

        async onCachePersistentObject(persistentObject: IPersistentObject): Promise<void> {
            this.save({
                typeId: persistentObject.id,
                objectId: persistentObject.objectId,

                response: JSON.stringify(persistentObject)
            }, "PersistentObjects");
        }

        async onCacheQuery(query: IQuery): Promise<void> {
            this.save({
                id: query.id,
                response: JSON.stringify(query)
            }, "Queries");

            if (query.canRead || (query.actions && query.actions.some(a => a === "New"))) {
                query.persistentObject
            }
        }

        async onGetQuery(query: IQuery): Promise<IQuery> {
            return query;
        }

        async fetch(payload: any, fetcher: Fetcher<Service.IRequest, any>): Promise<any> {
            return await fetcher(payload);
        }
    }
}