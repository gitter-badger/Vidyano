/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type QueryResult = Wrappers.Wrap<Service.QueryResult, "notification" | "notificationType" | "notificationDuration" | "sortOptions", Wrappers.QueryResultWrapper>;
    export type ReadOnlyQueryResult = Readonly<QueryResult>;

    export namespace Wrappers {
        export class QueryResultWrapper extends Wrapper<Service.QueryResult> {
            private readonly _items: ByName<QueryResultItem>;

            private constructor(private _result: Service.QueryResult) {
                super();

                this._items = ByNameWrapper.create(this._result.items, QueryResultItemWrapper, true, "id");
            }

            get items(): ByName<QueryResultItem> {
                return this._items;
            }

            protected _unwrap(): Service.QueryResult {
                return this._result;
            }
        }
    }
}