namespace Vidyano {
    export type QueryResultItem = Readonly<{
        [Q in Helpers.FilteredKeys<IQueryResultItem, string | boolean | number | Service.KeyValueString>]: IQueryResultItem[Q]
    }> & Wrappers.QueryResultItem;

    export namespace Wrappers {
        export class QueryResultItem {
            private readonly _values: Helpers.ByName<QueryResultItemValue>;

            private constructor(private _item: IQueryResultItem) {
                this._values = Helpers.ByNameWrapper.create(this._item.values, QueryResultItemValue, true, "key");
            }

            get values(): Helpers.ByName<QueryResultItemValue> {
                return this._values;
            }
        }
    }
}