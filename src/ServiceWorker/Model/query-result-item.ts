/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type QueryResultItem = Wrappers.Wrap<Service.QueryResultItem, never, Wrappers.QueryResultItemWrapper>;
    export type ReadOnlyQueryResultItem = Readonly<QueryResultItem>;

    export namespace Wrappers {
        export class QueryResultItemWrapper extends Wrapper<Service.QueryResultItem> {
            private readonly _values: ByName<Vidyano.QueryResultItemValue>;

            private constructor(private _item: Service.QueryResultItem) {
                super();

                this._values = ByNameWrapper.create(this._item.values, QueryResultItemValueWrapper, true, "key");
            }

            get values(): ByName<QueryResultItemValue> {
                return this._values;
            }

            protected _unwrap(): Service.QueryResultItem {
                return this._item;
            }
        }
    }
}