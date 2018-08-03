/// <reference path="wrappers.ts" />

namespace Vidyano {
    export type PersistentObjectAttribute = Wrappers.Wrap<Service.PersistentObjectAttribute, "label" | "group" | "offset" | "tab" | "visibility", Wrappers.PersistentObjectAttributeWrapper>;
    export type ReadOnlyPersistentObjectAttribute = Readonly<PersistentObjectAttribute>;

    export type PersistentObjectAttributeWithReference = Wrappers.Wrap<Service.PersistentObjectAttributeWithReference, "label" | "group" | "offset" | "tab" | "visibility", Wrappers.PersistentObjectAttributeWithReferenceWrapper>;
    export type ReadOnlyPersistentObjectAttributeWithReference = Readonly<PersistentObjectAttributeWithReference>;

    export namespace Wrappers {
        export class PersistentObjectAttributeWrapper extends Wrapper<Service.PersistentObjectAttribute> {
            private _value: any;

            protected constructor(private _attr: Service.PersistentObjectAttribute) {
                super();
            }

            get isValueChanged(): boolean {
                return this._value !== this._attr.value;
            }

            protected set _isValueChanged(isValueChanged: boolean) {
                this._attr.isValueChanged = isValueChanged;
            }

            get value(): any {
                return this._attr.value;
            }

            set value(value: any) {
                this._attr.value = this._value = value;
                this._isValueChanged = true;
            }

            protected _unwrap(...children: string[]): Service.PersistentObjectAttribute {
                return super._unwrap(...children.concat(["isValueChanged", "value"]));
            }

            static _unwrap(obj: PersistentObjectAttribute): Service.PersistentObjectAttribute {
                return obj._unwrap();
            }
        }

        export class PersistentObjectAttributeWithReferenceWrapper extends PersistentObjectAttributeWrapper {
            private constructor(private _attrWithReference: Service.PersistentObjectAttributeWithReference) {
                super(_attrWithReference);
            }

            get objectId(): string {
                return this._attrWithReference.objectId;
            }

            set objectId(objectId: string) {
                this._attrWithReference.objectId = objectId;
                this._isValueChanged = true;
            }

            protected _unwrap(): Service.PersistentObjectAttributeWithReference {
                return <Service.PersistentObjectAttributeWithReference>super._unwrap("objectId");
            }

            static _unwrap(obj: PersistentObjectAttributeWithReference): Service.PersistentObjectAttributeWithReference {
                return obj._unwrap();
            }
        }
    }
}