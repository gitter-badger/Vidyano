namespace Vidyano {
    export namespace Wrappers {
        export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
        export type Overwrite<T, U> = Omit<T, Extract<keyof T, keyof U>> & U;

        /*
         * Creates a wrapped type taking all properties from ServiceType and makes them readonly except for the ones passed in Writable.
         * Any property defined on the WrapperType will win over any property taken from ServiceType.
         */
        export type Wrap<ServiceType, Writable extends keyof ServiceType, WrapperType> = Overwrite<Readonly<Omit<ServiceType, Writable>> & Pick<ServiceType, Writable>, WrapperType> & WrapperType;

        export type ByName<T> = {
            [key: string]: T;
            [key: number]: T;
        };

        const ByNameWrapperSymbol = Symbol();

        export class ByNameWrapper<T, U extends Wrapper<T>> implements ProxyHandler<U> {
            private _wrapped: ByName<U> = {};

            private constructor(private _target: any, private _objects: T[], private _wrapper: (o: T) => U, private _keyProperty: string = "name") {
            }

            get(target: U, p: PropertyKey, receiver: any): any {
                if (p === ByNameWrapperSymbol)
                    return this;

                if (!this._wrapped.hasOwnProperty(p)) {
                    const obj = (typeof p === "string") ? this._objects.find(q => q[this._keyProperty] === p) : this._objects[p];
                    this._wrapped[<string>p] = obj ? this._wrapper(obj) : null;
                }

                return this._wrapped[<string>p];
            }

            private _unwrap(): T[] {
                return this._objects.map(o => {
                    const wrapped = this._wrapped[o[this._keyProperty]];
                    if (!wrapped)
                        return o;

                    return wrapped["_unwrap"]();
                });
            }

            static create<T, U extends object>(objects: T[], wrapper: Function, deepFreeze?: boolean, keyProperty?: string): ByName<U>;
            static create<T, U extends object>(objects: T[], wrapper: (o: T) => U, keyProperty?: string): ByName<U>;
            static create<T, U extends object>(objects: T[], wrapper: ((o: T) => U) | Function, deepFreezeOrKeyProperty?: boolean | string, keyProperty?: string): ByName<U> {
                const target = {};
                return new Proxy(target, new ByNameWrapper(target, objects, typeof wrapper === "function" ? o => Wrapper._wrap(wrapper, o, <boolean>deepFreezeOrKeyProperty) : wrapper, keyProperty));
            }
        }

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
                    if (child instanceof Wrapper)
                        result[prop] = child._unwrap();
                    else {
                        const byNameWrapper = child[ByNameWrapperSymbol];
                        if (byNameWrapper instanceof ByNameWrapper)
                            byNameWrapper["_unwrap"]();
                        else
                            throw `Unable to unwrap child "${prop}"`;
                    }
                }

                return result as T;
            }

            /*
             * For internal use only
             */
            static _wrap<T>(obj: any, deepFreeze?: boolean): T;
            static _wrap<T>(wrapper: Function, obj: any, deepFreeze?: boolean): T;
            static _wrap<T>(wrapperOrObj: Function, objOrDeepFreeze?: any, deepFreeze?: boolean): Wrapper<T> {
                let result: any;
                let obj: T;
                if (typeof wrapperOrObj === "function")
                    result = new (<{ new(value?: any): Object }>wrapperOrObj.prototype.constructor)(obj = objOrDeepFreeze);
                else {
                    result = new (<{ new(value?: any): Object }>this.prototype.constructor)(obj = wrapperOrObj);
                    deepFreeze = objOrDeepFreeze;
                }

                const props: (keyof T)[] = [];
                for (let prop in obj) {
                    if (!result.__proto__.hasOwnProperty(prop)) {
                        const value = obj[prop]
                        result[prop] = value && typeof value === "object" ? Wrapper._deepFreeze(value) : value;

                        result.__wrappedProperties__.push(prop);
                    }
                }

                if (deepFreeze)
                    Wrapper._deepFreeze(result);

                return result;
            }

            static _unwrap<T extends Wrapper<U>, U>(obj: T): U {
                return obj._unwrap();
            }

            private static _deepFreeze(obj: any) {
                if (Object.isFrozen(obj))
                    return obj;

                const propNames = Object.getOwnPropertyNames(obj);

                // Freeze properties before freezing self
                for (let name of propNames) {
                    const value = obj[name];
                    obj[name] = value && typeof value === "object" ? Wrapper._deepFreeze(value) : value;
                }

                return Object.freeze(obj);
            }
        }
    }
}