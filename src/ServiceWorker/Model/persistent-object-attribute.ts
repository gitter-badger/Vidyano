namespace Vidyano {
    export type PersistentObjectAttribute = {
        [Q in Helpers.FilteredKeys<IPersistentObjectAttribute, any>]: IPersistentObjectAttribute[Q]
    } & Wrappers.PersistentObjectAttribute;

    export type ReadOnlyPersistentObjectAttribute = Readonly<{
        [Q in Helpers.FilteredKeys<IPersistentObjectAttribute, any>]: IPersistentObjectAttribute[Q]
    }> & Wrappers.PersistentObjectAttribute;

    export type PersistentObjectAttributeWithReference = {
        [Q in Helpers.FilteredKeys<IPersistentObjectAttributeWithReference, any>]: IPersistentObjectAttributeWithReference[Q]
    } & Wrappers.PersistentObjectAttributeWithReference;

    export type ReadOnlyPersistentObjectAttributeWithReference = Readonly<{
        [Q in Helpers.FilteredKeys<IPersistentObjectAttributeWithReference, any>]: IPersistentObjectAttributeWithReference[Q]
    }> & Wrappers.PersistentObjectAttributeWithReference;

    export namespace Wrappers {
        export class PersistentObjectAttribute {
            protected constructor(private _obj: IPersistentObjectAttribute) {
            }

            get isReference(): boolean {
                return this._obj.type === "Reference";
            }
        }

        export class PersistentObjectAttributeWithReference extends Wrappers.PersistentObjectAttribute {
            private constructor(_obj: IPersistentObjectAttributeWithReference) {
                super(_obj);
            }
        }
    }
}