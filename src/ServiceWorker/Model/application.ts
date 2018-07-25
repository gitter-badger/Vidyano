namespace Vidyano {
    export class Application {
        private _application: PersistentObject;
        readonly userLanguage: string;
        readonly userName: string;
        readonly hasSensitive: boolean;

        constructor(private _serviceWorker: ServiceWorker, response: Service.IApplicationResponse) {
            this._application = Helpers.Wrapper._wrap(Wrappers.PersistentObject, response.application);
            this.userLanguage = response.userLanguage;
            this.userName = response.userName;
            this.hasSensitive = response.hasSensitive;

            CultureInfo.currentCulture = CultureInfo.cultures[response.userCultureInfo] || CultureInfo.cultures[response.userLanguage] || CultureInfo.invariantCulture;
        }

        getTranslatedMessage(key: string, ...params: string[]): string {
            const msgItem = this._application.queries.ClientMessages.items[key];
            const msg = msgItem ? msgItem.values.Value.value : this._serviceWorker.clientData.languages[this.userLanguage].messages[key];

            return msg ? StringEx.format.apply(null, [msg].concat(params)) : key;
        }
    }
}