namespace Vidyano {
    export namespace Wrappers {
        export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
        export type Overwrite<T, U> = Omit<T, Extract<keyof T, keyof U>> & U;

        /*
         * Creates a wrapped type taking all properties from ServiceType and makes them readonly except for the ones passed in Writable.
         * Any property defined on the WrapperType will win over any property taken from ServiceType.
         */
        export type Wrap<ServiceType, Writable extends keyof ServiceType, WrapperType> = Overwrite<Readonly<Omit<ServiceType, Writable>> & Pick<ServiceType, Writable>, WrapperType> & WrapperType;

        export type WrapperTypes = PersistentObjectAttributeWrapper | PersistentObjectAttributeWrapper | PersistentObjectAttributeWithReferenceWrapper |
            QueryWrapper | QueryColumnWrapper | QueryResultWrapper | QueryResultItemWrapper | QueryResultItemValueWrapper;

        //const ByNameWrapperSymbol = Symbol();

        //export class ByNameWrapper<T, U extends Wrapper<T>> implements ProxyHandler<U> {
        //    private _array: U[];
        //    private _wrapped: ByName<U> = {
        //        toArray: this._toArray.bind(this)
        //    };

        //    private constructor(private _objects: T[], private _wrapper: (o: T) => U, private _keyProperty: string = "name", private _caseSensitive: boolean = false) {
        //    }

        //    get(target: U, p: PropertyKey, receiver: any): any {
        //        if (typeof p === "string") {
        //            if (p !== "toArray") {
        //                if (!this._caseSensitive)
        //                    p = p.toUpperCase();

        //                if (!this._wrapped.hasOwnProperty(p)) {
        //                    const obj = this._objects.find(q => {
        //                        const key = q[this._keyProperty] || "";
        //                        return (!this._caseSensitive ? key.toUpperCase() : key) === p;
        //                    });

        //                    this._wrapped[<string>p] = obj ? this._wrapper(obj) : null;
        //                }

        //                return this._wrapped[<string>p];
        //            }
        //            else
        //                return this._toArray.bind(this);
        //        }

        //        if (p === ByNameWrapperSymbol)
        //            return this;

        //        return undefined;
        //    }

        //    private _toArray(): U[] {
        //        if (!this._array) {
        //            this._array = this._objects.map(o => {
        //                let wrappedO = this._wrapped[o[this._keyProperty]];
        //                if (!wrappedO)
        //                    this._wrapped[o[this._keyProperty]] = wrappedO = this._wrapper(o);

        //                return <U>wrappedO;
        //            })
        //        }

        //        return this._array;
        //    }

        //    private _unwrap(): T[] {
        //        return this._objects.map(o => {
        //            const wrapped = this._wrapped[o[this._keyProperty]];
        //            if (!wrapped)
        //                return o;

        //            return wrapped["_unwrap"]();
        //        });
        //    }

        //    static create<T, U extends object>(objects: T[], wrapper: Function, deepFreeze?: boolean, keyProperty?: string, caseSensitive: boolean = false): ByName<U> {
        //        return new Proxy(<any>{}, new ByNameWrapper(objects, typeof wrapper === "function" ? o => Wrapper._wrap(wrapper, o, <boolean>deepFreeze) : wrapper, keyProperty, caseSensitive));
        //    }

        //    static update<T, U extends Wrapper<T>>(byName: ByNameWrapper<T, U>, newObjects: U[]) {
        //        byName._objects.splice(0, byName._objects.length, newObjects.splice);

        //    }
        //}

        export abstract class Wrapper<T> {
            private __wrappedProperties__: (keyof T)[] = [];

            /*
             * For internal use only
             */
            protected _unwrap(...children: string[]): T {
                const result: any = {};

                for (let i = 0; i < this.__wrappedProperties__.length; i++) {
                    const prop = this.__wrappedProperties__[i];
                    result[prop] = (<any>this)[prop];
                }

                for (let i = 0; i < children.length; i++) {
                    const prop = children[i];
                    const child = (<any>this)[prop];
                    if (Array.isArray(child))
                        result[prop] = child.map(c => c._unwrap());
                    else
                        result[prop] = child._unwrap();
                }

                return result as T;
            }

            /*
             * For internal use only
             */
            static _wrap<T>(wrapper: Function, object: any): T;
            static _wrap<T>(wrapper: Function, objects: any[]): T[];
            static _wrap<T>(wrapper: Function, objects: any | any[] = []): Wrapper<T> | Wrapper<T>[] {
                if (Array.isArray(objects))
                    return objects.map(obj => Wrapper._wrap(wrapper, obj) as Wrapper<T>);

                const object = objects;
                let result: any;
                if (wrapper.prototype)
                    result = new (<{ new(value?: any): Object }>wrapper.prototype.constructor)(object);
                else
                    result = new (<{ new(value?: any): Object }>wrapper(object))(object);

                const props: (keyof T)[] = [];
                for (let prop in object) {
                    if (!result.__proto__.hasOwnProperty(prop)) {
                        const value = object[prop];
                        result[prop] = value;

                        result.__wrappedProperties__.push(prop);
                    }
                }

                return result;
            }

            static _unwrap<T extends Wrapper<U>, U>(obj: T): U {
                return obj._unwrap();
            }
        }
    }
}