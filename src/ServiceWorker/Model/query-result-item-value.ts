/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type QueryResultItemValue = Readonly<Service.QueryResultItemValue> & Wrappers.QueryResultItemValueWrapper;

    export namespace Wrappers {
        export class QueryResultItemValueWrapper extends Wrapper<Service.QueryResultItemValue> {
            private constructor(private _value: Service.QueryResultItemValue) {
                super();
            }

            protected _unwrap(): Service.QueryResultItemValue {
                return this._value;
            }
        }
    }
}