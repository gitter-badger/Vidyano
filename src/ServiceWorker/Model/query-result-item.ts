/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type QueryResultItem = Wrappers.Wrap<Service.QueryResultItem, never, Wrappers.QueryResultItemWrapper>;
    export type ReadOnlyQueryResultItem = Readonly<QueryResultItem>;

    export namespace Wrappers {
        export class QueryResultItemWrapper extends Wrapper<Service.QueryResultItem> {
            private readonly _values: Vidyano.QueryResultItemValue[];

            private constructor(private _item: Service.QueryResultItem) {
                super();

                this._values = Wrapper._wrap(QueryResultItemValueWrapper, this._item.values);
            }

            get values(): QueryResultItemValue[] {
                return this._values;
            }

            getValue(key: string): QueryResultItemValue {
                return this.values.find(v => v.key === key);
            }

            protected _unwrap(): Service.QueryResultItem {
                return this._item;
            }
        }
    }
}