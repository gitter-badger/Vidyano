/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type QueryResult = Wrappers.Wrap<Service.QueryResult, "notification" | "notificationType" | "notificationDuration" | "sortOptions", Wrappers.QueryResultWrapper>;
    export type ReadOnlyQueryResult = Readonly<QueryResult>;

    export namespace Wrappers {
        export class QueryResultWrapper extends Wrapper<Service.QueryResult> {
            private readonly _columns: QueryColumn[];
            private _items: QueryResultItem[];

            private constructor(private _result: Service.QueryResult) {
                super();

                this._columns = QueryColumnWrapper._wrap(this._result.columns);
                this._items = QueryResultItemWrapper._wrap(this._result.items);
            }

            get columns(): QueryColumn[] {
                return this._columns;
            }

            getColumn(name: string): QueryColumn {
                return this.columns.find(c => c.name === name);
            }
            
            get items(): QueryResultItem[] {
                return this._items;
            }

            getItem(id: string): QueryResultItem {
                return this.items.find(i => i.id === id);
            }

            private _update(items: QueryResultItem[]) {
                this._items = items;
            }

            protected _unwrap(): Service.QueryResult {
                return super._unwrap("columns", "items");
            }

            static _unwrap(obj: QueryResult): Service.QueryResult {
                return obj._unwrap();
            }
        }
    }
}