namespace Vidyano {
    export namespace Helpers {
        export type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

        export class ByNameWrapper<T, U extends object> implements ProxyHandler<U> {
            private _wrapped: ByName<U> = {};

            private constructor(private _objects: T[], private _wrapper: (o: T) => U, private _keyProperty: string = "name") {
            }

            get(target: U, p: PropertyKey, receiver: any): U {
                if (!this._wrapped.hasOwnProperty(p)) {
                    const obj = (typeof p === "string") ? this._objects.find(q => q[this._keyProperty] === p) : this._objects[p];
                    this._wrapped[<string>p] = obj ? this._wrapper(obj) : null;
                }

                return this._wrapped[<string>p];
            }

            static create<T, U extends object>(objects: T[], wrapper: Function, deepFreeze?: boolean, keyProperty?: string): Helpers.ByName<U>;
            static create<T, U extends object>(objects: T[], wrapper: (o: T) => U, keyProperty?: string): Helpers.ByName<U>;
            static create<T, U extends object>(objects: T[], wrapper: ((o: T) => U) | Function, deepFreezeOrKeyProperty?: boolean | string, keyProperty?: string): Helpers.ByName<U> {
                return new Proxy({}, new ByNameWrapper(objects, typeof wrapper === "function" ? o => Helpers.Wrapper._wrap(wrapper, o, <boolean>deepFreezeOrKeyProperty) : wrapper, keyProperty));
            }
        }

        export type ByName<T> = {
            [key: string]: T;
            [key: number]: T;
        };

        export class Wrapper {
            /*
             * For internal use only
             */
            static _wrap<T>(wrapper: Function, obj: any, deepFreeze?: boolean): T {
                const result: any = new (<{ new(value?: any): Object }>wrapper.prototype.constructor)(obj);
                for (let prop in obj) {
                    if (!result.__proto__.hasOwnProperty(prop)) {
                        const value = obj[prop]
                        result[prop] = value && typeof value === "object" ? Wrapper._deepFreeze(value) : value;
                    }
                }

                if (deepFreeze)
                    Wrapper._deepFreeze(result);

                return result;
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