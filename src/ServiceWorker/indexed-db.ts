namespace Vidyano {
    export type Store = "Requests" | "Queries" | "PersistentObjects" | "ActionClassesById";
    export type RequestMapKey = "GetQuery" | "GetPersistentObject"

    export interface IStoreGetClientDataRequest {
        id: "GetClientData";
        response: IClientData;
    }

    export interface IStoreGetApplicationRequest {
        id: "GetApplication";
        response: IApplicationResponse;
    }

    export interface IStoreQuery {
        id: string;
        query: IQuery;
    }

    export interface IStorePersistentObject {
        id: string;
        query?: string;
        persistentObject: IPersistentObject;
    }

    export interface IStoreActionClassById {
        id: string;
        name: string;
    }

    export interface StoreNameMap {
        "Requests": IStoreGetClientDataRequest | IStoreGetApplicationRequest;
        "Queries": IStoreQuery;
        "PersistentObjects": IStorePersistentObject;
        "ActionClassesById": IStoreActionClassById;
    }

    export interface RequestsStoreNameMap {
        "GetClientData": IStoreGetClientDataRequest;
        "GetApplication": IStoreGetApplicationRequest;
    }

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