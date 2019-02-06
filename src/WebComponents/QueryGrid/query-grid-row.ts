namespace Vidyano.WebComponents {
    @Vidyano.WebComponents.WebComponent.register({
        properties: {
            lazyItem: {
                type: Object,
                observer: "_lazyItemChanged"
            },
            item: {
                type: Object,
                readOnly: true
            },
            columns: Array,
            index: {
                type: Number,
                observer: "_indexChanged"
            },
            canRead: {
                type: Boolean,
                computed: "_computeCanRead(item, item.query.canRead)",
                reflectToAttribute: true
            },
            loading: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true
            }
        },
        observers: [
            "_fireConnected(item, index, isConnected)"
        ],
        forwardObservers: [
            "item.isSelected"
        ],
        listeners: {
            "tap": "_getPersistentObject"
        }
    })
    export class QueryGridRow extends Vidyano.WebComponents.WebComponent {
        private _connectedFired: boolean;
        private _columnsToRender: QueryGridColumn[];
        readonly loading: boolean; private _setLoading: (loading: boolean) => void;
        readonly item: QueryResultItem; private _setItem: (item: QueryResultItem) => void;
        lazyItem: QueryGridLazyQueryResultItem;
        columns: QueryGridColumn[];
        forceOffscreen: boolean;

        disconnectedCallback() {
            super.disconnectedCallback();
            this._connectedFired = false;
        }

        private async _lazyItemChanged(lazyItem: QueryGridLazyQueryResultItem, oldLazyItem: QueryGridLazyQueryResultItem) {
            if (this.item === lazyItem.item)
                return;

            if (!lazyItem) {
                this._setLoading(false);
                return;
            }

            this._setLoading(true);
            if (!lazyItem.item && lazyItem.loader) {
                this._setItem(null);
                await lazyItem.loader;

                if (lazyItem !== this.lazyItem)
                    return;
            }

            this._columnsToRender = this.columns.slice();
            this._setItem(lazyItem.item);
        }

        private async _getPersistentObject(e: Polymer.TapEvent) {
            if (!this.item || !this.item || !this.item.query.canRead)
                return;

            this.fire("open", this.lazyItem);
        }

        private _select(e: Polymer.TapEvent) {
            this.fire("item-select", {
                item: this.item,
                shift: !!event && event instanceof MouseEvent ? event.shiftKey : false,
                ctrl: this.app.configuration.getSetting("vi-query-grid.single-click", "true").toLowerCase() === "true" || (!!event && event instanceof MouseEvent ? event.ctrlKey : true)
            }, { bubbles: true });
        }

        private _getIsSelectedIcon(isSelected: boolean): string {
            return isSelected ? "Selected" : "Unselected";
        }

        private _computeCanRead(item: QueryResultItem, canRead: boolean): boolean {
            return canRead && !!item;
        }

        private _fireConnected(item: QueryResultItem, index: number, isConnected: boolean) {
            if (this._connectedFired)
                return;

            Polymer.flush();
            this.fire("row-connected", { item: item, index: index, row: this });
            this._connectedFired = true;
        }

        cellRendered(cell: QueryGridCell) {
            this._columnsToRender.remove(cell.column);

            if (!this._columnsToRender.length) {
                this._setLoading(false);
                this.style.transform = `translate3d(0, ${this["targetY"]}px, 0)`;
                this["targetY"] = undefined;
            }
        }

        private _indexChanged(index: number) {
            this.classList.toggle("odd", !!((index + 1) % 2));
        }

        getCellWidths(): {
            column: QueryGridColumn;
            width: number;
        }[] {
            const cells = <QueryGridCell[]>Array.from(this.shadowRoot.querySelectorAll("vi-query-grid-cell"));
            return cells.filter(cell => cell.firstElementChild).map(cell => ({
                column: cell.column,
                width: cell.getBoundingClientRect().width
            }));
        }
    }
}