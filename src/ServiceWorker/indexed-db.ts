namespace Vidyano {
    export type Store = "Requests" | "Queries" | "QueryResults" | "PersistentObjects" | "ActionClassesById";
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
        newPersistentObject?: Service.PersistentObject;
    } & Service.Query;

    export type StoreQueryResultItem = {
        queryId: string;
    } & Service.QueryResultItem;

    export type StorePersistentObject = {
        queryId: string;
    } & Service.PersistentObject;

    export type StoreActionClassById = {
        id: string;
        name: string;
    };

    export type StoreNameMap = {
        "Requests": StoreGetClientDataRequest | StoreGetApplicationRequest;
        "Queries": StoreQuery;
        "QueryResults": StoreQueryResultItem;
        "PersistentObjects": StorePersistentObject;
        "ActionClassesById": StoreActionClassById;
    };

    export type RequestsStoreNameMap = {
        "GetClientData": StoreGetClientDataRequest;
        "GetApplication": StoreGetApplicationRequest;
    };

    type ByKey<T> = { [key: string]: T; };

    export class IndexedDB {
        private _initializing: Promise<void>;
        private _db: Idb.DB;

        constructor() {
            this._initializing = new Promise<void>(async resolve => {
                this._db = await idb.open("vidyano.offline", 1, upgrade => {
                    upgrade.createObjectStore("Requests", { keyPath: "id" });
                    const queries = upgrade.createObjectStore("Queries", { keyPath: "id" });
                    queries.createIndex("ByPersistentObjectId", "query.persistentObject.id");

                    const queryResults = upgrade.createObjectStore("QueryResults", { keyPath: ["queryId", "id"] });
                    queryResults.createIndex("ByQueryId", "queryId");

                    upgrade.createObjectStore("PersistentObjects", { keyPath: "id" });
                    upgrade.createObjectStore("ActionClassesById", { keyPath: "id" });
                });

                resolve();
            });
        }

        get db(): Idb.DB {
            return this._db;
        }

        async save<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", entry: RequestsStoreNameMap[I]): Promise<void>;
        async save<K extends keyof StoreNameMap>(store: K, entry: StoreNameMap[K]): Promise<void>;
        async save<K extends keyof StoreNameMap>(storeName: K, entry: StoreNameMap[K]): Promise<void> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            await store.put(entry);
            await tx.complete;
        }

        async saveAll<K extends keyof StoreNameMap>(storeName: K, entries: StoreNameMap[K][]): Promise<void> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);


            for (let i = 0; i < entries.length; i++)
                await store.put(entries[i]);

            await tx.complete;
        }

        async load<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", key: I): Promise<RequestsStoreNameMap[I]>;
        async load<K extends keyof StoreNameMap>(store: K, key: string | string[]): Promise<StoreNameMap[K]>;
        async load<K extends keyof StoreNameMap>(storeName: K, key: string | string[]): Promise<StoreNameMap[K]> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            return await store.get(key);
        }

        async loadAll<K extends keyof StoreNameMap>(storeName: K, indexName?: string, key?: string): Promise<StoreNameMap[K][]> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            if (indexName)
                return await store.index(indexName).getAll(key);

            return await store.getAll(key);
        }
    }
}