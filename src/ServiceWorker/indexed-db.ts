﻿namespace Vidyano {
    export type Store = "Requests" | "Queries" | "QueryResults" | "ActionClassesById" | "Changes";
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
        hasResults: "true" | "false";
    } & Service.Query;

    export type StoreQueryResultItem = {
        persistentObjectId: string;
    } & Service.QueryResultItem;

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
        "ActionClassesById": StoreActionClassById;
        "Changes": StoreChange;
    };

    export type RequestsStoreNameMap = {
        "GetClientData": StoreGetClientDataRequest;
        "GetApplication": StoreGetApplicationRequest;
    };

    interface IndexedDBTransaction {
        clear<K extends keyof StoreNameMap>(storeName: K): Promise<void>;
        exists<K extends keyof StoreNameMap>(storeName: K, key: string | string[]): Promise<boolean>;
        save<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", entry: RequestsStoreNameMap[I]): Promise<void>;
        save<K extends keyof StoreNameMap>(store: K, entry: StoreNameMap[K]): Promise<void>;
        saveAll<K extends keyof StoreNameMap>(storeName: K, entries: StoreNameMap[K][]): Promise<void>;
        add<K extends keyof StoreNameMap>(storeName: K, entry: StoreNameMap[K]): Promise<void>;
        addAll<K extends keyof StoreNameMap>(storeName: K, entries: StoreNameMap[K][]): Promise<void>
        load<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", key: I): Promise<RequestsStoreNameMap[I]>;
        load<K extends keyof StoreNameMap>(store: K, key: string | string[]): Promise<StoreNameMap[K]>;
        loadAll<K extends keyof StoreNameMap>(storeName: K, indexName?: string, key?: any): Promise<StoreNameMap[K][]>;
        deleteAll<K extends keyof StoreNameMap>(storeName: K, condition: (item: StoreNameMap[K]) => boolean): Promise<number>;
        deleteAll<K extends keyof StoreNameMap>(storeName: K, index: string, indexKey: IDBValidKey, condition: (item: StoreNameMap[K]) => boolean): Promise<number>;
    }

    export interface IIndexedDBContext {
        delete(query: ReadOnlyQuery, items: QueryResultItem[]);
        getQuery(id: string, results?: "always" | "ifAutoQuery"): Promise<Query>;
        getQueryResults(query: ReadOnlyQuery, parent: ReadOnlyPersistentObject): Promise<QueryResultItem[]>;
        getPersistentObject(id: string, objectId?: string): Promise<PersistentObject>;
        getNewPersistentObject(query: ReadOnlyQuery): Promise<PersistentObject>;
        savePersistentObject(persistentObject: PersistentObject): Promise<PersistentObject>;
        saveChanges(): Promise<void>;
    }

    export class IndexedDB {
        private _initializing: Promise<void>;
        private _db: Idb.DB;

        constructor() {
            this._initializing = new Promise<void>(async resolve => {
                this._db = await idb.open("vidyano.offline", 1, upgrade => {
                    upgrade.createObjectStore("Requests", { keyPath: "id" });
                    const queries = upgrade.createObjectStore("Queries", { keyPath: "id" });
                    queries.createIndex("ByPersistentObjectId", "persistentObject.id");
                    queries.createIndex("ByPersistentObjectIdWithResults", ["persistentObject.id", "hasResults"]);

                    const queryResults = upgrade.createObjectStore("QueryResults", { keyPath: ["persistentObjectId", "id"] });
                    queryResults.createIndex("ByPersistentObjectId", "persistentObjectId");

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

        async createContext(): Promise<IndexedDBTransaction>;
        async createContext(): Promise<IIndexedDBContext>;
        async createContext(): Promise<IndexedDBContext> {
            await this._initializing;

            return new IndexedDBContext(this.db.transaction(["Requests", "Queries", "QueryResults", "ActionClassesById", "Changes"], "readwrite"));
        }

        async saveOffline(offline: Service.PersistentObject) {
            const context = <IndexedDBContext>await this.createContext();

            context.clear("Queries");
            context.clear("QueryResults");
            context.clear("ActionClassesById");
            context.clear("Changes");

            await this._saveOfflineQueries(context, offline.queries);

            for (let i = 0; i < offline.queries.length; i++)
                this._saveOfflineQueries(context, offline.queries[0].persistentObject.queries);

            await context.saveChanges();
        }

        private async _saveOfflineQueries(context: IndexedDBContext, queries: Service.Query[]) {
            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];

                if (await context.exists("Queries", query.id))
                    continue;

                if (query.result) {
                    const items = query.result.items;
                    await context.addAll("QueryResults", items.map(i => {
                        return {
                            ...i,
                            persistentObjectId: query.persistentObject.id
                        };
                    }));

                    query.result.items = [];
                }

                await context.save("Queries", {
                    ...query,
                    hasResults: query.result ? "true" : "false"
                });

                await context.save("ActionClassesById", {
                    id: query.id,
                    name: query.persistentObject.type
                });

                await context.save("ActionClassesById", {
                    id: query.persistentObject.id,
                    name: query.persistentObject.type
                });
            }
        }

        async getActionClass(name: string): Promise<StoreActionClassById> {
            const context = <IndexedDBContext>await this.createContext();
            return context.load("ActionClassesById", name);
        }

        async getRequest<K extends keyof RequestsStoreNameMap>(id: K): Promise<RequestsStoreNameMap[K]> {
            const context = <IndexedDBContext>await this.createContext();
            return context.load("Requests", id);
        }
    }

    class IndexedDBContext implements IIndexedDBContext, IndexedDBTransaction {
        constructor(private _transaction: Idb.Transaction) {
        }

        async clear<K extends keyof StoreNameMap>(storeName: K): Promise<void> {
            const store = this._transaction.objectStore(storeName);
            await store.clear();
        }

        async exists<K extends keyof StoreNameMap>(storeName: K, key: string | string[]): Promise<boolean> {
            const store = this._transaction.objectStore(storeName);
            return !!await store.getKey(key);
        }

        saveChanges(): Promise<void> {
            return this._transaction.complete;
        }

        async save<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", entry: RequestsStoreNameMap[I]): Promise<void>;
        async save<K extends keyof StoreNameMap>(store: K, entry: StoreNameMap[K]): Promise<void>;
        async save<K extends keyof StoreNameMap>(storeName?: K, entry?: StoreNameMap[K]): Promise<void> {
            await this._transaction.objectStore(storeName).put(entry);
        }

        async saveAll<K extends keyof StoreNameMap>(storeName: K, entries: StoreNameMap[K][]): Promise<void> {
            const store = this._transaction.objectStore(storeName);

            for (let i = 0; i < entries.length; i++)
                await store.put(entries[i]);
        }

        async add<K extends keyof StoreNameMap>(storeName: K, entry: StoreNameMap[K]): Promise<void> {
            const store = this._transaction.objectStore(storeName);
            store.add(entry);
        }

        async addAll<K extends keyof StoreNameMap>(storeName: K, entries: StoreNameMap[K][]): Promise<void> {
            const store = this._transaction.objectStore(storeName);

            for (let i = 0; i < entries.length; i++)
                store.add(entries[i]);
        }

        async load<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(store: "Requests", key: I): Promise<RequestsStoreNameMap[I]>;
        async load<K extends keyof StoreNameMap>(store: K, key: string | string[]): Promise<StoreNameMap[K]>;
        async load<K extends keyof StoreNameMap>(storeName: K, key: string | string[]): Promise<StoreNameMap[K]> {
            const store = this._transaction.objectStore(storeName);
            return await store.get(key);
        }

        async loadAll<K extends keyof StoreNameMap>(storeName: K, indexName?: string, key?: any): Promise<StoreNameMap[K][]> {
            const store = this._transaction.objectStore(storeName);

            if (indexName)
                return await store.index(indexName).getAll(key);

            return await store.getAll(key);
        }

        async deleteAll<K extends keyof StoreNameMap>(storeName: K, condition: (item: StoreNameMap[K]) => boolean): Promise<number>;
        async deleteAll<K extends keyof StoreNameMap>(storeName: K, index: string, indexKey: IDBValidKey, condition: (item: StoreNameMap[K]) => boolean): Promise<number>;
        async deleteAll<K extends keyof StoreNameMap>(storeName: K, indexOrCondition: string | ((item: StoreNameMap[K]) => boolean), indexKey?: IDBValidKey, condition?: (item: StoreNameMap[K]) => boolean): Promise<number> {
            const store = this._transaction.objectStore(storeName);
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

        async getQuery(id: string, results?: "always" | "ifAutoQuery"): Promise<Query> {
            const query = await this.load("Queries", id);
            if (query.result && (results === "always" || (query.autoQuery && results === "ifAutoQuery")))
                query.result.items = await this.getQueryResults(Wrappers.QueryWrapper._wrap(query));

            return Wrappers.QueryWrapper._wrap(query);
        }

        async getQueryResults(query: ReadOnlyQuery, parent?: ReadOnlyPersistentObject): Promise<QueryResultItem[]> {
            let items: Service.QueryResultItem[];
            if (!parent)
                items = <Service.QueryResultItem[]>await this._transaction.objectStore("QueryResults").index("ByPersistentObjectId").getAll(query.persistentObject.id);
            else {
                const detailSourceQuery = <StoreQuery>await this._transaction.objectStore("Queries").index("ByPersistentObjectIdWithResults").get([query.persistentObject.id, "true"]);

                const keyColumn = detailSourceQuery.columns.find(c => c.type === "Reference" && c.persistentObjectId === parent.id);
                if (!keyColumn) {
                    console.error(`Unable to resolve reference column for detail query "${query.name}"`);
                    return [];
                }

                items = [];
                let detailItemsCursor = await this._transaction.objectStore("QueryResults").index("ByPersistentObjectId").openCursor(detailSourceQuery.persistentObject.id);
                let i = 0;
                while (detailItemsCursor) {
                    const detailItem = <Service.QueryResultItem>detailItemsCursor.value;
                    const keyValue = detailItem.values.find(v => v.key === keyColumn.name);
                    if (keyValue && keyValue.objectId === parent.objectId)
                        items.push(detailItem);

                    detailItemsCursor = await detailItemsCursor.continue();
                }
            }

            const columns = new Map(query.columns.map(c => <[string, boolean]>[c.name, true]));
            return items.map(i => {
                i.values = i.values.filter(v => columns.has(v.key));
                return Wrappers.QueryResultItemWrapper._wrap(i);
            });
        }

        async delete(query: Query, items: QueryResultItem[]) {
            // TODO: Check if object has pending relationships
            // TODO: Add change entry
            const keys = items.map(item => item.id);
            this.deleteAll("QueryResults", "ByPersistentObjectId", query.persistentObject.id, item => keys.indexOf(item.id) >= 0);
        }

        async getPersistentObject(id: string, objectId?: string): Promise<PersistentObject> {
            const query = <Service.Query>await this._transaction.objectStore("Queries").index("ByPersistentObjectId").get(id);
            if (!query)
                return null;

            const item = <Service.QueryResultItem>await this._transaction.objectStore("QueryResults").get([id, objectId]);
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

        async savePersistentObject(persistentObject: PersistentObject): Promise<PersistentObject> {
            if (persistentObject.isNew) {
                const obj = Wrappers.PersistentObjectWrapper._unwrap(persistentObject);
                obj.objectId = `SW-NEW-${Date.now()}`;

                const item = await this.editQueryResultItemValues(obj, "New");

                await this.add("QueryResults", {
                    ...item,
                    persistentObjectId: obj.id
                });

                obj.attributes.forEach(attr => attr.isValueChanged = false);
                obj.isNew = false;
            }
            else {
                const item = await this.editQueryResultItemValues(persistentObject, "Edit");
                await this.save("QueryResults", {
                    ...item,
                    persistentObjectId: persistentObject.id
                });

                persistentObject.attributes.forEach(attr => attr.isValueChanged = false);
            }

            return persistentObject;
        }

        private async editQueryResultItemValues(persistentObject: Service.PersistentObject, changeType: ItemChangeType): Promise<Service.QueryResultItem> {
            let item: Service.QueryResultItem;
            if (changeType === "New") {
                item = {
                    id: persistentObject.objectId,
                    values: []
                };
            }
            else
                item = <Service.QueryResultItem>await this.load("QueryResults", [persistentObject.id, persistentObject.objectId]);

            if (!item)
                throw "Unable to resolve item.";

            let query: Service.Query;
            for (let attribute of persistentObject.attributes.filter(a => a.isValueChanged)) {
                let value = item.values.find(v => v.key === attribute.name);
                if (!value) {
                    value = {
                        key: attribute.name,
                        value: attribute.value
                    };

                    item.values.push(value);
                }
                else
                    value.value = attribute.value;

                if (attribute.type === "Reference")
                    value.objectId = (<Service.PersistentObjectAttributeWithReference>attribute).objectId;
            }

            return item;
        }
    }

    export type ItemChangeType = "None" | "New" | "Edit" | "Delete";

    export interface IItemChange {
        objectId: string;
        key: string;
        value: string;
        referenceObjectId?: string;
        logChange?: boolean;
        type?: ItemChangeType;
    }
}