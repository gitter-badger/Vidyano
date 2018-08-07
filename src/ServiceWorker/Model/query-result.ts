/// <reference path="wrappers.ts" />

namespace Vidyano {
    const _QueryResultWritableProperties = {
        "notification": 1,
        "notificationType": 1,
        "notificationDuration": 1,
        "sortOptions": 1
    };
    const QueryResultWritableProperties = Object.keys(_QueryResultWritableProperties) as (keyof typeof _QueryResultWritableProperties)[];

    export type QueryResult = Wrappers.Wrap<Service.QueryResult, typeof QueryResultWritableProperties[number], Wrappers.QueryResultWrapper>;
    export type ReadOnlyQueryResult = Readonly<QueryResult>;

    export namespace Wrappers {
        export class QueryResultWrapper extends Wrapper<Service.QueryResult> {
            private readonly _columns: QueryColumn[];
            private _items: QueryResultItem[];

            private constructor(private _result: Service.QueryResult) {
                super();

                this._columns = QueryColumnWrapper._wrap(this._result.columns || []);
                this._items = QueryResultItemWrapper._wrap(this._result.items || []);
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

            set items(items: QueryResultItem[]) {
                this._items = items;
            }

            getItem(id: string): QueryResultItem {
                return this.items.find(i => i.id === id);
            }

            protected _unwrap(): Service.QueryResult {
                return super._unwrap(QueryResultWritableProperties, "columns", "items");
            }

            static _unwrap(obj: QueryResult): Service.QueryResult {
                return obj ? obj._unwrap() : null;
            }
        }
    }
}