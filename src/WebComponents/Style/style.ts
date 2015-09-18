﻿module Vidyano.WebComponents {
    @WebComponent.register({
        properties: {
            key: String
        }
    })
    export class Style extends Vidyano.WebComponents.WebComponent {
        private _uniqueId: string = Unique.get();
        private _styleElement: HTMLStyleElement;
        private _styles: { [key: string]: { node: Text; text: string; } } = {};
        key: string;

        attached() {
            super.attached();

            this.parentElement.setAttribute("style-scope-id", this._uniqueId);
        }

        detached() {
            if (this._styleElement) {
                document.head.removeChild(this._styleElement);
                this._styleElement = undefined;
            }

            this.parentElement.removeAttribute("style-scope-id");

            super.detached();
        }

        setStyle(name: string, ...css: string[]) {
            var cssBody = "";
            css.filter(c => !StringEx.isNullOrEmpty(c)).forEach(c => {
                cssBody += this.key + '[style-scope-id="' + this._uniqueId + '"] ' + c + (css.length > 0 ? "\n" : "");
            });

            console.warn("Writing global style: " + name);

            if (!this._styleElement)
                this._styleElement = <HTMLStyleElement>document.head.appendChild(document.createElement("style"));
            
            if (this._styles[name])
                this._styles[name].node.nodeValue = this._styles[name].text = cssBody;
            else
                this._styles[name] = {
                    node: <Text > this._styleElement.appendChild(document.createTextNode(cssBody)),
                    text: cssBody
                };
        }
    }
}