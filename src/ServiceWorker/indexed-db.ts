namespace Vidyano {
    export type Store = "Requests" | "Queries" | "PersistentObjects" | "ActionClassesById";
    export type RequestMapKey = "GetQuery" | "GetPersistentObject"

    export type StoreGetClientDataRequest = {
        id: "GetClientData";
        response: Service.ClientData;
    };

    export type StoreGetApplicationRequest = {
        id: "GetApplication";
        response: Service.ApplicationResponse;
    }

    export type StoreQuery = {
        id: string;
        query: Service.Query;
    };

    export type StorePersistentObject = {
        id: string;
        query?: string;
        persistentObject: Service.PersistentObject;
    };

    export type StoreActionClassById = {
        id: string;
        name: string;
    };

    export type StoreNameMap = {
        "Requests": StoreGetClientDataRequest | StoreGetApplicationRequest;
        "Queries": StoreQuery;
        "PersistentObjects": StorePersistentObject;
        "ActionClassesById": StoreActionClassById;
    };

    export type RequestsStoreNameMap = {
        "GetClientData": StoreGetClientDataRequest;
        "GetApplication": StoreGetApplicationRequest;
    };

    export class IndexedDB {
        private _initializing: Promise<void>;
        private _db: IDBDatabase;

        constructor() {
            this._initializing = new Promise<void>(resolve => {
                const dboOpen = indexedDB.open("vidyano.offline", 1);
                dboOpen.onupgradeneeded = (version: IDBVersionChangeEvent) => {
                    var db = <IDBDatabase>dboOpen.result;
                    db.createObjectStore("Requests", { keyPath: "id" });
                    db.createObjectStore("Queries", { keyPath: "id" });
                    db.createObjectStore("PersistentObjects", { keyPath: "id" });
                    db.createObjectStore("ActionClassesById", { keyPath: "id" });
                };

                dboOpen.onsuccess = () => {
                    this._db = <IDBDatabase>dboOpen.result;
                    resolve();
                };
            });
        }

        get db(): IDBDatabase {
            return this._db;
        }

        async save<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(entry: RequestsStoreNameMap[I], store: "Requests"): Promise<void>;
        async save<K extends keyof StoreNameMap>(entry: StoreNameMap[K], store: K): Promise<void>;
        async save<K extends keyof StoreNameMap>(entry: StoreNameMap[K], store: K): Promise<void> {
            await this._initializing;

            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);
            requests.put(entry);
        }

        async load<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(key: I, store: "Requests"): Promise<RequestsStoreNameMap[I]>;
        async load<K extends keyof StoreNameMap>(key: string, store: K): Promise<StoreNameMap[K]>;
        async load<K extends keyof StoreNameMap>(key: string, store: K): Promise<StoreNameMap[K]> {
            await this._initializing;

            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            return await new Promise<any>((resolve, reject) => {
                const getData = requests.get(key);
                getData.onsuccess = () => resolve(getData.result);
                getData.onerror = () => resolve(null);
            });
        }
    }
}