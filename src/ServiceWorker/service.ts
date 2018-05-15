// Contains the interfaces that define the service communication objects

namespace Vidyano {
    export interface IProviderParameters {
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

    export interface IServiceClientData {
        defaultUser: string;
        exception: string;
        languages: { [code: string]: { name: string; isDefault: boolean; messages: { [key: string]: string; } } };
        providers: { [name: string]: { parameters: IProviderParameters } };
        windowsAuthentication: boolean;
    }
}