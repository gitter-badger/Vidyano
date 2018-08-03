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

    export class ServiceWorker {
        private readonly _db: IndexedDB;
        private _cacheName: string;
        private _clientData: Service.ClientData;
        private _application: Application;

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

        get clientData(): Service.ClientData {
            return this._clientData;
        }

        get application(): Application {
            return this._application;
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

            self.importScripts(
                `${WEB2_BASE}Libs/bignumber.js/bignumber.min.js`,
                `${WEB2_BASE}Libs/Vidyano/vidyano.common.js`);

            await (self as ServiceWorkerGlobalScope).skipWaiting();

            this._log("Installed ServiceWorker.");
        }

        private async _onActivate(e: ExtendableEvent) {
            await (self as ServiceWorkerGlobalScope).clients.claim();

            const oldCaches = (await caches.keys()).filter(cache => cache.startsWith("vidyano.web2.") && cache !== CACHE_NAME);
            while (oldCaches.length > 0) {
                const cacheName = oldCaches.splice(0, 1)[0];

                console.log("Uninstalling Vidyano Web2 version " + cacheName.substr(13));
                const success = await caches.delete(cacheName);
                if (!success)
                    console.error("Failed uninstalling Vidyano Web2 version " + cacheName.substr(13));
            }

            this._log("Activated ServiceWorker");
        }

        private async _onFetch(e: FetchEventInit) {
            this._log(`Fetch (${e.request.url})`);

            try {
                if (e.request.method === "GET" && e.request.url.endsWith("GetClientData?v=2")) {
                    const fetcher = await this._createFetcher<any, Service.ClientData>(e.request);
                    let response = await fetcher.fetch();
                    if (!response)
                        response = await this.onGetClientData();
                    else
                        await this.onCacheClientData(response);

                    return this.createResponse(response);
                }

                if (e.request.method === "POST" && e.request.url.startsWith(this.serviceUri)) {
                    if (e.request.url.endsWith("GetApplication")) {
                        const fetcher = await this._createFetcher<Service.GetApplicationRequest, Service.ApplicationResponse>(e.request);
                        let response = await fetcher.fetch(fetcher.payload);
                        if (!response)
                            response = await this.onGetApplication();
                        else
                            await this.onCacheApplication(response);

                        return this.createResponse(response);
                    }
                    else {
                        if (!this._clientData)
                            this._clientData = (await this.db.load("GetClientData", "Requests")).response;

                        if (!this._application)
                            this._application = new Application(this, (await this.db.load("GetApplication", "Requests")).response);

                        if (e.request.url.endsWith("GetQuery")) {
                            const fetcher = await this._createFetcher<Service.GetQueryRequest, Service.GetQueryResponse>(e.request);
                            const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, query: undefined };
                            if (!response.query) {
                                const actionsClass = await ServiceWorkerActions.get(fetcher.payload.id, this);
                                response.query = Wrappers.QueryWrapper._unwrap(await actionsClass.onGetQuery(fetcher.payload.id));
                            }
                            else
                                this.authToken = response.authToken;

                            return this.createResponse(response);
                        }
                        else if (e.request.url.endsWith("GetPersistentObject")) {
                            const fetcher = await this._createFetcher<Service.GetPersistentObjectRequest, Service.GetPersistentObjectResponse>(e.request);
                            const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, result: undefined };
                            if (!response.result) {
                                const actionsClass = await ServiceWorkerActions.get(fetcher.payload.persistentObjectTypeId, this);
                                response.result = await actionsClass.onGetPersistentObject(fetcher.payload.parent, fetcher.payload.persistentObjectTypeId, fetcher.payload.objectId, fetcher.payload.isNew);
                            }
                            else
                                this.authToken = response.authToken;

                            return this.createResponse(response);
                        }
                        else if (e.request.url.endsWith("ExecuteAction")) {
                            const fetcher = await this._createFetcher<Service.ExecuteActionRequest, Service.ExecuteActionResponse>(e.request);
                            const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, result: undefined };
                            if (!response.result) {
                                const action = fetcher.payload.action.split(".");
                                if (action[0] === "Query") {
                                    const queryAction = fetcher.payload as Service.ExecuteQueryActionRequest;
                                    const actionsClass = await ServiceWorkerActions.get(queryAction.query.persistentObject.type, this);
                                    response.result = Wrappers.PersistentObjectWrapper._unwrap(await actionsClass.onExecuteQueryAction(action[1], Wrappers.QueryWrapper._wrap(queryAction.query), queryAction.selectedItems.map(i => Wrappers.QueryResultItemWrapper._wrap(i)), queryAction.parameters));
                                }
                                else if (action[0] === "PersistentObject") {
                                    const persistentObjectAction = fetcher.payload as Service.ExecutePersistentObjectActionRequest;
                                    const actionsClass = await ServiceWorkerActions.get(persistentObjectAction.parent.type, this);
                                    response.result = Wrappers.PersistentObjectWrapper._unwrap(await actionsClass.onExecutePersistentObjectAction(action[1], Wrappers.PersistentObjectWrapper._wrap(persistentObjectAction.parent), persistentObjectAction.parameters));
                                }
                            }
                            else
                                this.authToken = response.authToken;

                            return this.createResponse(response);
                        }
                        else if (e.request.url.endsWith("ExecuteQuery")) {
                            const fetcher = await this._createFetcher<Service.ExecuteQueryRequest, Service.ExecuteQueryResponse>(e.request);
                            const response = await fetcher.fetch(fetcher.payload) || { authToken: this.authToken, result: undefined };
                            if (!response.result) {
                                const actionsClass = await ServiceWorkerActions.get(fetcher.payload.query.persistentObject.type, this);
                                response.result = Wrappers.QueryResultWrapper._unwrap(await actionsClass.onExecuteQuery(Wrappers.QueryWrapper._wrap(fetcher.payload.query)));
                            }
                            else
                                this.authToken = response.authToken;

                            return this.createResponse(response);
                        }
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

        private async _getOffline(id: string, authToken: string, userName: string) {
            const payload: Service.GetPersistentObjectRequest = {
                authToken: authToken,
                userName: userName,
                environment: "Web,ServiceWorker",
                environmentVersion: "2",
                clientVersion: "",
                persistentObjectTypeId: id
            };

            const response = await fetch(new Request(`${this.serviceUri.trimEnd("/")}/GetPersistentObject`, {
                body: JSON.stringify(payload),
                cache: "no-cache",
                headers: {
                    "content-type": "application/json",
                    "user-agent": navigator.userAgent
                },
                method: "POST",
                referrer: self.location.toString()
            }));

            if (!response.headers.get("content-type").startsWith("application/json")) {
                console.error(`Unable to get offline data.\n${response.text()}`);
                return;
            }

            const responseData = <Service.GetPersistentObjectResponse>await response.json();
            const offline = <Service.PersistentObject>responseData.result;

            type Query = Service.Query & { newPersistentObject: Service.PersistentObject };
            for (let i = 0; i < offline.queries.length; i++) {
                const query = <Query>offline.queries[i];


                if (query.result) {
                    await this._db.save({
                        id: query.id,
                        result: query.result,
                        deleted: []
                    }, "QueryResults");

                    delete query.result;
                }

                const newPersistentObject = query.newPersistentObject;
                if (newPersistentObject)
                    delete query.newPersistentObject;

                await this._db.save({
                    id: query.id,
                    query: query,
                    newPersistentObject: newPersistentObject
                }, "Queries");

                await this.db.save({
                    id: query.id,
                    name: query.persistentObject.type
                }, "ActionClassesById");

                await this.db.save({
                    id: query.persistentObject.id,
                    query: query.id,
                    persistentObject: query.persistentObject
                }, "PersistentObjects");

                await this.db.save({
                    id: query.persistentObject.id,
                    name: query.persistentObject.type
                }, "ActionClassesById");
            }
        }

        protected async onGetClientData(): Promise<Service.ClientData> {
            return (await this.db.load("GetClientData", "Requests")).response;
        }

        protected async onCacheClientData(clientData: Service.ClientData) {
            await this.db.save({
                id: "GetClientData",
                response: clientData
            }, "Requests");
        }

        protected async onCacheApplication(application: Service.ApplicationResponse) {
            application.application.attributes.filter(a => a.name === "FeedbackId" || a.name === "GlobalSearchId" || a.name === "UserSettingsId").forEach(a => a.value = "00000000-0000-0000-0000-000000000000");
            application.application.attributes.filter(a => a.name === "AnalyticsKey" || a.name === "InstantSearchDelay").forEach(a => a.value = undefined);
            application.application.attributes.filter(a => a.name === "CanProfile").forEach(a => a.value = "False");

            await this.db.save({
                id: "GetApplication",
                response: application
            }, "Requests");

            const offlineAttribute = application.application.attributes.find(a => a.name === "OfflineId");
            if (offlineAttribute != null && offlineAttribute.value != null)
                this._getOffline(offlineAttribute.value, application.authToken, application.userName);
        }

        protected async onGetApplication(): Promise<Service.ApplicationResponse> {
            return (await this.db.load("GetApplication", "Requests")).response;
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
}