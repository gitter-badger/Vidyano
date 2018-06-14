namespace Vidyano {
    export type Store = "Requests" | "Queries" | "PersistentObjects" | "ActionClassesById";
    export type RequestMapKey = "GetQuery" | "GetPersistentObject"

    export class IndexedDB {
        private _initializing: Promise<void>;
        private _db: IDBDatabase;

        constructor(private _store?: Store) {
            this._initializing = new Promise<void>(resolve => {
                const dboOpen = indexedDB.open("vidyano.offline", 1);
                dboOpen.onupgradeneeded = () => {
                    var db = <IDBDatabase>dboOpen.result;
                    db.createObjectStore("Requests", { keyPath: "id" });
                    db.createObjectStore("Queries", { keyPath: "id" });
                    db.createObjectStore("PersistentObjects", { keyPath: "id" });
                    db.createObjectStore("ActionClassesById", { keyPath: "id" });
                };

                dboOpen.onsuccess = () => {
                    this._db = <IDBDatabase>dboOpen.result;
                    resolve();
                };
            });
        }

        get db(): IDBDatabase {
            return this._db;
        }

        async save(entry: any, store: Store = this._store) {
            await this._initializing;

            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            requests.put(entry);
        }

        async load(key: any, store: Store = this._store) {
            await this._initializing;

            const tx = this.db.transaction(store, "readwrite");
            const requests = tx.objectStore(store);

            return await new Promise<any>((resolve, reject) => {
                const getData = requests.get(key);
                getData.onsuccess = () => resolve(getData.result);
                getData.onerror = () => resolve(null);
            });
        }
    }
}