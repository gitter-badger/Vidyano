declare namespace Vidyano.Service {
    type KeyValue<T> = {
        [key: string]: T;
    };
    type KeyValueString = KeyValue<string>;
    type NotificationType = "" | "OK" | "Notice" | "Warning" | "Error";
    interface IRequest {
        userName?: string;
        authToken?: string;
        clientVersion?: string;
        environment: "Web";
        environmentVersion: "2";
    }
    interface IGetApplicationRequest extends IRequest {
        password?: string;
    }
    interface IGetQueryRequest extends IRequest {
        id: string;
    }
    interface IGetPersistentObjectRequest extends IRequest {
        persistentObjectTypeId: string;
        objectId?: string;
        isNew?: boolean;
        parent?: IPersistentObject;
    }
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
    interface IClientData {
        defaultUser: string;
        exception: string;
        languages: {
            [code: string]: {
                name: string;
                isDefault: boolean;
                messages: KeyValueString;
            };
        };
        providers: {
            [name: string]: {
                parameters: IProviderParameters;
            };
        };
        windowsAuthentication: boolean;
    }
    interface IApplication {
        application: IPersistentObject;
        authToken: string;
        userCultureInfo: string;
        userLanguage: string;
        userName: string;
        hasSensitive: boolean;
    }
    interface IPersistentObject {
        attributes?: IPersistentObjectAttribute[];
        breadcrumb?: string;
        isBreadcrumbSensitive?: boolean;
        fullTypeName: string;
        id: string;
        isSystem: boolean;
        label: string;
        newOptions: string;
        notification: string;
        notificationType: NotificationType;
        notificationDuration: number;
        queries: IQuery[];
        queryLayoutMode: string;
        securityToken: string;
        stateBehavior?: "OpenInEdit" | "StayInEdit" | "AsDialog";
        tabs: IPersistentObjectTab[];
        type: string;
    }
    interface IPersistentObjectAttribute {
        name: string;
        type: string;
        label: string;
        value?: string;
        isReadOnly?: boolean;
        isRequired?: boolean;
        isSensitive?: boolean;
        rules?: string;
        visibility: string;
    }
    interface IPersistentObjectTab {
        columnCount: number;
        id: string;
        name: string;
    }
    interface IQuery {
        actions: string[];
        actionLabels?: KeyValueString;
        allowTextSearch: boolean;
        autoQuery: boolean;
        canRead: boolean;
        columns: IQueryColumn[];
        disableBulkEdit: boolean;
        enableSelectAll: boolean;
        filters: IPersistentObject;
        groupedBy: string;
        id: string;
        label: string;
        name: string;
        notificationType: NotificationType;
        notification: string;
        pageSize: number;
        persistentObject: IPersistentObject;
        result: IQueryResult;
        sortOptions: string;
    }
    interface IQueryColumn {
        canFilter: boolean;
        canGroupBy: boolean;
        canListDistincts: boolean;
        canSort: boolean;
        id: string;
        isHidden: boolean;
        isSensitive?: boolean;
        label: string;
        name: string;
        offset: number;
        type: string;
    }
    interface IQueryResult {
        pageSize: number;
        totalItems: number;
        columns: IQueryColumn[];
        items: IQueryResultItem[];
        groupingInfo: IQueryGroupingInfo;
        groupedBy: string;
        notification: string;
        notificationType: NotificationType;
        notificationDuration: number;
        sortOptions: string;
        charts: IQueryChart[];
        totalItem: IQueryResultItem;
        continuation?: string;
    }
    interface IQueryResultItem {
        id: string;
        typeHints: KeyValueString;
        values: IQueryResultItemValue[];
    }
    interface IQueryResultItemValue {
        key: string;
        typeHints: KeyValueString;
        value: string;
    }
    interface IQueryGroupingInfo {
        groupedBy: string;
        groups?: IQueryResultItemGroup[];
    }
    interface IQueryResultItemGroup {
        name: string;
        count: number;
    }
    interface IQueryChart {
        label: string;
        name: string;
        type: string;
        options: any;
    }
    interface IRetryAction {
        title: string;
        message: string;
        options: string[];
        defaultOption?: number;
        cancelOption?: number;
        persistentObject?: IPersistentObject;
    }
    interface IProfilerRequest {
        when: Date;
        profiler: IProfiler;
        transport: number;
        method: string;
        request: any;
        response: any;
    }
    interface IProfiler {
        taskId: number;
        elapsedMilliseconds: number;
        entries: IProfilerEntry[];
        sql: IProfilerSQL[];
        exceptions: {
            id: string;
            message: string;
        }[];
    }
    interface IProfilerEntry {
        entries: IProfilerEntry[];
        methodName: string;
        sql: string[];
        started: number;
        elapsedMilliseconds: number;
        hasNPlusOne?: boolean;
        exception: string;
        arguments: any[];
    }
    interface IProfilerSQL {
        commandId: string;
        commandText: string;
        elapsedMilliseconds: number;
        recordsAffected: number;
        taskId: number;
        type: string;
        parameters: IProfilerSQLParameter[];
    }
    interface IProfilerSQLParameter {
        name: string;
        type: string;
        value: string;
    }
    interface IProfilerRequest {
        when: Date;
        profiler: IProfiler;
        transport: number;
        method: string;
        request: any;
        response: any;
    }
    interface IProfiler {
        taskId: number;
        elapsedMilliseconds: number;
        entries: IProfilerEntry[];
        sql: IProfilerSQL[];
        exceptions: {
            id: string;
            message: string;
        }[];
    }
    interface IProfilerEntry {
        entries: IProfilerEntry[];
        methodName: string;
        sql: string[];
        started: number;
        elapsedMilliseconds: number;
        hasNPlusOne?: boolean;
        exception: string;
        arguments: any[];
    }
    interface IProfilerSQL {
        commandId: string;
        commandText: string;
        elapsedMilliseconds: number;
        recordsAffected: number;
        taskId: number;
        type: string;
        parameters: IProfilerSQLParameter[];
    }
    interface IProfilerSQLParameter {
        name: string;
        type: string;
        value: string;
    }
}
declare namespace Vidyano {
    type Store = "Requests" | "GetQueries" | "GetPersistentObjects";
    class ServiceWorker {
        private _offline;
        private _verbose;
        private _initializeDB;
        private _db;
        private _rootPath;
        private _requestHandlerMap;
        constructor(_offline?: boolean, _verbose?: boolean);
        private _log(message);
        private _onInstall(e);
        private _onActivate(e);
        protected onRegisterRequestHandlers(register: (handler: ServiceWorkerRequestHandler) => void): Promise<void>;
        private _onFetch(e);
        private _createFetcher(originalRequest, response);
        private _callFetchHanders<T>(key, request, response);
        protected onGetClientData(clientData: Service.IClientData): Promise<Service.IClientData>;
        protected createRequest(data: any, request: Request): Request;
        protected createResponse(data: any, response?: Response): Response;
    }
    type Fetcher<TRequestPayload, TResponseBody> = (payload: TRequestPayload) => Promise<TResponseBody>;
    type IGetApplicationRequest = Service.IGetApplicationRequest;
    type IApplication = Service.IApplication;
    type IGetQueryRequest = Service.IGetQueryRequest;
    type IQuery = Service.IQuery;
    type IGetPersistentObjectRequest = Service.IGetPersistentObjectRequest;
    type IPersistentObject = Service.IPersistentObject;
    abstract class ServiceWorkerRequestHandler {
        protected save(store: Store, entry: any): void;
        protected load(store: Store, key: any): Promise<any>;
        protected _fetch(request: Request): Promise<Response>;
        readonly db: IDBDatabase;
        fetch(payload: any, fetcher: Fetcher<Service.IRequest, any>): Promise<any>;
    }
    class ServiceWorkerGetApplicationRequestHandler extends ServiceWorkerRequestHandler {
        fetch(payload: IGetApplicationRequest, fetcher: Fetcher<IGetApplicationRequest, IApplication>): Promise<IApplication>;
    }
    class ServiceWorkerGetQueryRequestHandler extends ServiceWorkerRequestHandler {
        fetch(payload: IGetQueryRequest, fetcher: Fetcher<IGetQueryRequest, IQuery>): Promise<IQuery>;
    }
    class ServiceWorkerGetPersistentObjectRequestHandler extends ServiceWorkerRequestHandler {
        fetch(payload: IGetPersistentObjectRequest, fetcher: Fetcher<IGetPersistentObjectRequest, IPersistentObject>): Promise<IPersistentObject>;
    }
}
