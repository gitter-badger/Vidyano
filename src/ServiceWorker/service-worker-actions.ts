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

            if (query.autoQuery)
                query.result = (await this.db.load(id, "QueryResults")).result;

            return Wrappers.Wrapper._wrap(Wrappers.QueryWrapper, query);
        }

        async onExecuteQuery(query: Query): Promise<QueryResult> {
            const cachedQueryResult = await this.db.load(query.id, "QueryResults");

            cachedQueryResult.result.columns = query.columns;
            cachedQueryResult.result.sortOptions = query.sortOptions;
            const result = <QueryResult>Wrappers.Wrapper._wrap(Wrappers.QueryResultWrapper, cachedQueryResult.result);

            if (query.textSearch)
                result["_update"](this.onTextSearch(query.textSearch, result));

            result["_update"](this.onSortQueryResult(result));

            return result;
        }

        protected onTextSearch(textSearch: string, result: QueryResult): QueryResultItem[] {
            const items = result.items;
            if (!textSearch)
                return items;

            const columns = result.columns;
            const columnNames = columns.map(c => c.name);

            // Replace labels with column names
            columns.forEach(col => textSearch = textSearch.replace(new RegExp(col.label + ":", "ig"), col.name + ":"));

            const hasPrefix = new RegExp("^(" + columnNames.join("|") + "):", "i");
            const matches: [string, string, number, boolean][] = textSearch.match(/\S+/g).map(text => {
                let name: string = null;
                if (hasPrefix.test(text)) {
                    const textParts = text.split(":");
                    name = textParts[0].toLowerCase();
                    text = textParts[1];
                }

                return <[string, string, number, boolean]>[name, text.toLowerCase(), parseInt(text), BooleanEx.parse(text)];
            });

            return items.filter(item => {
                const values = item.values;
                return values.some(itemValue => {
                    const column = result.getColumn(itemValue.key);
                    if (column.type == "Image" || column.type == "BinaryFile" || column.type == "Time" || column.type == "NullableTime")
                        return false;

                    const value = DataType.fromServiceString(itemValue.value, column.type);
                    return matches.filter(m => m[0] == null || m[0] == column.name.toLowerCase()).some(match => {
                        if (DataType.isNumericType(column.type)) {
                            if (isNaN(match[2])) {
                                // TODO: Check expression
                                return false;
                            }
                            else
                                return Math.abs(match[2] - value) < 1;
                        }
                        else if (DataType.isDateTimeType(column.type)) {
                            // TODO
                            return false;
                        }
                        else if (DataType.isBooleanType(column.type)) {
                            return value == match[3];
                        }
                        else if (column.type === "KeyValueList")
                            return false; // TODO

                        return itemValue.value != null && itemValue.value.toLowerCase().indexOf(match[1]) != -1;
                    });
                });
            });
        }

        onSortQueryResult(result: QueryResult): QueryResultItem[] {
            const sortOptions: [QueryColumn, number][] = result.sortOptions.split(";").map(option => option.trim()).map(option => {
                const optionParts = option.split(" ");
                const column = result.getColumn(optionParts[0]);
                if (!column)
                    return null;

                const sort = optionParts.length === 1 ? 1 : (<Service.SortDirection>optionParts[1] === "ASC" ? 1 : -1);
                return <[QueryColumn, number]>[column, sort];
            }).filter(so => so != null);

            const items = result.items.sort((i1, i2) => {
                for (let i = 0; i < sortOptions.length; i++) {
                    const s = sortOptions[i];

                    const valueItem1 = i1.getValue(s[0].name);
                    const value1 = valueItem1 ? valueItem1.value : "";

                    const valueItem2 = i2.getValue(s[0].name);
                    const value2 = valueItem2 ? valueItem2.value : "";

                    const result = this.onDataTypeCompare(value1, value2, s[0].type);
                    if (result)
                        return result * s[1];
                }

                return 0;
            });

            return items;
        }

        onDataTypeCompare(value1: any, value2: any = "", datatype: string = ""): number {
            if (DataType.isDateTimeType(datatype) || DataType.isNumericType(datatype))
                return DataType.fromServiceString(value1, datatype) - DataType.fromServiceString(value2, datatype);

            return value1.localeCompare(value2);
        }

        protected onFilter(query: Service.Query): QueryResultItem[] {
            throw "Not implemented";
        }

        async onExecuteQueryAction(action: string, query: Query, selectedItems: QueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<PersistentObject> {
            if (action === "New")
                return this.onNew(query);
            else if (action === "Delete")
                return await this.onDelete(query, selectedItems);

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
            const storeQuery = await this.db.load(query.id, "Queries");
            return Wrappers.Wrapper._wrap(Wrappers.PersistentObjectWrapper, storeQuery.newPersistentObject);
        }

        async onRefresh(persistentObject: PersistentObject, parameters: Service.ExecuteActionRefreshParameters): Promise<PersistentObject> {
            return persistentObject;
        }

        async onDelete(query: Query, selectedItems: QueryResultItem[]): Promise<PersistentObject> {
            const storeResult = await this.db.load(query.id, "QueryResults");
            const deleted = selectedItems.map(selected => {
                const itemIndex = storeResult.result.items.findIndex(i => i.id === selected.id);
                if (itemIndex < 0)
                    return null;

                return storeResult.result.items.splice(itemIndex, 1)[0];
            }).filter(i => !!i);

            Array.prototype.push.apply(storeResult.deleted, deleted);
            await this.db.save(storeResult, "QueryResults");

            return null;
        }

        async onSave(obj: PersistentObject): Promise<PersistentObject> {
            if (obj.isNew)
                return this.saveNew(obj);

            return this.saveExisting(obj);
        }

        async saveNew(obj: PersistentObject): Promise<PersistentObject> {
            const uwrapped = Wrappers.Wrapper._unwrap(obj);
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