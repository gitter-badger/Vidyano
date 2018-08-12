namespace Vidyano {
    export type Store = "Requests" | "Queries" | "QueryResults" | "PersistentObjects" | "ActionClassesById" | "Changes";
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
        persistentObjectId: string;
    } & Service.QueryResultItem;

    export type StorePersistentObject = Service.PersistentObject;

    export type StoreActionClassById = {
        id: string;
        name: string;
    };

    export type StoreChange = {
        id: string;
        type: "New" | "Update" | "Delete";
        objectId?: string;
    };

    export type StoreNameMap = {
        "Requests": StoreGetClientDataRequest | StoreGetApplicationRequest;
        "Queries": StoreQuery;
        "QueryResults": StoreQueryResultItem;
        "PersistentObjects": StorePersistentObject;
        "ActionClassesById": StoreActionClassById;
        "Changes": StoreChange;
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
                    queries.createIndex("ByPersistentObjectId", "persistentObject.id");

                    const queryResults = upgrade.createObjectStore("QueryResults", { keyPath: ["queryId", "persistentObjectId", "id"] });
                    queryResults.createIndex("ByQueryId", "queryId");
                    queryResults.createIndex("ByPersistentObjectId", ["persistentObjectId", "id"]);

                    upgrade.createObjectStore("PersistentObjects", { keyPath: "id" });
                    upgrade.createObjectStore("ActionClassesById", { keyPath: "id" });

                    upgrade.createObjectStore("Changes", { keyPath: "id", autoIncrement: true });
                });

                resolve();
            });
        }

        get db(): Idb.DB {
            return this._db;
        }

        async clear<K extends keyof StoreNameMap>(storeName: K) {
            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            await store.clear();
            await tx.complete;
        }

        async exists<K extends keyof StoreNameMap>(storeName: K, key: string | string[]): Promise<boolean> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            return !!await store.getKey(key);
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

        async addAll<K extends keyof StoreNameMap>(storeName: K, entries: StoreNameMap[K][]): Promise<void> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            for (let i = 0; i < entries.length; i++)
                store.add(entries[i]);

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

        private async load<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", key: I): Promise<RequestsStoreNameMap[I]>;
        private async load<K extends keyof StoreNameMap>(store: K, key: string | string[]): Promise<StoreNameMap[K]>;
        private async load<K extends keyof StoreNameMap>(storeName: K, key: string | string[]): Promise<StoreNameMap[K]> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            return await store.get(key);
        }

        async loadAll<K extends keyof StoreNameMap>(storeName: K, indexName?: string, key?: any): Promise<StoreNameMap[K][]> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);

            if (indexName)
                return await store.index(indexName).getAll(key);

            return await store.getAll(key);
        }

        async deleteAll<K extends keyof StoreNameMap>(storeName: K, condition: (item: StoreNameMap[K]) => boolean): Promise<number>;
        async deleteAll<K extends keyof StoreNameMap>(storeName: K, index: string, indexKey: IDBValidKey, condition: (item: StoreNameMap[K]) => boolean): Promise<number>;
        async deleteAll<K extends keyof StoreNameMap>(storeName: K, indexOrCondition: string | ((item: StoreNameMap[K]) => boolean), indexKey?: IDBValidKey, condition?: (item: StoreNameMap[K]) => boolean): Promise<number> {
            await this._initializing;

            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            let cursor: Idb.Cursor<any, any>;

            if (!indexKey) {
                condition = <(item: StoreNameMap[K]) => boolean>indexOrCondition;
                cursor = await store.openKeyCursor();
            }
            else
                cursor = await store.index(<string>indexOrCondition).openCursor(indexKey);

            let nDeleted = 0;
            while (cursor) {
                if (condition(cursor.value)) {
                    await cursor.delete();
                    nDeleted++;
                }

                cursor = await cursor.continue();
            }

            return nDeleted;
        }

        getActionClass(name: string): Promise<StoreActionClassById> {
            return this.load("ActionClassesById", name);
        }

        getRequest<K extends keyof RequestsStoreNameMap>(id: K): Promise<RequestsStoreNameMap[K]> {
            return this.load("Requests", id);
        }

        async getQuery(id: string, results?: "always" | "ifAutoQuery"): Promise<Query> {
            const query = await this.load("Queries", id);
            if (query.result && (results === "always" || (query.autoQuery && results === "ifAutoQuery")))
                query.result.items = await this.loadAll("QueryResults", "ByQueryId", id);

            return Wrappers.QueryWrapper._wrap(query);
        }

        async getQueryResults(id: string, parentPeristentObjectId?: string, parentObjectId?: string, ): Promise<QueryResultItem[]> {
            const tx = await this.db.transaction(["Queries", "QueryResults", "PersistentObjects"], "readonly");
            let items: Service.QueryResultItem[];
            if (!parentPeristentObjectId) {
                items = <Service.QueryResultItem[]>await tx.objectStore("QueryResults").index("ByQueryId").getAll(id);
            }
            else {
                const parentPersistentObject = <StorePersistentObject>await tx.objectStore("PersistentObjects").get(parentPeristentObjectId);
                const detailQuery = <StoreQuery>await tx.objectStore("Queries").get(id);
                const detailSourceQuery = <StoreQuery>await tx.objectStore("Queries").index("ByPersistentObjectId").get(detailQuery.persistentObject.id);

                const keyColumn = detailSourceQuery.columns.find(c => c.type === "Reference" && c.persistentObjectId === parentPeristentObjectId);
                if (!keyColumn) {
                    console.error(`Unable to resolve reference column for detail query "${detailQuery.name}"`);
                    return [];
                }

                items = [];
                let detailItemsCursor = await tx.objectStore("QueryResults").index("ByQueryId").openCursor(detailSourceQuery.id);
                let i = 0;
                while (detailItemsCursor) {
                    const detailItem = <Service.QueryResultItem>detailItemsCursor.value;
                    const keyValue = detailItem.values.find(v => v.key === keyColumn.name);
                    if (keyValue && keyValue.objectId === parentObjectId)
                        items.push(detailItem);

                    detailItemsCursor = await detailItemsCursor.continue();
                }
            }

            return items.map(i => Wrappers.QueryResultItemWrapper._wrap(i));
        }

        async getWritableQuery(id: string, transaction?: Idb.Transaction): Promise<Query> {
            const tx = transaction || await this.db.transaction(["QueryResults", "Changes"], "readwrite");
            const query = await tx.objectStore("Queries").get(id);

            return query ? Wrappers.QueryWrapper._wrap(query, tx) : null;
        }

        async getPersistentObject(id: string, objectId?: string): Promise<PersistentObject> {
            const tx = this.db.transaction(["QueryResults", "Queries"], "readonly");

            const query = <Service.Query>await tx.objectStore("Queries").index("ByPersistentObjectId").get(id);
            if (!query)
                return null;

            const item = <Service.QueryResultItem>await tx.objectStore("QueryResults").index("ByPersistentObjectId").get([id, objectId]);
            if (!item)
                return null;

            const po = query.persistentObject;
            po.objectId = objectId;
            po.attributes.forEach(attr => {
                const value = item.values.find(v => v.key === attr.name);
                if (value == null)
                    return;

                attr.value = value.value;
            });

            return Wrappers.PersistentObjectWrapper._wrap(po);
        }

        async getNewPersistentObject(query: Query): Promise<PersistentObject> {
            const storedQuery = await this.load("Queries", query.id);
            return Wrappers.PersistentObjectWrapper._wrap(storedQuery.newPersistentObject);
        }
    }
}