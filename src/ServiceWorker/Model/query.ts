/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type Query = Wrappers.Wrap<Service.Query, "actionLabels" | "allowTextSearch" | "label" | "enableSelectAll" | "notification" | "notificationType" | "notificationDuration" | "sortOptions" | "textSearch", Wrappers.QueryWrapper>;
    export type ReadOnlyQuery = Readonly<Query>;

    export namespace Wrappers {
        export class QueryWrapper extends Wrapper<Service.Query> {
            private readonly _columns: ByName<QueryColumn>;
            private readonly _persistentObject: ReadOnlyPersistentObject;
            private readonly _result: QueryResult;

            private constructor(private _query: Service.Query) {
                super();

                this._columns = ByNameWrapper.create(this._query.columns, QueryColumnWrapper, true, "name");
                this._persistentObject = Wrapper._wrap(PersistentObjectWrapper, this._query.persistentObject, true);
                this._result = Wrapper._wrap(QueryResultWrapper, this._query.result);
            }

            get columns(): ByName<QueryColumn> {
                return this._columns;
            }

            get persistentObject(): ReadOnlyPersistentObject {
                return this._persistentObject;
            }

            get result(): QueryResult {
                return this._result;
            }

            protected _unwrap(): Service.Query {
                return this._query;
            }
        }
    }
}