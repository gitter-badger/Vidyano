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
        environment: "Web" | "Web,ServiceWorker";
        environmentVersion: string;
    }
    interface IResponse {
        authToken: string;
    }
    interface IGetApplicationRequest extends IRequest {
        password?: string;
    }
    interface IGetQueryRequest extends IRequest {
        id: string;
    }
    interface IGetQueryResponse extends IResponse {
        query: IQuery;
    }
    interface IGetPersistentObjectRequest extends IRequest {
        persistentObjectTypeId: string;
        objectId?: string;
        isNew?: boolean;
        parent?: IPersistentObject;
    }
    interface IGetPersistentObjectResponse extends IResponse {
        persistentObject: IPersistentObject;
    }
    type ExecuteActionParameters = {
        [key: string]: string;
    };
    interface IExecuteActionRequest extends IRequest {
        action: string;
        parameters: ExecuteActionParameters;
    }
    interface IExecuteQueryActionRequest extends IExecuteActionRequest {
        query: IQuery;
        selectedItems: IQueryResultItem[];
    }
    interface IExecutePersistentObjectActionRequest extends IExecuteActionRequest {
        parent: IPersistentObject;
    }
    interface IExecuteActionResponse extends IResponse {
        result: IPersistentObject;
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
        actions?: string[];
        attributes?: IPersistentObjectAttribute[];
        breadcrumb?: string;
        isBreadcrumbSensitive?: boolean;
        fullTypeName: string;
        id: string;
        objectId: string;
        isSystem: boolean;
        isNew?: boolean;
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
    type Store = "Requests" | "Queries" | "PersistentObjects" | "ActionClassesById";
    type RequestMapKey = "GetQuery" | "GetPersistentObject";
    class IndexedDB {
        private _store?;
        private _initializing;
        private _db;
        constructor(_store?: Store);
        readonly db: IDBDatabase;
        save(entry: any, store?: Store): Promise<void>;
        load(key: any, store?: Store): Promise<any>;
    }
}
declare namespace Vidyano {
    class ServiceWorkerActions {
        private static _types;
        static get<T>(name: string, db: IndexedDB): Promise<ServiceWorkerActions>;
        private _db;
        readonly db: IndexedDB;
        private _isPersistentObject;
        private _isQuery;
        onCache<T extends IPersistentObject | IQuery>(persistentObjectOrQuery: T): Promise<void>;
        onCachePersistentObject(persistentObject: IPersistentObject): Promise<void>;
        onCacheQuery(query: IQuery): Promise<void>;
        onGetQuery(id: string): Promise<IQuery>;
        onExecuteQueryAction(action: string, query: IQuery, selectedItems: IQueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<IPersistentObject>;
        onExecutePersistentObjectAction(action: string, persistentObject: IPersistentObject, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject>;
        fetch(payload: any, fetcher: Fetcher<Service.IRequest, any>): Promise<any>;
    }
}
declare namespace Vidyano {
    type Fetcher<TPayload, TResult> = (payload?: TPayload) => Promise<TResult>;
    type IClientData = Service.IClientData;
    type IGetApplicationRequest = Service.IGetApplicationRequest;
    type IApplication = Service.IApplication;
    type IGetQueryRequest = Service.IGetQueryRequest;
    type IGetQueryResponse = Service.IGetQueryResponse;
    type IQuery = Service.IQuery;
    type IQueryResultItem = Service.IQueryResultItem;
    type IGetPersistentObjectRequest = Service.IGetPersistentObjectRequest;
    type IGetPersistentObjectResponse = Service.IGetPersistentObjectResponse;
    type IPersistentObject = Service.IPersistentObject;
    type IExecuteActionRequest = Service.IExecuteActionRequest;
    type IExecuteQueryActionRequest = Service.IExecuteQueryActionRequest;
    type IExecutePersistentObjectActionRequest = Service.IExecutePersistentObjectActionRequest;
    type IExecuteActionResponse = Service.IExecuteActionResponse;
    class ServiceWorker {
        private serviceUri?;
        private _verbose?;
        private readonly _db;
        private _authToken;
        private _service;
        constructor(serviceUri?: string, _verbose?: boolean);
        readonly db: IndexedDB;
        private _log;
        private _onInstall;
        private _onActivate;
        private _onFetch;
        private _createFetcher;
        protected onGetClientData(fetch: Fetcher<any, IClientData>): Promise<IClientData>;
        protected onGetApplication(payload: IGetApplicationRequest, fetch: Fetcher<IGetApplicationRequest, IApplication>): Promise<IApplication>;
        protected onGetQuery(payload: IGetQueryRequest, fetch: Fetcher<IGetQueryRequest, IGetQueryResponse>): Promise<IGetQueryResponse>;
        protected onCache(service: IService): Promise<void>;
        protected createRequest(data: any, request: Request): Request;
        protected createResponse(data: any, response?: Response): Response;
    }
    interface IService {
        cachePersistentObject(parent: Service.IPersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<void>;
        cacheQuery(id: string): Promise<void>;
    }
}
declare namespace Vidyano {
    const vidyanoFiles: string[];
}
