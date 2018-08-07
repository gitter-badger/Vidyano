namespace Vidyano {
    export class ServiceWorkerActions {
        private static _types = new Map<string, any>();
        static async get<T>(name: string, serviceWorker: ServiceWorker): Promise<ServiceWorkerActions> {
            if (!(/^\w+$/.test(name))) {
                const classNameRecord = await serviceWorker.db.load("ActionClassesById", name);
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
                    const className = await serviceWorker.db.load("ActionClassesById", name);
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

        private get db(): IndexedDB {
            return this.serviceWorker.db;
        }

        protected get serviceWorker(): ServiceWorker {
            return this._serviceWorker;
        }

        async onGetPersistentObject(parent: Service.PersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<Service.PersistentObject> {
            const po = await this.db.load("PersistentObjects", id);
            const resultItem = await this.db.load("QueryResults", [po.queryId, objectId]);
            if (!resultItem)
                return null;

            po.objectId = objectId;
            po.isNew = isNew;
            po.actions = (po.actions || []);

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
            const storedQuery = await this.db.load("Queries", id);

            if (storedQuery.autoQuery && storedQuery.result)
                storedQuery.result.items = await this.db.loadAll("QueryResults", "ByQueryId", id);

            const query = <Query>Wrappers.QueryWrapper._wrap(storedQuery);
            query.enableSelectAll = true;

            if (query.textSearch)
                query.result.items = this.onTextSearch(query.textSearch, query.result);

            query.result.items = this.onSortQueryResult(query.result);

            return query;
        }

        async onExecuteQuery(query: Query): Promise<QueryResult> {
            const storedQuery = await this.db.load("Queries", query.id);
            if (!storedQuery)
                return null;

            storedQuery.columns = query.columns;
            storedQuery.sortOptions = query.sortOptions;

            if (storedQuery.autoQuery && storedQuery.result)
                storedQuery.result.items = await this.db.loadAll("QueryResults", "ByQueryId", query.id);

            const result = <QueryResult>Wrappers.QueryResultWrapper._wrap(storedQuery.result);

            if (query.textSearch)
                query.result.items = this.onTextSearch(query.textSearch, result);

            query.result.items = this.onSortQueryResult(result);

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
            const storeQuery = await this.db.load("Queries", query.id);
            return Wrappers.PersistentObjectWrapper._wrap(storeQuery.newPersistentObject);
        }

        async onRefresh(persistentObject: PersistentObject, parameters: Service.ExecuteActionRefreshParameters): Promise<PersistentObject> {
            return persistentObject;
        }

        async onDelete(query: Query, selectedItems: QueryResultItem[]): Promise<PersistentObject> {
            debugger;
            //const storeResult = await this.db.load("QueryResults", query.id);
            //const deleted = selectedItems.map(selected => {
            //    const itemIndex = storeResult.result.items.findIndex(i => i.id === selected.id);
            //    if (itemIndex < 0)
            //        return null;

            //    return storeResult.result.items.splice(itemIndex, 1)[0];
            //}).filter(i => !!i);

            //Array.prototype.push.apply(storeResult.deleted, deleted);
            //await this.db.save(storeResult, "QueryResults");

            return null;
        }

        async onSave(obj: PersistentObject): Promise<PersistentObject> {
            if (obj.isNew)
                return this.saveNew(obj);

            return this.saveExisting(obj);
        }

        async saveNew(newObj: PersistentObject): Promise<PersistentObject> {
            const obj = Wrappers.PersistentObjectWrapper._unwrap(newObj);
            obj.objectId = `SW-NEW-${Date.now()}`;

            const item = await this.editQueryResultItemValues(obj.ownerQueryId, obj, "New");
            await this.db.save("QueryResults", {
                ...item,
                queryId: obj.ownerQueryId
            });

            obj.attributes.forEach(attr => attr.isValueChanged = false);
            obj.isNew = false;

            return Wrappers.PersistentObjectWrapper._wrap(obj);
        }

        async saveExisting(obj: PersistentObject): Promise<PersistentObject> {
            const item = await this.editQueryResultItemValues(obj.ownerQueryId, obj, "New");
            await this.db.save("QueryResults", {
                ...item,
                queryId: obj.ownerQueryId
            });

            obj.attributes.forEach(attr => attr.isValueChanged = false);

            return obj;
        }

        private async editQueryResultItemValues(queryId: string, persistentObject: Service.PersistentObject, changeType: ItemChangeType) {
            let item = <Service.QueryResultItem>await this.db.load("QueryResults", [queryId, persistentObject.objectId]);
            if (!item && changeType === "New") {
                item = {
                    id: persistentObject.objectId,
                    values: []
                };
            }
            else
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

                if (attribute.type === "Reference") {
                    if (!query) {
                        query = await this.db.load("Queries", queryId);
                        throw "Unable to resolve query.";
                    }

                    const attributeMetaData = <Service.PersistentObjectAttributeWithReference>query.persistentObject.attributes.find(a => a.name === attribute.name);
                    if (!attributeMetaData)
                        throw "Unable to resolve attribute.";

                    value.persistentObjectId = attributeMetaData.lookup.persistentObject.id;
                    value.objectId = (<Service.PersistentObjectAttributeWithReference>attribute).objectId;
                }
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