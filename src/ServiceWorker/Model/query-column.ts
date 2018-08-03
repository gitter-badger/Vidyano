/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type QueryColumn = Wrappers.Wrap<Service.QueryColumn, "canSort" | "label" | "offset", Wrappers.QueryColumnWrapper>;
    export type ReadOnlyQueryColumn = Readonly<QueryColumn>;

    export namespace Wrappers {
        export class QueryColumnWrapper extends Wrapper<Service.QueryColumn> {
            private constructor(private _column: Service.QueryColumn) {
                super();
            }

            static _unwrap(obj: QueryColumn): Service.QueryColumn {
                return obj._unwrap();
            }
        }
    }
}