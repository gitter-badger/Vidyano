﻿namespace Vidyano.WebComponents {
    interface IZenscroll {
        toY(y: number);
    }

    class Zenscroll {
        createScroller: (el: Element, duration: number, edgeOffset: number) => IZenscroll;
    }

    declare var zenscroll: Zenscroll;

    @WebComponent.register({
        properties: {
            hovering: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true
            },
            scrolling: {
                type: String,
                readOnly: true,
                reflectToAttribute: true
            },
            atTop: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true,
                value: true
            },
            outerWidth: {
                type: Number,
                notify: true,
                readOnly: true
            },
            outerHeight: {
                type: Number,
                notify: true,
                readOnly: true
            },
            innerWidth: {
                type: Number,
                readOnly: true
            },
            innerHeight: {
                type: Number,
                readOnly: true
            },
            horizontal: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true
            },
            alignVerticalScrollbar: {
                type: String,
                reflectToAttribute: true
            },
            noHorizontal: {
                type: Boolean,
                reflectToAttribute: true,
                value: false
            },
            vertical: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true
            },
            noVertical: {
                type: Boolean,
                reflectToAttribute: true,
                value: false
            },
            scrollbars: {
                type: String,
                reflectToAttribute: true
            },
            verticalScrollOffset: {
                type: Number,
                value: 0,
                notify: true,
                observer: "_verticalScrollOffsetChanged"
            },
            horizontalScrollOffset: {
                type: Number,
                value: 0,
                notify: true,
                observer: "_horizontalScrollOffsetChanged"
            },
            noScrollShadow: {
                type: Boolean,
                reflectToAttribute: true
            },
            scrollTopShadow: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true,
            },
            scrollBottomShadow: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true
            },
            forceScrollbars: {
                type: Boolean,
                reflectToAttribute: true
            }
        },
        forwardObservers: [
            "attribute.objects"
        ],
        observers: [
            "_updateVerticalScrollbar(outerHeight, innerHeight, verticalScrollOffset, noVertical)",
            "_updateHorizontalScrollbar(outerWidth, innerWidth, horizontalScrollOffset, noHorizontal)"
        ],
        listeners: {
            "mouseenter": "_mouseenter",
            "mouseleave": "_mouseleave",
            "scroll": "_trapEvent"
        }
    })
    export class Scroller extends WebComponent {
        private static _minBarSize: number = 40;
        private _scrollEventListener: EventListener;
        private _verticalScrollHeight: number;
        private _verticalScrollTop: number;
        private _verticalScrollSpace: number;
        private _horizontalScrollWidth: number;
        private _horizontalScrollLeft: number;
        private _horizontalScrollSpace: number;
        private _trackStart: number;
        private _zenscroll: IZenscroll;
        readonly hovering: boolean; private _setHovering: (hovering: boolean) => void;
        readonly scrolling: string; private _setScrolling: (scrolling: string) => void;
        readonly atTop: boolean; private _setAtTop: (atTop: boolean) => void;
        readonly outerWidth: number; private _setOuterWidth: (width: number) => void;
        readonly outerHeight: number; private _setOuterHeight: (height: number) => void;
        readonly innerWidth: number; private _setInnerWidth: (width: number) => void;
        readonly innerHeight: number; private _setInnerHeight: (height: number) => void;
        readonly horizontal: boolean; private _setHorizontal: (val: boolean) => void;
        readonly vertical: boolean; private _setVertical: (val: boolean) => void;
        readonly scrollTopShadow: boolean; private _setScrollTopShadow: (val: boolean) => void;
        readonly scrollBottomShadow: boolean; private _setScrollBottomShadow: (val: boolean) => void;
        readonly hiddenScrollbars: boolean; private _setHiddenScrollbars: (val: boolean) => void;
        noHorizontal: boolean;
        noVertical: boolean;
        horizontalScrollOffset: number;
        verticalScrollOffset: number;
        forceScrollbars: boolean;
        noScrollShadow: boolean;

        connectedCallback() {
            super.connectedCallback();

            this.scroller.addEventListener("scroll", this._scrollEventListener = this._scroll.bind(this), { capture: true, passive: true });
        }

        disconnectedCallback() {
            super.disconnectedCallback();

            this.scroller.removeEventListener("scroll", this._scrollEventListener);
        }

        get scroller(): Element {
            // NOTE: This property is used by other components to determine the scrolling parent.
            return this.$.wrapper;
        }

        private async _initializeZenscroll(): Promise<any> {
            if (!this._zenscroll) {
                await this.importHref(this.resolveUrl("zenscroller.html"));
                this._zenscroll = zenscroll.createScroller(this.scroller, 500, 0);
            }
        }

        async scrollToTop(offsetTop: number = 0, animated?: boolean) {
            if (animated) {
                await this._initializeZenscroll();
                this._zenscroll.toY(offsetTop);
            }
            else
                this.scroller.scrollTop = offsetTop;
        }

        async scrollToBottom(animated?: boolean) {
            if (animated) {
                await this._initializeZenscroll();
                this._zenscroll.toY(this.innerHeight);
            }
            else
                this.scroller.scrollTop = this.innerHeight;
        }

        private _outerSizeChanged(e: Event, detail: { width: number; height: number }) {
            this._setOuterWidth(detail.width);
            this._setOuterHeight(detail.height);

            this._updateScrollOffsets();

            e.stopPropagation();
        }

        private _innerSizeChanged(e: Event, detail: { width: number; height: number }) {
            this._setInnerWidth(detail.width);
            this._setInnerHeight(detail.height);

            this._updateScrollOffsets();

            e.stopPropagation();
        }

        private _updateVerticalScrollbar(outerHeight: number, innerHeight: number, verticalScrollOffset: number, noVertical: boolean) {
            let height = outerHeight < innerHeight ? outerHeight / innerHeight * outerHeight : 0;
            if (height !== this._verticalScrollHeight) {
                if (height > 0 && height < Scroller._minBarSize)
                    height = Scroller._minBarSize;
                else
                    height = Math.floor(height);

                this._verticalScrollSpace = outerHeight - height;

                if (height !== this._verticalScrollHeight) {
                    this._verticalScrollHeight = height;
                    (<HTMLElement>this.$.vertical).style.height = `${height}px`;
                }
            }

            this._setVertical(!noVertical && height > 0);

            const verticalScrollTop = verticalScrollOffset === 0 ? 0 : Math.round((1 / ((innerHeight - outerHeight) / verticalScrollOffset)) * this._verticalScrollSpace);
            if (verticalScrollTop !== this._verticalScrollTop)
                (<HTMLElement>this.$.vertical).style.webkitTransform = (<HTMLElement>this.$.vertical).style.transform = `translate3d(0, ${this._verticalScrollTop = verticalScrollTop}px, 0)`;

            this._setScrollTopShadow(!this.noScrollShadow && verticalScrollTop > 0);
            this._setScrollBottomShadow(!this.noScrollShadow && innerHeight - verticalScrollOffset - outerHeight > 0);
        }

        private _updateHorizontalScrollbar(outerWidth: number, innerWidth: number, horizontalScrollOffset: number, noHorizontal: boolean) {
            let width = outerWidth < innerWidth ? outerWidth / innerWidth * outerWidth : 0;
            if (width !== this._horizontalScrollWidth) {
                if (width > 0 && width < Scroller._minBarSize)
                    width = Scroller._minBarSize;
                else
                    width = Math.floor(width);

                this._horizontalScrollSpace = outerWidth - width;

                if (width !== this._horizontalScrollWidth) {
                    this._horizontalScrollWidth = width;
                    (<HTMLElement>this.$.horizontal).style.width = `${width}px`;
                }
            }

            this._setHorizontal(!noHorizontal && width > 0);

            const horizontalScrollLeft = horizontalScrollOffset === 0 ? 0 : Math.round((1 / ((innerWidth - outerWidth) / horizontalScrollOffset)) * this._horizontalScrollSpace);
            if (horizontalScrollLeft !== this._horizontalScrollLeft)
                (<HTMLElement>this.$.horizontal).style.webkitTransform = (<HTMLElement>this.$.horizontal).style.transform = `translate3d(${this._horizontalScrollLeft = horizontalScrollLeft}px, 0, 0)`;
        }

        private _trackVertical(e: Polymer.TrackEvent) {
            if (e.detail.state === "start") {
                this._setScrolling("vertical");
                this._trackStart = this._verticalScrollTop;
            }
            else if (e.detail.state === "track") {
                const newVerticalScrollTop = this._trackStart + e.detail.dy;
                this.scroller.scrollTop = newVerticalScrollTop === 0 ? 0 : (this.innerHeight - this.outerHeight) * ((1 / this._verticalScrollSpace) * newVerticalScrollTop);
            }
            else if (e.detail.state === "end") {
                this._setScrolling(null);
                this._trackStart = undefined;
            }

            e.preventDefault();

            if (e.sourceEvent)
                e.sourceEvent.preventDefault();
        }

        private _trackHorizontal(e: Polymer.TrackEvent) {
            if (e.detail.state === "start") {
                this._setScrolling("horizontal");
                this._trackStart = this._horizontalScrollLeft;
            }
            else if (e.detail.state === "track") {
                const newHorizontalScrollLeft = this._trackStart + e.detail.dx;
                this.scroller.scrollLeft = newHorizontalScrollLeft === 0 ? 0 : (this.innerWidth - this.outerWidth) * ((1 / this._horizontalScrollSpace) * newHorizontalScrollLeft);
            }
            else if (e.detail.state === "end") {
                this._setScrolling(null);
                this._trackStart = undefined;
            }

            e.preventDefault();

            if (e.sourceEvent)
                e.sourceEvent.preventDefault();
        }

        private _trapEvent(e: Event) {
            this.scrollTop = this.scrollLeft = 0;

            e.preventDefault();
            e.stopPropagation();
        }

        private _scroll(e: Event) {
            Popup.closeAll(this);
            this._updateScrollOffsets();
        }

        private _updateScrollOffsets() {
            if (this.vertical)
                this._setAtTop((this.verticalScrollOffset = this.scroller.scrollTop) === 0);

            if (this.horizontal)
                this.horizontalScrollOffset = this.scroller.scrollLeft;
        }

        private _verticalScrollOffsetChanged(newVerticalScrollOffset: number) {
            if (this.scroller.scrollTop === newVerticalScrollOffset)
                return;

            this.scroller.scrollTop = newVerticalScrollOffset;
        }

        private _horizontalScrollOffsetChanged(newHorizontalScrollOffset: number) {
            if (this.scroller.scrollLeft === newHorizontalScrollOffset)
                return;

            this.scroller.scrollLeft = newHorizontalScrollOffset;
        }

        private _mouseenter() {
            this._setHovering(true);
        }

        private _mouseleave() {
            this._setHovering(false);
        }

        private _verticalScrollbarParentTap(e: CustomEvent) {
            const event = <MouseEvent>e.detail.sourceEvent;
            if (event.offsetY) {
                if (event.offsetY > this._verticalScrollTop + this._verticalScrollHeight)
                    this.scroller.scrollTop += this.scroller.scrollHeight * 0.1;
                else if (event.offsetY < this._verticalScrollTop)
                    this.scroller.scrollTop -= this.scroller.scrollHeight * 0.1;

                e.stopPropagation();
            }
        }

        private _horizontalScrollbarParentTap(e: CustomEvent) {
            const event = <MouseEvent>e.detail.sourceEvent;
            if (event.offsetX) {
                if (event.offsetX > this._horizontalScrollLeft + this._horizontalScrollLeft)
                    this.scroller.scrollLeft += this.scroller.scrollWidth * 0.1;
                else if (event.offsetX < this._horizontalScrollLeft)
                    this.scroller.scrollLeft -= this.scroller.scrollWidth * 0.1;

                e.stopPropagation();
            }
        }
    }
}