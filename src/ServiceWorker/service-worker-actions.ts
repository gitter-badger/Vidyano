namespace Vidyano {
    export class ServiceWorkerActions {
        private static _types = new Map<string, any>();
        static async get<T>(name: string, serviceWorker: ServiceWorker): Promise<ServiceWorkerActions> {
            if (!(/^\w+$/.test(name))) {
                const classNameRecord = await serviceWorker.db.load(name, "ActionClassesById");
                if (!classNameRecord)
                    return null;

                name = classNameRecord.name;
            }

            let actionsClass = ServiceWorkerActions._types.get(name);
            if (actionsClass === undefined) {
                try {
                    actionsClass = eval.call(null, `ServiceWorker${name}Actions`);
                }
                catch (e) {
                    const className = await serviceWorker.db.load(name, "ActionClassesById");
                    if (className) {
                        try {
                            actionsClass = eval.call(null, `ServiceWorker${className}Actions`);
                        }
                        catch (ee) {
                            actionsClass = null;
                        }
                    }
                    else
                        actionsClass = null;
                }
                finally {
                    ServiceWorkerActions._types.set(name, actionsClass);
                }
            }

            const instance = new (actionsClass || ServiceWorkerActions)();
            instance._serviceWorker = serviceWorker;

            return instance;
        }

        private _serviceWorker: ServiceWorker;

        get db(): IndexedDB {
            return this.serviceWorker.db;
        }

        protected get serviceWorker(): ServiceWorker {
            return this._serviceWorker;
        }

        private _isPersistentObject(arg: any): arg is Service.PersistentObject {
            return (arg as Service.PersistentObject).type !== undefined;
        }

        private _isQuery(arg: any): arg is Service.Query {
            return (arg as Service.Query).persistentObject !== undefined;
        }

        async onCache<T extends Service.PersistentObject | Service.Query>(persistentObjectOrQuery: T): Promise<void> {
            if (this._isPersistentObject(persistentObjectOrQuery))
                await this.onCachePersistentObject(persistentObjectOrQuery);
            else if (this._isQuery(persistentObjectOrQuery))
                await this.onCacheQuery(persistentObjectOrQuery);
        }

        async onCachePersistentObject(persistentObject: Service.PersistentObject): Promise<void> {
            await this.db.save({
                id: persistentObject.id,
                persistentObject: persistentObject
            }, "PersistentObjects");

            await this.db.save({
                id: persistentObject.id,
                name: persistentObject.type
            }, "ActionClassesById");
        }

        async onCacheQuery(query: Service.Query): Promise<void> {
            await this.db.save({
                id: query.id,
                query: query
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

        async getOwnerQuery(objOrId: Service.PersistentObject | string): Promise<Service.Query> {
            if (typeof objOrId === "object")
                objOrId = (objOrId as Service.PersistentObject).id;

            const storeObj = await this.db.load(objOrId, "PersistentObjects");
            if (storeObj == null || !storeObj.query)
                return null;

            const storeQuery = await this.db.load(storeObj.query, "Queries");
            if (!storeQuery)
                return null;

            const query = storeQuery.query;
            if (!query)
                return null;

            return query;
        }

        async onGetPersistentObject(parent: Service.PersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<Service.PersistentObject> {
            const storeObj = await this.db.load(id, "PersistentObjects");
            if (storeObj == null || !storeObj.query)
                return null;

            const query = await this.getOwnerQuery(id);

            const resultItem = query.result.items.find(i => i.id === objectId);
            if (!resultItem)
                return null;

            const po = storeObj.persistentObject;
            po.objectId = objectId;
            po.isNew = isNew;
            po.actions = (po.actions || []);
            if (query.actions.indexOf("BulkEdit") >= 0 && po.actions.indexOf("Edit") < 0)
                po.actions.push("Edit");

            po.attributes.forEach(attr => {
                const value = resultItem.values.find(v => v.key === attr.name);
                if (value == null)
                    return;

                attr.value = value.value;
            });

            const breadcrumbRE = /{([^{]+?)}/;
            do {
                const m = breadcrumbRE.exec(po.breadcrumb);
                if (!m)
                    break;

                const attribute = po.attributes.find(a => a.name === m[1]);
                if (!attribute)
                    continue;

                po.breadcrumb = po.breadcrumb.replace(m[0], attribute.value);
            } while (true);

            return po;
        }

        async onGetQuery(id: string): Promise<Query> {
            const storeQuery = await this.db.load(id, "Queries");
            const query = storeQuery ? storeQuery.query : null;
            if (!query)
                return null;

            query.columns.forEach(c => c.canFilter = c.canListDistincts = c.canGroupBy = false);
            query.filters = null;
            query.disableBulkEdit = true;

            if (this.onFilter === ServiceWorkerActions.prototype.onFilter) {
                const filterIndex = query.actions.indexOf("Filter");
                if (filterIndex >= 0)
                    query.actions.splice(filterIndex, 1);
            }

            return Wrappers.QueryWrapper._wrap(query);
        }

        async onExecuteQuery(query: Query): Promise<QueryResult> {
            //const cachedQuery = await this.onGetQuery(query.id);

            //const result: Service.QueryResult = {
            //    columns: query.columns,
            //    items: cachedQuery.result.items,
            //    sortOptions: query.sortOptions,
            //    charts: cachedQuery.result.charts
            //};

            //if (this.onFilter !== ServiceWorkerActions.prototype.onFilter)
            //    result.items = this.onFilter(query);

            //return query.sortOptions !== cachedQuery.sortOptions ? this.onSortQueryResult(result) : result;
            return null;
        }

        onSortQueryResult(result: Service.QueryResult): Service.QueryResult {
            const sortOptions: [Service.QueryColumn, number][] = result.sortOptions.split(";").map(option => option.trim()).map(option => {
                const optionParts = option.split(" ");
                const column = result.columns.find(c => c.name.toUpperCase() === optionParts[0].toUpperCase());
                if (!column)
                    return null;

                const sort = optionParts.length === 1 ? 1 : (<Service.SortDirection>optionParts[1] === "ASC" ? 1 : -1);
                return <[Service.QueryColumn, number]>[column, sort];
            }).filter(so => so != null);

            result.items = result.items.sort((i1, i2) => {
                for (let i = 0; i < sortOptions.length; i++) {
                    const s = sortOptions[i];

                    const value1Index = i1.values.findIndex(v => v.key === s[0].name);
                    const value1 = value1Index < 0 ? "" : (i1.values[value1Index].value || "");

                    const value2Index = i2.values.findIndex(v => v.key === s[0].name);
                    const value2 = value2Index < 0 ? "" : (i2.values[value2Index].value || "");

                    const result = this.onDataTypeCompare(value1, value2, s[0].type);
                    if (result)
                        return result * s[1];
                }

                return 0;
            });

            return result;
        }

        onDataTypeCompare(value1: any, value2: any = "", datatype: string = ""): number {
            if (DataType.isDateTimeType(datatype) || DataType.isNumericType(datatype))
                return DataType.fromServiceString(value1, datatype) - DataType.fromServiceString(value2, datatype);

            return value1.localeCompare(value2);
        }

        protected onFilter(query: Service.Query): QueryResultItem[] {
            throw "Not implemented";
        }

        async onExecuteQueryFilterAction(action: string, query: Service.Query, parameters: Service.ExecuteActionParameters): Promise<PersistentObject> {
            throw "Not implemented";
        }

        async onExecuteQueryAction(action: string, query: Query, selectedItems: QueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<PersistentObject> {
            if (action === "New")
                return this.onNew(query);
            else if (action === "Delete")
                await this.onDelete(query, selectedItems);

            return null;
        }

        async onExecutePersistentObjectAction(action: string, persistentObject: PersistentObject, parameters: Service.ExecuteActionParameters): Promise<PersistentObject> {
            if (action === "Save")
                return this.onSave(persistentObject);
            else if (action === "Refresh")
                return this.onRefresh(persistentObject, parameters as Service.ExecuteActionRefreshParameters);

            return null;
        }

        async onNew(query: Query): Promise<PersistentObject> {
            //const storeQuery = await this.db.load(query.id, "Queries");
            //const storeQueryQ = storeQuery ? storeQuery.query : null;
            //if (!query || !storeQueryQ)
            //    return null;

            //const newPo = storeQueryQ.persistentObject;
            //newPo.actions = ["Edit"];
            //newPo.isNew = true;
            //newPo.breadcrumb = newPo.newBreadcrumb || `New ${newPo.label}`;
            //return newPo;
            return null;
        }

        async onRefresh(persistentObject: PersistentObject, parameters: Service.ExecuteActionRefreshParameters): Promise<PersistentObject> {
            return persistentObject;
        }

        async onDelete(query: Query, selectedItems: QueryResultItem[]) {
            //const storeQuery = await this.db.load(query.id, "Queries");
            //query = storeQuery.query;

            //selectedItems.forEach(item => {
            //    const i = query.result.items.findIndex(i => i.id === item.id);
            //    if (i >= 0)
            //        query.result.items.splice(i, 1);
            //});

            //storeQuery.query = query;
            //await this.db.save(storeQuery, "Queries");
        }

        async onSave(obj: PersistentObject): Promise<PersistentObject> {
            if (obj.isNew)
                return this.saveNew(obj);

            return this.saveExisting(obj);
        }

        async saveNew(obj: PersistentObject): Promise<PersistentObject> {
            //obj.objectId = `SW-NEW-${Date.now()}`;

            //const storeObj = await this.db.load(obj.id, "PersistentObjects");
            //const storeQuery = await this.db.load(storeObj.query, "Queries");
            //const query = storeQuery.query;

            //await this.editQueryResultItemValues(query, obj, "New");
            //this.onSortQueryResult(query.result);

            //storeQuery.query = query;
            //await this.db.save(storeQuery, "Queries");

            //obj.attributes.forEach(attr => attr.isValueChanged = false);
            //obj.isNew = false;

            //return obj;
            return null;
        }

        async saveExisting(obj: PersistentObject): Promise<PersistentObject> {
            //const storeObj = await this.db.load(obj.id, "PersistentObjects");
            //const storeQuery = await this.db.load(storeObj.query, "Queries");
            //const query = storeQuery.query;

            //await this.editQueryResultItemValues(query, obj, "Edit");
            //this.onSortQueryResult(query.result);

            //storeQuery.query = query;
            //await this.db.save(storeQuery, "Queries");

            //obj.attributes.forEach(attr => attr.isValueChanged = false);

            //return obj;
            return null;
        }

        async editQueryResultItemValues(query: Service.Query, persistentObject: Service.PersistentObject, changeType: ItemChangeType) {
        //    let item = query.result.items.find(i => i.id === persistentObject.objectId);
        //    for (let attribute of persistentObject.attributes.filter(a => a.isValueChanged)) {
        //        if (!item && changeType === "New") {
        //            item = {
        //                id: attribute.objectId,
        //                values: []
        //            };

        //            query.result.items.push(item);
        //            query.result.totalItems++;
        //        }

        //        if (!item)
        //            throw "Unable to resolve item.";

        //        let value = item.values.find(v => v.key === attribute.name);
        //        if (!value) {
        //            value = {
        //                key: attribute.name,
        //                value: attribute.value
        //            };

        //            item.values.push(value);
        //        }
        //        else
        //            value.value = attribute.value;

        //        const attributeMetaData = query.persistentObject.attributes.find(a => a.name === attribute.name);
        //        if (attributeMetaData && attributeMetaData.type === "Reference" && attributeMetaData.lookup) {
        //            value.persistentObjectId = attributeMetaData.lookup.persistentObject.id;
        //            value.objectId = attribute.objectId;
        //        }
        //    }
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