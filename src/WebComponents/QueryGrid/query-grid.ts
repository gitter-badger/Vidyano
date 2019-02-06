namespace Vidyano.WebComponents {
    export type QueryGridLazyQueryResultItem = { item: Vidyano.QueryResultItem; loader?: Promise<void>; };

    @Vidyano.WebComponents.WebComponent.register({
        properties: {
            query: {
                type: Object,
                observer: "_queryChanged"
            },
            columns: {
                type: Array,
                computed: "_computeColumns(query.columns)"
            },
            items: {
                type: Array,
                computed: "_computeItems(query.items, isConnected)"
            },
            horizontalScrollOffset: {
                type: Number
            },
            dataHostWidth: {
                type: Number,
                observer: "_dataHostWidthChanged"
            },
            loading: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true,
                value: true
            }
        },
        forwardObservers: [
            "query.items",
            "query.columns"
        ],
        observers: [
            "_syncHorizontalScrollOffset(horizontalScrollOffset)"
        ],
        listeners: {
            "row-connected": "_rowConnected",
            "item-select": "_itemSelect"
        }
    })
    export class QueryGrid extends Vidyano.WebComponents.WebComponent {
        private _measureAF: number;
        private _physicalRows: QueryGridRow[];
        private _syncingHeader: boolean;
        private _syncingData: boolean;
        private _lastSelectedItemIndex: number;
        readonly items: QueryGridLazyQueryResultItem[];
        readonly loading: boolean; private _setLoading: (loading: boolean) => void;
        query: Vidyano.Query;
        horizontalScrollOffset: number;

        connectedCallback() {
            super.connectedCallback();

            this.app.importComponent("ActionButton");
            this.app.importLib("iron-list");

            this.$.headerHost.addEventListener("scroll", e => {
                if (!this._syncingHeader) {
                    this._syncingData = true;
                    this.horizontalScrollOffset = this.$.headerHost.scrollLeft;
                }
                this._syncingHeader = false;
            }, { capture: true, passive: true });
        }

        private _syncHorizontalScrollOffset(horizontalScrollOffset: number) {
            if (!this._syncingData) {
                this._syncingHeader = true;
                const horizontalScrollOffset = this.horizontalScrollOffset;
                this.$.headerHost.scrollLeft = horizontalScrollOffset;

                if (this._physicalRows && this._physicalRows.length) {
                    this._physicalRows.forEach(row => {
                        row.$.header.style.transform = `translate3d(${horizontalScrollOffset}px, 0, 0)`;
                    });
                }
            }
            this._syncingData = false;
        }

        private _dataHostWidthChanged(dataHostWidth: number) {
            this.updateStyles({
                "--vi-query-grid--row-container-width": `${dataHostWidth}px`
            });
        }

        private _computeColumns(columns: Vidyano.QueryColumn[]): QueryGridColumn[] {
            if (!columns)
                return [];

            const columnsSlot = <HTMLSlotElement>this.$.columns;

            const gridColumns = <QueryGridColumn[]>  Array.from(this.querySelectorAll("vi-query-grid-column"));
            if (gridColumns.length) {
                return gridColumns.map(g => {
                    g.column = columns.find(c => c.name === g.name);
                    return g.column ? g : null;
                }).filter(c => !!c);
            }

            return columns.map(c => {
                const gc = new Vidyano.WebComponents.QueryGridColumn();
                gc.name = c.name;
                gc.column = c;
                return gc;
            });
        }

        private _computeItems(items: Vidyano.QueryResultItem[]): QueryGridLazyQueryResultItem[] {
            this._setLoading(true);

            const list = <any>this.$.dataList;
            list.scrollTarget = (<Scroller>this.$.dataHost).scroller;

            const handler = {
                lazyItems: [],
                get: (target, prop) => {
                    if (prop === "length")
                        return !this.query.hasMore ? this.query.totalItems : this.query.totalItems + 1;
                    else if (isNaN(prop))
                        return target[prop];
                    else {
                        const index = parseInt(prop);
                        const item = target[prop];

                        const currentLazyItem = handler.lazyItems[index];
                        if (currentLazyItem && currentLazyItem.item === item)
                            return currentLazyItem;

                        const lazyItem: QueryGridLazyQueryResultItem = {
                            item: item,
                        };

                        if (!lazyItem.item) {
                            lazyItem.loader = this.query.queueWork(async () => {
                                if (this.query.items[index]) {
                                    // The item was fetched in the meantime
                                    lazyItem.item = this.query.items[index];
                                    lazyItem.loader = null;
                                }
                                else if (this._physicalRows.some(r => r.lazyItem === lazyItem) || this.query.hasMore) {
                                    // A row is still bound to this item so query it
                                    const hasMoreItemCount = this.query.hasMore ? target.length : -1;
                                    await this.query.getItems(index, this.query.pageSize, true).then(() => {
                                        lazyItem.item = this.query.items[index];
                                        lazyItem.loader = null;

                                        if (hasMoreItemCount > 0) {
                                            (<Polymer.Element>this.$.dataList).notifySplices("items", [{
                                                index: hasMoreItemCount,
                                                removed: [],
                                                addedCount: this.query.items.length - hasMoreItemCount,
                                                items: this.query.items,
                                                type: "splice"
                                            }]);
                                        }
                                    });
                                }
                                else
                                    handler.lazyItems[index] = null;
                            });
                        }

                        return (handler.lazyItems[index] = lazyItem);
                    }
                }
            };

            return new Proxy(items, handler);
        }

        private _queryChanged() {
            this.updateStyles();
            this._setLoading(true);
        }

        private _rowConnected(e: CustomEvent) {
            e.stopPropagation();

            const detail: { item: Vidyano.QueryResultItem; index: number; row: QueryGridRow; } = e.detail;
            (this._physicalRows || (this._physicalRows = [])).push(detail.row);

            if (!this.loading)
                return;

            const measure = () => {
                if (!this.loading)
                    return;

                const headersTemplate = <any>this.$.headers;
                headersTemplate.render();

                const headers: { [key: string]: number; } = {};
                this.shadowRoot.querySelectorAll("vi-query-grid-header").forEach((header: QueryGridHeader) => headers[header.column.name] = header.offsetWidth);

                this._measureAF = 0;

                const parentBoundingRect = this.$.dataHost.getBoundingClientRect();
                const rowRect = detail.row.getBoundingClientRect();

                const rows = this._physicalRows.filter(row => !!row.item);
                if (rows.length === rows.filter(r => !r.loading).length && (rowRect.bottom > parentBoundingRect.height || detail.index === this.query.items.length - 1)) {
                    const style = {};
                    let totalWidth = 0;

                    const cellWidths = [].concat.apply([], this._physicalRows.map(row => row.getCellWidths()));
                    cellWidths.groupBy(cw => cw.column.name, cw => cw).forEach((cwg, index) => {
                        const width = Math.max(cwg.value.max(cw => cw.width), headers[cwg.key]);
                        totalWidth += width;
                        style[`--vi-query-grid-attribute-${cwg.key.replace(".", "-")}-width`] = `${width}px`;
                    });

                    style["--vi-query-grid--row-width"] = `${totalWidth}px`;
                    this.updateStyles(style);

                    this._setLoading(false);
                }
                else
                    this._measureAF = requestAnimationFrame(measure);
            };

            cancelAnimationFrame(this._measureAF);
            this._measureAF = requestAnimationFrame(measure);
        }

        private _itemSelect(e: CustomEvent) {
            const detail: { item: Vidyano.QueryResultItem; shift: boolean; ctrl: boolean; } = e.detail;

            const indexOfItem = this.query.items.indexOf(detail.item);
            if (!detail.item.isSelected && this._lastSelectedItemIndex >= 0 && detail.shift) {
                if (this.query.selectRange(Math.min(this._lastSelectedItemIndex, indexOfItem), Math.max(this._lastSelectedItemIndex, indexOfItem))) {
                    this._lastSelectedItemIndex = indexOfItem;
                    return;
                }
            }

            if (!detail.ctrl) {
                if (this.query.selectAll.isAvailable && this.query.selectAll)
                    this.query.selectAll.allSelected = this.query.selectAll.inverse = false;

                this.query.selectedItems = this.query.selectedItems.length > 1 || !detail.item.isSelected ? [detail.item] : [];
            }
            else
                detail.item.isSelected = !detail.item.isSelected;

            if (detail.item.isSelected)
                this._lastSelectedItemIndex = indexOfItem;
        }
    }
}