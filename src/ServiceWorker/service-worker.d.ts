declare namespace Vidyano {
    interface IProviderParameters {
        label: string;
        description: string;
        requestUri: string;
        signOutUri: string;
        redirectUri: string;
        registerPersistentObjectId?: string;
        registerUser?: string;
        forgotPassword?: boolean;
        getCredentialType?: boolean;
    }
    interface IServiceClientData {
        defaultUser: string;
        exception: string;
        languages: {
            [code: string]: {
                name: string;
                isDefault: boolean;
                messages: {
                    [key: string]: string;
                };
            };
        };
        providers: {
            [name: string]: {
                parameters: IProviderParameters;
            };
        };
        windowsAuthentication: boolean;
    }
}
declare namespace Vidyano {
    class ServiceWorker {
        private _verbose;
        private _initializeDB;
        private _db;
        private _rootPath;
        constructor(_verbose?: boolean);
        private _log(message);
        private _onInstall(e);
        private _onActivate(e);
        private _onFetch(e);
        onGetClientData(clientData: Vidyano.IServiceClientData): Vidyano.IServiceClientData;
    }
}
