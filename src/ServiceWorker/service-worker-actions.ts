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
                typeId: persistentObject.id,
                objectId: persistentObject.objectId,
                response: JSON.stringify(persistentObject)
            }, "PersistentObjects");

            await this.db.save({
                id: persistentObject.id,
                name: persistentObject.type
            }, "ActionClassesById");
        }

        async onCacheQuery(query: IQuery): Promise<void> {
            await this.db.save({
                id: query.id,
                response: JSON.stringify(query)
            }, "Queries");

            // TODO: Cache PersistentObject

            await this.db.save({
                id: query.id,
                name: query.persistentObject.type
            }, "ActionClassesById");
        }

        async onGetPersistentObject(parent: IPersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<IPersistentObject> {
            const record = await this.db.load(id, "PersistentObjects");
            return record ? JSON.parse(record.response) : null;
        }

        async onGetQuery(id: string): Promise<IQuery> {
            const record = await this.db.load(id, "Queries");
            const query: IQuery = record ? JSON.parse(record.response) : null;

            query.columns.forEach(c => c.canFilter = c.canListDistincts = c.canGroupBy = false);
            query.filters = null;

            if (this.onFilter === ServiceWorkerActions.prototype.onFilter) {
                const filterIndex = query.actions.indexOf("Filter");
                if (filterIndex >= 0)
                    query.actions.splice(filterIndex, 1);
            }

            return query;
        }

        async onExecuteQuery(query: IQuery): Promise<IQueryResult> {
            const cachedQuery = await this.onGetQuery(query.id);
            const columnMap = new Map(query.columns.map((c): [string, IQueryColumn] => [c.name, c]).concat(query.columns.map((c): [string, IQueryColumn] => [c.label, c])));

            const result: IQueryResult = {
                columns: query.columns,
                items: cachedQuery.result.items,
                sortOptions: query.sortOptions,
                charts: cachedQuery.result.charts
            };

            if (query.textSearch) {
                result.textSearch = query.textSearch;
                result.items = result.items.filter(i => i.values.some(v => {
                    return this.isMatch(v, columnMap.get(v.key), query.textSearch);
                }));
            }

            return result
        }

        protected onFilter(query: IQuery): IQueryResultItem[] {
            return [];
        }

        protected isMatch(value: IQueryResultItemValue, column: IQueryColumn, textSearch: string): boolean {
            if (!textSearch)
                return true;

            const names: string[] = [];
            //this.query.columns.run(function (c: any) {
            //    names.push(c.name);

            //    if (c.label != c.name)
            //        textSearch = textSearch.replace(new RegExp(c.label + ":", "ig"), c.name + ":");
            //});
            //var hasPrefix = new RegExp("^(" + names.join("|") + "):", "i");

            //var parts = textSearch.match(/\S+/g);
            //for (var i = 0; i < parts.length; i++) {
            //    var text = parts[i];
            //    var name: string = null;

            //    if (hasPrefix.test(text)) {
            //        var textParts = text.split(":");
            //        name = textParts[0].toLowerCase();
            //        text = textParts[1];
            //    }

            //    var number = parseInt(text);
            //    var bool = Boolean(text);

            //    var checkValue = function (v: QueryResultItemValue) {
            //        var column = v.getColumn();
            //        if (!column)
            //            return false;

            //        var typeName = column.type;
            //        if (typeName == "Image" || typeName == "BinaryFile" || typeName == "Time" || typeName == "NullableTime")
            //            return false;

            //        var value = ServiceGateway.fromServiceString(v.value, typeName);
            //        if (ServiceGateway.isNumericType(typeName)) {
            //            if (isNaN(number)) {
            //                text = text.replace(/\s/g, "");
            //                //if (/^(<|<=|>|>=)\d+$/.test(text))
            //                //    return ExpressionParser.get(text)(value);
            //                //else if (/^\d+-\d$/.test(text))
            //                //    return ExpressionParser.get(text.replace("-", "<=x<="))(value);

            //                return false;
            //            }

            //            return Math.abs(number - value) < 1;
            //        }
            //        else if (typeName == "Date" || typeName == "DateTime" || typeName == "NullableDate" || typeName == "NullableDateTime" || typeName == "DateTimeOffset" || typeName == "NullableDateTimeOffset") {
            //            // TODO: Dates...
            //            text = text.replace(/\s/g, "");

            //            // TODO: today
            //            // TODO: lastweek / thisweek / nextweek
            //            // TODO: lastmonth / thismonth / nextmonth
            //            // TODO: lastyear / thisyear / nextyear
            //            // TODO: \d{4}
            //            // TODO: (<|<=|>|>=)\d{4}
            //            // TODO: \d{4}-\d{2} (ClientCulture)

            //            return false;
            //        }
            //        else if (typeName == "Boolean" || typeName == "YesNo" || typeName == "NullableBoolean")
            //            return value == bool;

            //        // TODO: KeyValueList

            //        return v.value != null && v.value.toString().toLowerCase().contains(text.toLowerCase()); // Contains?
            //    };

            //    if (name != null) {
            //        var val = this.values.firstOrDefault(function (v: QueryResultItemValue) { return v.key.toLowerCase() == name; });
            //        if (val == null || !checkValue(val))
            //            return false;
            //    }
            //    else if (this.values.firstOrDefault(checkValue) == null)
            //        return false;
            //}

            //return true;

            return false;
        }

        async onExecuteQueryAction(action: string, query: IQuery, selectedItems: IQueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            const cache = await this.db.load(query.id, "Queries");
            const cachedQuery = cache ? <IQuery>JSON.parse(cache.response) : null;
            if (!query)
                return null;

            if (action === "New") {
                if (cachedQuery != null) {
                    const newPo = cachedQuery.persistentObject;
                    newPo.actions = ["Edit"];
                    newPo.isNew = true;
                    newPo.breadcrumb = newPo.newBreadcrumb || `New ${newPo.label}`;
                    return newPo;
                }
            }

            return null;
        }

        async onExecutePersistentObjectAction(action: string, persistentObject: IPersistentObject, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            if (action === "Save") {
                if (persistentObject.isNew) {
                    // TODO
                    debugger;
                }
                else {
                    // TODO
                    debugger;
                }
            }

            return null;
        }

        async onExecuteQueryFilterAction(action: string, query: IQuery, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            if (action === "RefreshColumn") {
                // TODO
                debugger;
            }

            return null;
        }
    }
}