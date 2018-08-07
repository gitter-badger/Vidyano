/// <reference path="wrappers.ts" />

namespace Vidyano {
    const _PersistentObjectWritableProperties = {
        "breadcrumb": 1,
        "label": 1,
        "notification": 1,
        "notificationType": 1,
        "notificationDuration": 1
    };
    const PersistentObjectWritableProperties = Object.keys(_PersistentObjectWritableProperties) as (keyof typeof _PersistentObjectWritableProperties)[];

    export type PersistentObject = Wrappers.Wrap<Service.PersistentObject, typeof PersistentObjectWritableProperties[number], Wrappers.PersistentObjectWrapper>;
    export type ReadOnlyPersistentObject = Readonly<PersistentObject>;

    export namespace Wrappers {
        export class PersistentObjectWrapper extends Wrapper<Service.PersistentObject> {
            private readonly _attributes: PersistentObjectAttribute[];
            private readonly _queries: ReadOnlyQuery[];

            private constructor(private _obj: Service.PersistentObject, private _parent?: QueryWrapper) {
                super();

                this._attributes = Wrapper._wrap(attr => attr.type !== "Reference" ? PersistentObjectAttributeWrapper : PersistentObjectAttributeWithReferenceWrapper, this._obj.attributes || []);
                this._queries = QueryWrapper._wrap(this._obj.queries || []);
            }

            get queries(): ReadOnlyQuery[] {
                return this._queries;
            }

            getQuery(name: string): ReadOnlyQuery {
                return this.queries.find(q => q.name === name);
            }

            get attributes(): PersistentObjectAttribute[] {
                return this._attributes;
            }

            getAttribute(name: string): PersistentObjectAttribute {
                return this.attributes.find(a => a.name === name);
            }

            protected _unwrap(): Service.PersistentObject {
                return super._unwrap(PersistentObjectWritableProperties, "queries", "attributes");
            }

            static _unwrap(obj: PersistentObject): Service.PersistentObject {
                return obj ? obj._unwrap() : null;
            }
        }
    }
}