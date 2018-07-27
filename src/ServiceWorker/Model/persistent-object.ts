/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type PersistentObject = Wrappers.Wrap<Service.PersistentObject, "breadcrumb" | "label" | "notification" | "notificationType" | "notificationDuration", Wrappers.PersistentObjectWrapper>;
    export type ReadOnlyPersistentObject = Readonly<PersistentObject>;

    export namespace Wrappers {
        export class PersistentObjectWrapper extends Wrapper<Service.PersistentObject> {
            private readonly _attributes: ByName<PersistentObjectAttribute>;
            private readonly _queries: ByName<ReadOnlyQuery>;

            private constructor(private _obj: Service.PersistentObject, private _parent?: QueryWrapper) {
                super();

                this._attributes = ByNameWrapper.create(this._obj.attributes, attr => Wrapper._wrap(attr.type !== "Reference" ? PersistentObjectAttributeWrapper : PersistentObjectAttributeWithReferenceWrapper, attr, !(_parent instanceof QueryWrapper)));
                this._queries = ByNameWrapper.create(this._obj.queries, QueryWrapper, true);
            }

            get queries(): ByName<ReadOnlyQuery> {
                return this._queries;
            }

            get attributes(): ByName<PersistentObjectAttribute> {
                return this._attributes;
            }

            protected _unwrap(): Service.PersistentObject {
                return this._obj;
            }
        }
    }
}