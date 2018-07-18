namespace Vidyano {
    export type Store = "Requests" | "Queries" | "PersistentObjects" | "ActionClassesById";
    export type RequestMapKey = "GetQuery" | "GetPersistentObject"

    export interface IStoreGetClientDataRequest {
        id: string;
        response: IClientData;
    }

    export interface IStoreGetApplicationRequest {
        id: string;
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

        async saveRequest<K extends keyof RequestsStoreNameMap>(entry: RequestsStoreNameMap[K]): Promise<void> {
            return this.save(entry, "Requests");
        }

        async save<K extends keyof StoreNameMap>(entry: StoreNameMap[K], store: K): Promise<void> {
            await this._initializing;

            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            const storeEntry: any = { id: entry.id };
            for (let prop in entry) {
                if (prop === "id")
                    continue;

                const value = entry[prop];
                if (!value)
                    continue;

                storeEntry[prop] = typeof value === "object" ? JSON.stringify(value) : value;
            }

            requests.put(entry);
        }

        async loadRequest<K extends keyof RequestsStoreNameMap>(key: K): Promise<RequestsStoreNameMap[K]> {
            return this.load(key, "Requests");
        }

        async load<K extends keyof StoreNameMap>(key: string, store: K): Promise<StoreNameMap[K]> {
            await this._initializing;

            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            return await new Promise<any>((resolve, reject) => {
                const getData = requests.get(key);
                getData.onsuccess = () => {
                    if (getData.result) {
                        for (let prop in getData.result) {
                            if (prop === "id")
                                continue;

                            const value = <string>getData.result[prop];
                            if (value && value[0] === "{")
                                getData.result[prop] = JSON.parse(value);
                        }
                    }

                    resolve(getData.result)
                };
                getData.onerror = () => resolve(null);
            });
        }
    }
}