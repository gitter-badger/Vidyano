namespace Vidyano {
    export type Query = {
        [Q in Helpers.FilteredKeys<IQuery, string | boolean | number>]: IQuery[Q]
    } & Wrappers.Query;

    export type ReadOnlyQuery = Readonly<{
        [Q in Helpers.FilteredKeys<IQuery, string | boolean | number>]: IQuery[Q]
    }> & Wrappers.Query;

    export namespace Wrappers {
        export class Query {
            private readonly _persistentObject: ReadOnlyPersistentObject;
            private readonly _items: Helpers.ByName<QueryResultItem>;

            private constructor(private _query: IQuery) {
                this._persistentObject = Helpers.Wrapper._wrap(PersistentObject, this._query.persistentObject, true);
                this._items = Helpers.ByNameWrapper.create(this._query.result.items, QueryResultItem, true, "id");
            }

            get persistentObject(): ReadOnlyPersistentObject {
                return this._persistentObject;
            }

            get items(): Helpers.ByName<QueryResultItem> {
                return this._items;
            }
        }
    }
}