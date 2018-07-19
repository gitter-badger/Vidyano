namespace Vidyano {
    export class ServiceWorkerActions {
        private static _types = new Map<string, any>();
        static async get<T>(name: string, db: IndexedDB): Promise<ServiceWorkerActions> {
            if (!(/^\w+$/.test(name))) {
                const classNameRecord = await db.load(name, "ActionClassesById");
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
                    const className = await db.load(name, "ActionClassesById");
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
            instance._db = db;

            return instance;
        }

        private _db: IndexedDB;

        get db(): IndexedDB {
            return this._db;
        }

        private _isPersistentObject(arg: any): arg is IPersistentObject {
            return (arg as IPersistentObject).type !== undefined;
        }

        private _isQuery(arg: any): arg is IQuery {
            return (arg as IQuery).persistentObject !== undefined;
        }

        async onCache<T extends IPersistentObject | IQuery>(persistentObjectOrQuery: T): Promise<void> {
            if (this._isPersistentObject(persistentObjectOrQuery))
                await this.onCachePersistentObject(persistentObjectOrQuery);
            else if (this._isQuery(persistentObjectOrQuery))
                await this.onCacheQuery(persistentObjectOrQuery);
        }

        async onCachePersistentObject(persistentObject: IPersistentObject): Promise<void> {
            await this.db.save({
                id: persistentObject.id,
                persistentObject: persistentObject
            }, "PersistentObjects");

            await this.db.save({
                id: persistentObject.id,
                name: persistentObject.type
            }, "ActionClassesById");
        }

        async onCacheQuery(query: IQuery): Promise<void> {
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

        async getOwnerQuery(objOrId: IPersistentObject | string): Promise<IQuery> {
            if (typeof objOrId === "object")
                objOrId = (objOrId as IPersistentObject).id;

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

        async onGetPersistentObject(parent: IPersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<IPersistentObject> {
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

        async onGetQuery(id: string): Promise<IQuery> {
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

            return query;
        }

        async onExecuteQuery(query: IQuery): Promise<IQueryResult> {
            const cachedQuery = await this.onGetQuery(query.id);

            const result: IQueryResult = {
                columns: query.columns,
                items: cachedQuery.result.items,
                sortOptions: query.sortOptions,
                charts: cachedQuery.result.charts
            };

            if (this.onFilter !== ServiceWorkerActions.prototype.onFilter)
                result.items = this.onFilter(query);

            return query.sortOptions !== cachedQuery.sortOptions ? this.onSortQueryResult(result) : result;
        }

        onSortQueryResult(result: IQueryResult): IQueryResult {
            const sortOptions: [Service.IQueryColumn, number][] = result.sortOptions.split(";").map(option => option.trim()).map(option => {
                const optionParts = option.split(" ");
                const column = result.columns.find(c => c.name.toUpperCase() === optionParts[0].toUpperCase());
                if (!column)
                    return null;

                const sort = optionParts.length === 1 ? 1 : (<Service.SortDirection>optionParts[1] === "ASC" ? 1 : -1);
                return <[Service.IQueryColumn, number]>[column, sort];
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

        protected onFilter(query: IQuery): IQueryResultItem[] {
            throw "Not implemented";
        }

        async onExecuteQueryFilterAction(action: string, query: IQuery, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            throw "Not implemented";
        }

        async onExecuteQueryAction(action: string, query: IQuery, selectedItems: IQueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            if (action === "New")
                return this.onNew(query);
            else if (action === "Delete")
                await this.onDelete(query, selectedItems);

            return null;
        }

        async onExecutePersistentObjectAction(action: string, persistentObject: IPersistentObject, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            if (action === "Save")
                return this.onSave(persistentObject);

            return null;
        }

        async onNew(query: IQuery): Promise<IPersistentObject> {
            const storeQuery = await this.db.load(query.id, "Queries");
            const storeQueryQ = storeQuery ? storeQuery.query : null;
            if (!query || !storeQueryQ)
                return null;

            const newPo = storeQueryQ.persistentObject;
            newPo.actions = ["Edit"];
            newPo.isNew = true;
            newPo.breadcrumb = newPo.newBreadcrumb || `New ${newPo.label}`;
            return newPo;
        }

        async onDelete(query: IQuery, selectedItems: IQueryResultItem[]) {
            const storeQuery = await this.db.load(query.id, "Queries");
            query = storeQuery.query;

            selectedItems.forEach(item => {
                const i = query.result.items.findIndex(i => i.id === item.id);
                if (i >= 0)
                    query.result.items.splice(i, 1);
            });

            storeQuery.query = query;
            await this.db.save(storeQuery, "Queries");
        }

        async onSave(obj: IPersistentObject): Promise<IPersistentObject> {
            if (obj.isNew)
                return this.saveNew(obj);

            return this.saveExisting(obj);
        }

        async saveNew(obj: IPersistentObject): Promise<IPersistentObject> {
            obj.objectId = `SW-NEW-${Date.now()}`;

            const storeObj = await this.db.load(obj.id, "PersistentObjects");
            const storeQuery = await this.db.load(storeObj.query, "Queries");
            const query = storeQuery.query;

            await this.editQueryResultItemValues(query, obj, "New");
            this.onSortQueryResult(query.result);

            storeQuery.query = query;
            await this.db.save(storeQuery, "Queries");

            obj.attributes.forEach(attr => attr.isValueChanged = false);
            obj.isNew = false;

            return obj;
        }

        async saveExisting(obj: IPersistentObject): Promise<IPersistentObject> {
            const storeObj = await this.db.load(obj.id, "PersistentObjects");
            const storeQuery = await this.db.load(storeObj.query, "Queries");
            const query = storeQuery.query;

            await this.editQueryResultItemValues(query, obj, "Edit");
            this.onSortQueryResult(query.result);

            storeQuery.query = query;
            await this.db.save(storeQuery, "Queries");

            obj.attributes.forEach(attr => attr.isValueChanged = false);

            return obj;
        }

        async editQueryResultItemValues(query: IQuery, persistentObject: IPersistentObject, changeType: ItemChangeType) {
            let item = query.result.items.find(i => i.id === persistentObject.objectId);
            for (let attribute of persistentObject.attributes.filter(a => a.isValueChanged)) {
                if (!item && changeType === "New") {
                    item = {
                        id: attribute.objectId,
                        values: []
                    };

                    query.result.items.push(item);
                    query.result.totalItems++;
                }

                if (!item)
                    throw "Unable to resolve item.";

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

                const attributeMetaData = query.persistentObject.attributes.find(a => a.name === attribute.name);
                if (attributeMetaData && attributeMetaData.type === "Reference" && attributeMetaData.lookup) {
                    value.persistentObjectId = attributeMetaData.lookup.persistentObject.id;
                    value.objectId = attribute.objectId;
                }
            }
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