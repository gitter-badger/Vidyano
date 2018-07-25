namespace Vidyano {
    export type QueryResultItemValue = Readonly<Service.IQueryResultItemValue> & Wrappers.QueryResultItemValue;

    export namespace Wrappers {
        export class QueryResultItemValue {
            private constructor(private _value: IQueryResultItemValue) {
            }
        }
    }
}