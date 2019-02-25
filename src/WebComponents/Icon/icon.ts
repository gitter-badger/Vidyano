namespace Vidyano.WebComponents {
    @WebComponent.register({
        properties: {
            source: {
                type: String,
                observer: "_load",
                value: null,
                reflectToAttribute: true
            },
            unresolved: {
                type: Boolean,
                readOnly: true,
                reflectToAttribute: true
            }
        },
        observers: [
            "_load(source, isConnected)"
        ]
    })
    export class Icon extends ResourceBase {
        private _source: string;
        source: string;
        readonly unresolved: boolean; private _setUnresolved: (unresolved: boolean) => void;

        private _load(source: string, isConnected: boolean) {
            if (isConnected) {
                if (!source)
                    this.shadowRoot.innerHTML = "";

                if (this._source === source)
                    return;
            }

            const resource = Resource.Load("icon", this._source = source);
            this._setUnresolved(!resource);

            if (!this.unresolved) {
                const fragment = document.createDocumentFragment();
                const host = document.createElement("div");
                fragment.appendChild(host);

                Array.from(resource.children).forEach((child: HTMLElement) => {
                    host.appendChild(child.cloneNode(true));
                });

                this.shadowRoot.appendChild(fragment);
            }
        }
    }
}