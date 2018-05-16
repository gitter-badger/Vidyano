namespace Vidyano {
    const CACHE_NAME = "vidyano.offline";

    export type Store = "Requests" | "GetQueries" | "GetPersistentObjects";
    type RequestMapKey = "GetApplication" | "GetQuery" | "GetPersistentObject";

    export class ServiceWorker {
        private _initializeDB: Promise<void>;
        private _db: IDBDatabase;
        private _rootPath: string;
        private _requestHandlerMap = new Map<RequestMapKey, ServiceWorkerRequestHandler[]>();

        constructor(private _offline?: boolean, private _verbose?: boolean) {
            this._initializeDB = new Promise<void>(resolve => {
                const dboOpen = indexedDB.open("vidyano.offline", 1);
                dboOpen.onupgradeneeded = () => {
                    var db = <IDBDatabase>dboOpen.result;
                    db.createObjectStore("Requests", { keyPath: "id" });
                    db.createObjectStore("GetQueries", { keyPath: "id" });
                    db.createObjectStore("GetPersistentObjects", { keyPath: "typeId" });
                };

                dboOpen.onsuccess = () => {
                    this._db = <IDBDatabase>dboOpen.result;
                    resolve();
                };
            });

            self.addEventListener("install", (e: ExtendableEvent) => e.waitUntil(this._onInstall(e)));
            self.addEventListener("activate", (e: ExtendableEvent) => e.waitUntil(this._onActivate(e)));
            self.addEventListener("fetch", (e: FetchEvent) => e.respondWith(this._onFetch(e)));
        }

        private _log(message: string) {
            if (!this._verbose)
                return;

            console.log("SW: " + message);
        }

        private async _onInstall(e: ExtendableEvent): Promise<void> {
            this._log("Installed ServiceWorker");

            this._rootPath = self.location.href.split("service-worker.js")[0];
            const base = location.href.substr(location.origin.length).split("service-worker.js")[0];

            const urls = [
                `${base}`,
                `${base}web2/Libs/webcomponentsjs/webcomponents-lite.js`,
                `${base}web2/vidyano.html`,
                `${base}web2/Libs/polymer/polymer.html`,
                `${base}web2/Libs/layout/layout.html`,
                `${base}web2/vidyano-lite.html`,
                `${base}web2/WebComponents/App/app.html`,
                `${base}web2/Libs/polymer/polymer-mini.html`,
                `${base}web2/Libs/polymer/polymer-micro.html`,
                `${base}web2/Libs/iron-a11y-keys/iron-a11y-keys.html`,
                `${base}web2/Libs/iron-collapse/iron-collapse.html`,
                `${base}web2/Libs/iron-list/iron-list.html`,
                `${base}web2/Libs/iron-media-query/iron-media-query.html`,
                `${base}web2/Libs/alertify.js/alertify.html`,
                `${base}web2/Libs/paper-ripple/paper-ripple.html`,
                `${base}web2/WebComponents/WebComponent/webcomponent.html`,
                `${base}web2/WebComponents/Spinner/spinner.html`,
                `${base}web2/WebComponents/AppRoutePresenter/app-route-presenter.html`,
                `${base}web2/WebComponents/AppRoute/app-route.html`,
                `${base}web2/WebComponents/Button/button.html`,
                `${base}web2/WebComponents/Dialog/dialog.html`,
                `${base}web2/WebComponents/Error/error.html`,
                `${base}web2/WebComponents/Grid/grid.html`,
                `${base}web2/WebComponents/Icon/icon.html`,
                `${base}web2/WebComponents/Popup/popup.html`,
                `${base}web2/WebComponents/SessionPresenter/session-presenter.html`,
                `${base}web2/WebComponents/SizeTracker/size-tracker.html`,
                `${base}web2/WebComponents/SignIn/sign-in.html`,
                `${base}web2/WebComponents/SignOut/sign-out.html`,
                `${base}web2/Libs/iron-a11y-keys-behavior/iron-a11y-keys-behavior.html`,
                `${base}web2/Libs/iron-resizable-behavior/iron-resizable-behavior.html`,
                `${base}web2/Libs/iron-scroll-target-behavior/iron-scroll-target-behavior.html`,
                `${base}web2/Libs/iron-overlay-behavior/iron-overlay-behavior.html`,
                `${base}web2/WebComponents/Resource/resource.html`,
                `${base}web2/WebComponents/AttachedNotifier/attached-notifier.html`,
                `${base}web2/WebComponents/Checkbox/checkbox.html`,
                `${base}web2/WebComponents/Scroller/scroller.html`,
                `${base}web2/Libs/iron-fit-behavior/iron-fit-behavior.html`,
                `${base}web2/Libs/iron-overlay-behavior/iron-overlay-manager.html`,
                `${base}web2/Libs/iron-overlay-behavior/iron-focusables-helper.html`,
                `${base}web2/Libs/iron-overlay-behavior/iron-overlay-backdrop.html`,
                `${base}web2/WebComponents/PopupMenu/popup-menu.html`,
                `${base}web2/WebComponents/PersistentObjectPresenter/persistent-object-presenter.html`,
                `${base}web2/WebComponents/PersistentObjectAttributePresenter/persistent-object-attribute-presenter.html`,
                `${base}web2/WebComponents/Attributes/persistent-object-attribute.html`,
                `${base}web2/WebComponents/Attributes/PersistentObjectAttributeString/persistent-object-attribute-string.html`,
                `${base}web2/WebComponents/PersistentObjectAttributeLabel/persistent-object-attribute-label.html`,
                `${base}web2/WebComponents/Attributes/persistent-object-attribute-edit.html`,
                `${base}web2/WebComponents/Attributes/PersistentObjectAttributeValidationError/persistent-object-attribute-validation-error.html`,
                `${base}web2/WebComponents/MessageDialog/message-dialog.html`,
                `${base}web2/WebComponents/Menu/menu.html`,
                `${base}web2/WebComponents/InputSearch/input-search.html`,
                `${base}web2/WebComponents/User/user.html`,
                `${base}web2/WebComponents/PersistentObject/persistent-object.html`,
                `${base}web2/WebComponents/ActionBar/action-bar.html`,
                `${base}web2/WebComponents/Notification/notification.html`,
                `${base}web2/WebComponents/PersistentObjectTabBar/persistent-object-tab-bar.html`,
                `${base}web2/WebComponents/PersistentObjectTabPresenter/persistent-object-tab-presenter.html`,
                `${base}web2/WebComponents/PersistentObjectTab/persistent-object-tab.html`,
                `${base}web2/WebComponents/ActionButton/action-button.html`,
                `${base}web2/WebComponents/ChartSelector/chart-selector.html`,
                `${base}web2/WebComponents/Overflow/overflow.html`,
                `${base}web2/WebComponents/PersistentObjectGroup/persistent-object-group.html`,
                `${base}web2/WebComponents/QueryItemsPresenter/query-items-presenter.html`,
                `${base}web2/WebComponents/Attributes/PersistentObjectAttributeTranslatedString/persistent-object-attribute-translated-string.html`,
                `${base}web2/WebComponents/Attributes/PersistentObjectAttributeNumeric/persistent-object-attribute-numeric.html`,
                `${base}web2/WebComponents/Attributes/PersistentObjectAttributeBoolean/persistent-object-attribute-boolean.html`,
                `${base}web2/WebComponents/Chart/chart.html`,
                `${base}web2/WebComponents/FileDrop/file-drop.html`,
                `${base}web2/WebComponents/Select/select.html`,
                `${base}web2/WebComponents/Toggle/toggle.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid.html`,
                `${base}web2/WebComponents/ProgramUnitPresenter/program-unit-presenter.html`,
                `${base}web2/WebComponents/Style/style.html`,
                `${base}web2/WebComponents/Sortable/sortable.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-configure-dialog.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-select-all.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-column-header.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-column-footer.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-filters.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-filter-dialog.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-cells.html`,
                `${base}web2/WebComponents/QueryGrid/query-grid-column-filter.html`,
                `${base}web2/WebComponents/List/list.html`,
                `${base}web2/WebComponents/QueryPresenter/query-presenter.html`,
                `${base}web2/WebComponents/Query/query.html`,
                `${base}GetClientData?v=2`
            ];

            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(urls);

            await Promise.all(urls.map(url => fetch(url)));
        }

        private async _onActivate(e: ExtendableEvent) {
            this._log("Activated ServiceWorker");
            await this._initializeDB;

            const addRequestHandler = (key: RequestMapKey, handler: ServiceWorkerRequestHandler) => {
                if (!this._requestHandlerMap.has(key))
                    this._requestHandlerMap.set(key, [handler]);
                else
                    this._requestHandlerMap.get(key).push(handler);
            }

            const registerRequestHandler = (handler: ServiceWorkerRequestHandler) => {
                if (handler instanceof ServiceWorkerGetApplicationRequestHandler) {
                    if (!this._requestHandlerMap.has("GetApplication"))
                        this._requestHandlerMap.set("GetApplication", [handler]);
                    else
                        throw "A handler for GetApplication was already registered.";
                }
                else if (handler instanceof ServiceWorkerGetQueryRequestHandler)
                    addRequestHandler("GetQuery", handler);
                else if (handler instanceof ServiceWorkerGetPersistentObjectRequestHandler)
                    addRequestHandler("GetPersistentObject", handler);

                handler["_db"] = this._db;
            };

            this.onRegisterRequestHandlers(registerRequestHandler);

            // Install default handlers
            if (!this._requestHandlerMap.has("GetApplication") && (this._requestHandlerMap.size > 0 || this._offline))
                registerRequestHandler(new ServiceWorkerGetApplicationRequestHandler());
            if (!this._requestHandlerMap.has("GetQuery") && this._offline)
                registerRequestHandler(new ServiceWorkerGetQueryRequestHandler());
            if (!this._requestHandlerMap.has("GetPersistentObject") && this._offline)
                registerRequestHandler(new ServiceWorkerGetPersistentObjectRequestHandler());

            // NOTE: MISSING JS FILES DURING DEVELOPMENT, SO RELOAD IS STILL REQUIRED
            e.waitUntil((self as ServiceWorkerGlobalScope).clients.claim());
        }

        protected async onRegisterRequestHandlers(register: (handler: ServiceWorkerRequestHandler) => void) {
        }

        private async _onFetch(e: FetchEventInit) {
            this._log(`Fetch (${e.request.url})`);
            await this._initializeDB;

            try {
                if (e.request.method === "POST" && e.request.url.startsWith(this._rootPath)) {
                    const fetchResponse: { body?: any; response?: Response; } = {};
                    
                    if (e.request.url.endsWith("GetApplication") && this._requestHandlerMap.has("GetApplication"))
                        fetchResponse.body = await this._requestHandlerMap.get("GetApplication")[0].fetch(await e.request.clone().json(), this._createFetcher(e.request, fetchResponse));
                    else if (e.request.url.endsWith("GetQuery") && this._requestHandlerMap.has("GetQuery"))
                        await this._callFetchHanders("GetQuery", e.request, fetchResponse);
                    else if (e.request.url.endsWith("GetPersistentObject") && this._requestHandlerMap.has("GetPersistentObject"))
                        await this._callFetchHanders("GetPersistentObject", e.request, fetchResponse);

                    if (fetchResponse.body)
                        return this.createResponse(fetchResponse.body, fetchResponse.response);
                }

                let response: Response;
                try {
                    response = await fetch(e.request);
                }
                catch (error) { }

                if (e.request.method === "GET") {
                    if (response) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(e.request, response.clone());
                    }
                    else
                        response = await caches.match(e.request);
                }

                if (e.request.url.endsWith("GetClientData?v=2") && Vidyano.ServiceWorker.prototype.onGetClientData !== this.onGetClientData) {
                    const clientData = await this.onGetClientData(await response.clone().json());
                    return this.createResponse(clientData);
                }

                if (!response && e.request.url.startsWith(this._rootPath) && e.request.method === "GET")
                    return await caches.match(this._rootPath); // Fallback to root document when a deeplink is loaded directly

                return response;
            }
            catch (ee) {
                console.error(ee);

                return new Response("<h1>Service Unavailable</h1>", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({
                        "Content-Type": "text/html"
                    })
                });
            }
        }

        private _createFetcher(originalRequest: Request, response: { response?: Response; }): Fetcher<Service.IRequest, any> {
            return async payload => {
                const fetchRquest = this.createRequest(payload, originalRequest);
                try {
                    response.response = await fetch(fetchRquest);
                }
                catch (ex) {
                    return;
                }

                return response.response.json();
            };
        }

        private async _callFetchHanders<T>(key: RequestMapKey, request: Request, response: { body?: any; response?: Response; }) {
            const handlers = this._requestHandlerMap.get(key);
            if (!handlers)
                return;

            for (let i = 0; i < handlers.length; i++) {
                const responseBody = await handlers[i].fetch(await request.clone().json(), this._createFetcher(request, response));
                if (!responseBody)
                    continue;

                response.body = responseBody;
            }
        }

        protected onGetClientData(clientData: Service.IClientData): Promise<Service.IClientData> {
            return Promise.resolve(clientData);
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
            if (typeof data === "object")
                data = JSON.stringify(data);

            return new Response(data, response ? {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText
            } : null);
        }
    }

    export type Fetcher<TRequestPayload, TResponseBody> = (payload: TRequestPayload) => Promise<TResponseBody>;
    export type IGetApplicationRequest = Service.IGetApplicationRequest;
    export type IApplication = Service.IApplication;
    export type IGetQueryRequest = Service.IGetQueryRequest;
    export type IQuery = Service.IQuery;
    export type IGetPersistentObjectRequest = Service.IGetPersistentObjectRequest;
    export type IPersistentObject = Service.IPersistentObject;

    export abstract class ServiceWorkerRequestHandler {
        protected save(store: Store, entry: any) {
            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            requests.put(entry);
        }

        protected async load(store: Store, key: any) {
            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            return await new Promise<any>((resolve, reject) => {
                const getData = requests.get(key);
                getData.onsuccess = () => resolve(getData.result);
                getData.onerror = () => resolve(null);
            });
        }

        protected async _fetch(request: Request): Promise<Response> {
            try {
                return await fetch(request);
            }
            catch (e) {
                return null;
            }
        }

        get db(): IDBDatabase {
            return this["_db"];
        }

        async fetch(payload: any, fetcher: Fetcher<Service.IRequest, any>): Promise<any> {
            return await fetcher(payload);
        }
    }

    export class ServiceWorkerGetApplicationRequestHandler extends ServiceWorkerRequestHandler {
        async fetch(payload: IGetApplicationRequest, fetcher: Fetcher<IGetApplicationRequest, IApplication>): Promise<IApplication> {
            const application = await fetcher(payload);
            if (!application) {
                const cachedApplication = await this.load("Requests", "GetApplication");
                return cachedApplication ? JSON.parse(cachedApplication.response) : null;
            }

            this.save("Requests", {
                id: "GetApplication",
                response: JSON.stringify(application)
            });

            return application;
        }
    }

    export class ServiceWorkerGetQueryRequestHandler extends ServiceWorkerRequestHandler {
        async fetch(payload: IGetQueryRequest, fetcher: Fetcher<IGetQueryRequest, IQuery>): Promise<IQuery> {
            const query = await fetcher(payload);
            if (!query) {
                const cachedQuery = await this.load("GetQueries", payload.id);
                return cachedQuery ? JSON.parse(cachedQuery.response) : null;
            }

            this.save("GetQueries", {
                id: payload.id,
                response: JSON.stringify(query)
            });

            return query;
        }
    }

    export class ServiceWorkerGetPersistentObjectRequestHandler extends ServiceWorkerRequestHandler {
        async fetch(payload: IGetPersistentObjectRequest, fetcher: Fetcher<IGetPersistentObjectRequest, IPersistentObject>): Promise<IPersistentObject> {
            const po = await fetcher(payload);
            if (!po) {
                const cachedPO = await this.load("GetPersistentObjects", payload.persistentObjectTypeId);
                return cachedPO ? JSON.parse(cachedPO.response) : null;
            }

            this.save("GetPersistentObjects", {
                typeId: payload.persistentObjectTypeId,
                objectId: payload.objectId,
                isNew: payload.isNew,
                parent: JSON.stringify(payload.parent),
                response: JSON.stringify(po)
            });

            return po;
        }
    }
}