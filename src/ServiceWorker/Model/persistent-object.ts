namespace Vidyano {
    export type PersistentObject = {
        [Q in Helpers.FilteredKeys<IPersistentObject, any>]: IPersistentObject[Q]
    } & Wrappers.PersistentObject;

    export type ReadOnlyPersistentObject = Readonly<{
        [Q in Helpers.FilteredKeys<IPersistentObject, any>]: IPersistentObject[Q]
    }> & Wrappers.PersistentObject;

    export namespace Wrappers {
        export class PersistentObject {
            private readonly _attributes: Helpers.ByName<PersistentObjectAttribute>;
            private readonly _queries: Helpers.ByName<ReadOnlyQuery>;

            private constructor(private _obj: IPersistentObject, private _parent?: Query) {
                this._attributes = Helpers.ByNameWrapper.create(this._obj.attributes, attr => Helpers.Wrapper._wrap(attr.type !== "Reference" ? PersistentObjectAttribute : PersistentObjectAttributeWithReference, attr, !(_parent instanceof Query)));
                this._queries = Helpers.ByNameWrapper.create(this._obj.queries, Query, true);
            }

            get queries(): Helpers.ByName<ReadOnlyQuery> {
                return this._queries;
            }

            getAttribute(name: string): IPersistentObjectAttribute {
                return this._obj.attributes.find(a => a.name === name);
            }
        }
    }
}