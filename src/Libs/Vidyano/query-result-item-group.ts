namespace Vidyano {
    "use strict";

    export interface IQueryGroupingInfo extends Service.IQueryGroupingInfo {
        groups?: QueryResultItemGroup[];
    }

    export class QueryResultItemGroup implements Service.IQueryResultItemGroup {
        private _name: string;
        private _count: number;
        private _items: QueryResultItem[];
        isCollapsed: boolean;

        constructor(public readonly query: Query, group: Service.IQueryResultItemGroup, private _start: number, private _end: number) {
            this._name = group.name;
            this._count = group.count;

            this._items = new Array(this._count);
            const items = query.items.slice(_start, _end);
            this._items.splice(0, items.length, ...items);

            this.isCollapsed = false;
        }

        get name(): string {
            return this._name;
        }

        get count(): number {
            return this._count;
        }

        get start(): number {
            return this._start;
        }

        get end(): number {
            return this._end;
        }

        get items(): QueryResultItem[] {
            return this._items;
        }

        update(group: Service.IQueryResultItemGroup, start: number, end: number) {
            this._count = group.count;
            this._start = start;
            this._end = end;

            this._items = new Array(this._count);
            const items = this.query.items.slice(start, end);
            this._items.splice(0, items.length, ...items);
        }
    }
}