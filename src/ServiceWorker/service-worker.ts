namespace Vidyano {
    const CACHE_NAME = "vidyano.offline";

    interface IDBRequest {
        id: string;
        response: string;
    }

    export type Store = "Requests";

    export class ServiceWorker {
        private _initializeDB: Promise<void>;
        private _db: IDBDatabase;
        private _rootPath: string;

        constructor(private _offline?: boolean, private _verbose?: boolean) {
            this._initializeDB = new Promise<void>(resolve => {
                const dboOpen = indexedDB.open("vidyano.offline", 1);
                dboOpen.onupgradeneeded = () => {
                    var db = <IDBDatabase>dboOpen.result;
                    db.createObjectStore("Requests", { keyPath: "id" });
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

            // MISSING JS FILES DURING DEVELOPMENT, SO RELOAD IS STILL REQUIERD
            e.waitUntil((self as ServiceWorkerGlobalScope).clients.claim());
        }

        private async _onFetch(e: FetchEventInit) {
            this._log(`Fetch (${e.request.url})`);
            await this._initializeDB;

            try {
                let response: Response;
                try {
                    response = await fetch(e.request);
                }
                catch (error) { }

                if (e.request.method === "POST" && e.request.url.startsWith(this._rootPath)) {
                    if (e.request.url.endsWith("GetApplication")) {

                    }
                }
                else if (e.request.method === "GET") {
                    if (response) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(e.request, response.clone());
                    }
                    else
                        response = await caches.match(e.request);
                }

                if (e.request.url.endsWith("GetClientData?v=2") && Vidyano.ServiceWorker.prototype.onGetClientData !== this.onGetClientData) {
                    const clientData = this.onGetClientData(await response.clone().json());
                    return this._createResponse(clientData);
                }

                //try {
                //    if (response) {
                //        if (e.request.method === "GET") {
                //            const cache = await caches.open(CACHE_NAME);
                //            cache.put(e.request, response.clone());
                //        }
                //        else {
                //            const data = await response.clone().json();
                //            const tx = this._db.transaction("Requests", "readwrite");
                //            const requests = tx.objectStore("Requests");

                //            requests.put({
                //                id: e.request.url,
                //                response: JSON.stringify(data)
                //            });
                //        }
                //    }
                //}
                //catch (ee) {
                //    if (e.request.method !== "GET") {
                //        const tx = this._db.transaction("Requests", "readwrite");
                //        const requests = tx.objectStore("Requests");

                //        const result = await new Promise<IDBRequest>(resolve => {
                //            const getData = requests.get(e.request.url);
                //            getData.onsuccess = () => resolve(getData.result);
                //        });

                //        return new Response(result.response, {
                //            status: 200,
                //            headers: new Headers({
                //                "Content-Type": "application/json; charset=utf-8"
                //            })
                //        });
                //    }
                //}

                if (!response && e.request.url.startsWith(this._rootPath) && e.request.method === "GET")
                    return await caches.match(this._rootPath); // Fallback to root document when a deeplink is loaded directly

                return response;
            }
            catch (ee) {
                return new Response("<h1>Service Unavailable</h1>", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({
                        "Content-Type": "text/html"
                    })
                });
            }
        }

        protected _createResponse(data: any, response?: Response): Response {
            if (typeof data === "object")
                data = JSON.stringify(data);

            return new Response(data, response ? {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText
            } : null);
        }

        onGetClientData(clientData: Service.IClientData): Service.IClientData {
            return clientData;
        }
    }
}