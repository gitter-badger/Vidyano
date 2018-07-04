namespace Vidyano {
    export let version = "latest";
    const CACHE_NAME = `vidyano.web2.${version}`;
    const WEB2_BASE = "WEB2_BASE";

    export type Fetcher<TPayload, TResult> = (payload?: TPayload) => Promise<TResult>;
    interface IFetcher<TPayload, TResult> {
        payload?: TPayload;
        request?: Request;
        response?: Response;
        fetch: Fetcher<TPayload, TResult>;
    }

    export type IClientData = Service.IClientData;
    export type IGetApplicationRequest = Service.IGetApplicationRequest;
    export type IApplicationResponse = Service.IApplicationResponse;
    export type IGetQueryRequest = Service.IGetQueryRequest;
    export type IGetQueryResponse = Service.IGetQueryResponse;
    export type IQuery = Service.IQuery;
    export type IQueryColumn = Service.IQueryColumn;
    export type IQueryResultItem = Service.IQueryResultItem;
    export type IQueryResultItemValue = Service.IQueryResultItemValue;
    export type IGetPersistentObjectRequest = Service.IGetPersistentObjectRequest;
    export type IGetPersistentObjectResponse = Service.IGetPersistentObjectResponse;
    export type IPersistentObject = Service.IPersistentObject;
    export type IExecuteActionRequest = Service.IExecuteActionRequest;
    export type IExecuteQueryActionRequest = Service.IExecuteQueryActionRequest;
    export type IExecuteQueryRequest = Service.IExecuteQueryRequest;
    export type IExecuteQueryResponse = Service.IExecuteQueryResponse;
    export type IQueryResult = Service.IQueryResult;
    export type IExecuteQueryFilterActionRequest = Service.IExecuteQueryFilterActionRequest;
    export type IExecutePersistentObjectActionRequest = Service.IExecutePersistentObjectActionRequest;
    export type IExecuteActionResponse = Service.IExecuteActionResponse;

    export class ServiceWorker {
        private readonly _db: IndexedDB;
        private _service: IService;

        constructor(private serviceUri?: string, private _verbose?: boolean) {
            this._db = new IndexedDB();

            if (!serviceUri)
                this.serviceUri = location.href.split("service-worker.js")[0];

            self.addEventListener("install", (e: ExtendableEvent) => e.waitUntil(this._onInstall(e)));
            self.addEventListener("activate", (e: ExtendableEvent) => e.waitUntil(this._onActivate(e)));
            self.addEventListener("fetch", (e: FetchEvent) => e.respondWith(this._onFetch(e)));
        }

        get db(): IndexedDB {
            return this._db;
        }

        private get authToken(): string {
            return this["_authToken"];
        }

        private set authToken(authToken: string) {
            this["_authToken"] = authToken;
        }

        private _log(message: string) {
            if (!this._verbose)
                return;

            console.log("SW: " + message);
        }

        private async _onInstall(e: ExtendableEvent) {
            this._log("Installed ServiceWorker.");

            console.log("Installing Vidyano Web2 version " + version);

            vidyanoFiles.splice(0, vidyanoFiles.length, ...[
                `${WEB2_BASE}`,
            ].concat(vidyanoFiles.map(f => `${WEB2_BASE}${f}`)));

            const cache = await caches.open(CACHE_NAME);
            await Promise.all(vidyanoFiles.map(async url => {
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

            await (self as ServiceWorkerGlobalScope).skipWaiting();
        }

        private async _onActivate(e: ExtendableEvent) {
            this._log("Activated ServiceWorker");

            await (self as ServiceWorkerGlobalScope).clients.claim();

            const oldCaches = (await caches.keys()).filter(cache => cache.startsWith("vidyano.web2.") && cache !== CACHE_NAME);
            while (oldCaches.length > 0) {
                const cacheName = oldCaches.splice(0, 1)[0];

                console.log("Uninstalling Vidyano Web2 version " + cacheName.substr(13));
                const success = await caches.delete(cacheName);
                if (!success)
                    console.error("Failed uninstalling Vidyano Web2 version " + cacheName.substr(13));
            }
        }

        private async _onFetch(e: FetchEventInit) {
            this._log(`Fetch (${e.request.url})`);

            try {
                if (e.request.method === "GET" && e.request.url.endsWith("GetClientData?v=2")) {
                    const fetcher = await this._createFetcher<any, IClientData>(e.request);
                    let response = await fetcher.fetch();
                    if (response) {
                        await this.db.save({
                            id: "GetClientData",
                            response: JSON.stringify(response)
                        }, "Requests");
                    }
                    else {
                        const cachedClientData = await this.db.load("GetClientData", "Requests");
                        if (cachedClientData)
                            response = cachedClientData.response;
                    }

                    return this.createResponse(response);
                }

                if (ServiceWorker.prototype.onCache !== this.onCache && e.request.method === "POST" && e.request.url.startsWith(this.serviceUri)) {
                    if (e.request.url.endsWith("GetApplication")) {
                        const fetcher = await this._createFetcher<IGetApplicationRequest, IApplicationResponse>(e.request);
                        let response = await fetcher.fetch(fetcher.payload);
                        if (!response) {
                            const cachedApplication = await this.db.load("GetApplication", "Requests");
                            if (cachedApplication)
                                response = cachedApplication.response;
                        }
                        else {
                            await this.db.save({
                                id: "GetApplication",
                                response: JSON.stringify(response)
                            }, "Requests");

                            if (fetcher.response)
                                this.onCache(this._service = new Service(this, this.serviceUri, response.userName, this.authToken = response.authToken));
                        }

                        return this.createResponse(response);
                    }
                    else if (e.request.url.endsWith("GetQuery")) {
                        const fetcher = await this._createFetcher<IGetQueryRequest, IGetQueryResponse>(e.request);
                        const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, query: undefined };
                        if (!response.query) {
                            const actionsClass = await ServiceWorkerActions.get(fetcher.payload.id, this.db);
                            response.query = await actionsClass.onGetQuery(fetcher.payload.id)
                        }
                        else
                            this.authToken = response.authToken;

                        return this.createResponse(response);
                    }
                    else if (e.request.url.endsWith("GetPersistentObject")) {
                        const fetcher = await this._createFetcher<IGetPersistentObjectRequest, IGetPersistentObjectResponse>(e.request);
                        const response = /*await fetcher.fetch(fetcher.payload) ||*/ { authToken: this.authToken, result: undefined };
                        if (!response.result) {
                            const actionsClass = await ServiceWorkerActions.get(fetcher.payload.persistentObjectTypeId, this.db);
                            response.result = await actionsClass.onGetPersistentObject(fetcher.payload.parent, fetcher.payload.persistentObjectTypeId, fetcher.payload.objectId, fetcher.payload.isNew);
                        }
                        else
                            this.authToken = response.authToken;

                        return this.createResponse(response);
                    }
                    else if (e.request.url.endsWith("ExecuteAction")) {
                        const fetcher = await this._createFetcher<IExecuteActionRequest, IExecuteActionResponse>(e.request);
                        const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, result: undefined };
                        if (!response.result) {
                            const action = fetcher.payload.action.split(".");
                            if (action[0] === "Query") {
                                const queryAction = fetcher.payload as IExecuteQueryActionRequest;
                                const actionsClass = await ServiceWorkerActions.get(queryAction.query.persistentObject.type, this.db);
                                response.result = await actionsClass.onExecuteQueryAction(action[1], queryAction.query, queryAction.selectedItems, queryAction.parameters);
                            }
                            else if (action[0] === "PersistentObject") {
                                const persistentObjectAction = fetcher.payload as IExecutePersistentObjectActionRequest;
                                const actionsClass = await ServiceWorkerActions.get(persistentObjectAction.parent.type, this.db);
                                response.result = await actionsClass.onExecutePersistentObjectAction(action[1], persistentObjectAction.parent, persistentObjectAction.parameters);
                            }
                            else if (action[0] === "QueryFilter") {
                                const queryFilterAction = fetcher.payload as IExecuteQueryFilterActionRequest;
                                const actionsClass = await ServiceWorkerActions.get(queryFilterAction.query.persistentObject.type, this.db);
                                response.result = await actionsClass.onExecuteQueryFilterAction(action[1], queryFilterAction.query, queryFilterAction.parameters);
                            }
                        }
                        else
                            this.authToken = response.authToken;

                        return this.createResponse(response);
                    }
                    else if (e.request.url.endsWith("ExecuteQuery")) {
                        const fetcher = await this._createFetcher<IExecuteQueryRequest, IExecuteQueryResponse>(e.request);
                        const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, result: undefined };
                        //if (!response.result) {
                        const actionsClass = await ServiceWorkerActions.get(fetcher.payload.query.persistentObject.type, this.db);
                        response.result = await actionsClass.onExecuteQuery(fetcher.payload.query);
                        //}
                        //else
                        //    this.authToken = response.authToken;

                        return this.createResponse(response);
                    }
                }

                let response: Response;

                const cache = await caches.open(CACHE_NAME);
                if (vidyanoFiles.indexOf(e.request.url) > 0 && !!(response = await cache.match(e.request)))
                    return response;

                try {
                    response = await fetch(e.request);
                }
                catch (error) { }

                if (e.request.method === "GET") {
                    if (response) {
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

                if (!response && e.request.url.startsWith(this.serviceUri) && e.request.method === "GET")
                    return await caches.match(this.serviceUri); // Fallback to root document when a deeplink is loaded directly

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

            const actionsClass = await ServiceWorkerActions.get(po.type, this._serviceWorker.db);
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

            const actionsClass = await ServiceWorkerActions.get(query.persistentObject.type, this._serviceWorker.db);
            if (!actionsClass)
                return;

            await actionsClass.onCacheQuery(query);
        }
    }
}