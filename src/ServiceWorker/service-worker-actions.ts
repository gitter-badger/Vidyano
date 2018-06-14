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

            if (!actionsClass)
                actionsClass = ServiceWorkerActions;

            const instance = new actionsClass();
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

            await this.db.save({
                id: query.id,
                name: query.persistentObject.type
            }, "ActionClassesById");
        }

        async onGetQuery(id: string): Promise<IQuery> {
            const record = await this.db.load(id, "Queries");
            return record ? JSON.parse(record.response) : null;
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
                    return newPo;
                }
            }

            return null;
        }

        async onExecutePersistentObjectAction(action: string, persistentObject: IPersistentObject, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject> {
            return null;
        }

        async fetch(payload: any, fetcher: Fetcher<Service.IRequest, any>): Promise<any> {
            return await fetcher(payload);
        }
    }
}