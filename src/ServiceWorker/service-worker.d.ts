declare namespace Vidyano {
    class CultureInfo {
        name: string;
        numberFormat: ICultureInfoNumberFormat;
        dateFormat: ICultureInfoDateFormat;
        static currentCulture: CultureInfo;
        static invariantCulture: CultureInfo;
        static cultures: {
            [key: string]: CultureInfo;
        };
        constructor(name: string, numberFormat: ICultureInfoNumberFormat, dateFormat: ICultureInfoDateFormat);
    }
    interface ICultureInfoNumberFormat {
        naNSymbol: string;
        negativeSign: string;
        positiveSign: string;
        negativeInfinityText: string;
        positiveInfinityText: string;
        percentSymbol: string;
        percentGroupSizes: Array<number>;
        percentDecimalDigits: number;
        percentDecimalSeparator: string;
        percentGroupSeparator: string;
        percentPositivePattern: string;
        percentNegativePattern: string;
        currencySymbol: string;
        currencyGroupSizes: Array<number>;
        currencyDecimalDigits: number;
        currencyDecimalSeparator: string;
        currencyGroupSeparator: string;
        currencyNegativePattern: string;
        currencyPositivePattern: string;
        numberGroupSizes: Array<number>;
        numberDecimalDigits: number;
        numberDecimalSeparator: string;
        numberGroupSeparator: string;
    }
    interface ICultureInfoDateFormat {
        amDesignator: string;
        pmDesignator: string;
        dateSeparator: string;
        timeSeparator: string;
        gmtDateTimePattern: string;
        universalDateTimePattern: string;
        sortableDateTimePattern: string;
        dateTimePattern: string;
        longDatePattern: string;
        shortDatePattern: string;
        longTimePattern: string;
        shortTimePattern: string;
        yearMonthPattern: string;
        firstDayOfWeek: number;
        dayNames: Array<string>;
        shortDayNames: Array<string>;
        minimizedDayNames: Array<string>;
        monthNames: Array<string>;
        shortMonthNames: Array<string>;
    }
}
declare namespace Vidyano {
    abstract class DataType {
        static isDateTimeType(type: string): boolean;
        static isNumericType(type: string): boolean;
        private static _getDate;
        private static _getServiceTimeString;
        static fromServiceString(value: string, type: string): any;
        static toServiceString(value: any, type: string): string;
    }
}
declare namespace Vidyano.Service {
    type KeyValue<T> = {
        [key: string]: T;
    };
    type KeyValueString = KeyValue<string>;
    type NotificationType = "" | "OK" | "Notice" | "Warning" | "Error";
    type SortDirection = "" | "ASC" | "DESC";
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
        result: IPersistentObject;
    }
    type ExecuteActionParameters = {
        [key: string]: string;
    };
    interface IExecuteActionRequest extends IRequest {
        action: string;
        parameters: ExecuteActionParameters;
    }
    interface IExecuteActionRefreshParameters extends ExecuteActionParameters {
        RefreshedPersistentObjectAttributeId: string;
    }
    interface IExecuteQueryActionRequest extends IExecuteActionRequest {
        query: IQuery;
        selectedItems: IQueryResultItem[];
    }
    interface IExecuteQueryFilterActionRequest extends IExecuteActionRequest {
        query: IQuery;
    }
    interface IExecutePersistentObjectActionRequest extends IExecuteActionRequest {
        parent: IPersistentObject;
    }
    interface IExecuteActionResponse extends IResponse {
        result: IPersistentObject;
    }
    interface IExecuteQueryRequest extends IRequest {
        query: IQuery;
    }
    interface IExecuteQueryResponse extends IResponse {
        result: IQueryResult;
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
        languages: ILanguages;
        providers: {
            [name: string]: {
                parameters: IProviderParameters;
            };
        };
        windowsAuthentication: boolean;
    }
    interface ILanguages {
        [culture: string]: ILanguage;
    }
    interface ILanguage {
        name: string;
        isDefault: boolean;
        messages: KeyValueString;
    }
    interface IApplicationResponse extends IResponse {
        application: IPersistentObject;
        userCultureInfo: string;
        userLanguage: string;
        userName: string;
        hasSensitive: boolean;
    }
    interface IPersistentObject {
        actions?: string[];
        attributes?: IPersistentObjectAttribute[];
        breadcrumb?: string;
        newBreadcrumb?: string;
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
        securityToken: never;
        stateBehavior?: "OpenInEdit" | "StayInEdit" | "AsDialog";
        dialogSaveAction?: string;
        tabs: IPersistentObjectTab[];
        type: string;
    }
    interface IPersistentObjectAttribute {
        name: string;
        type: string;
        group: string;
        tab: string;
        label: string;
        value?: string;
        isReadOnly?: boolean;
        isRequired?: boolean;
        isSensitive?: boolean;
        isValueChanged?: boolean;
        offset: number;
        rules?: string;
        visibility: string;
    }
    interface IPersistentObjectAttributeWithReference extends IPersistentObjectAttribute {
        displayAttribute: string;
        objectId: string;
        lookup: IQuery;
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
        textSearch: string;
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
        pageSize?: number;
        totalItems?: number;
        columns: IQueryColumn[];
        items: IQueryResultItem[];
        groupingInfo?: IQueryGroupingInfo;
        groupedBy?: string;
        notification?: string;
        notificationType?: NotificationType;
        notificationDuration?: number;
        sortOptions: string;
        charts: IQueryChart[];
        totalItem?: IQueryResultItem;
        continuation?: string;
        textSearch?: string;
    }
    interface IQueryResultItem {
        id: string;
        values: IQueryResultItemValue[];
        typeHints?: KeyValueString;
    }
    interface IQueryResultItemValue {
        key: string;
        value: string;
        objectId?: string;
        persistentObjectId?: string;
        typeHints?: KeyValueString;
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
    interface IStoreGetClientDataRequest {
        id: "GetClientData";
        response: IClientData;
    }
    interface IStoreGetApplicationRequest {
        id: "GetApplication";
        response: IApplicationResponse;
    }
    interface IStoreQuery {
        id: string;
        query: IQuery;
    }
    interface IStorePersistentObject {
        id: string;
        query?: string;
        persistentObject: IPersistentObject;
    }
    interface IStoreActionClassById {
        id: string;
        name: string;
    }
    interface StoreNameMap {
        "Requests": IStoreGetClientDataRequest | IStoreGetApplicationRequest;
        "Queries": IStoreQuery;
        "PersistentObjects": IStorePersistentObject;
        "ActionClassesById": IStoreActionClassById;
    }
    interface RequestsStoreNameMap {
        "GetClientData": IStoreGetClientDataRequest;
        "GetApplication": IStoreGetApplicationRequest;
    }
    class IndexedDB {
        private _initializing;
        private _db;
        constructor();
        readonly db: IDBDatabase;
        save<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(entry: RequestsStoreNameMap[I], store: "Requests"): Promise<void>;
        save<K extends keyof StoreNameMap>(entry: StoreNameMap[K], store: K): Promise<void>;
        load<K extends keyof StoreNameMap, I extends keyof RequestsStoreNameMap>(key: I, store: "Requests"): Promise<RequestsStoreNameMap[I]>;
        load<K extends keyof StoreNameMap>(key: string, store: K): Promise<StoreNameMap[K]>;
    }
}
declare namespace Vidyano {
    let version: string;
    type Fetcher<TPayload, TResult> = (payload?: TPayload) => Promise<TResult>;
    type IClientData = Service.IClientData;
    type IGetApplicationRequest = Service.IGetApplicationRequest;
    type IApplicationResponse = Service.IApplicationResponse;
    type IGetQueryRequest = Service.IGetQueryRequest;
    type IGetQueryResponse = Service.IGetQueryResponse;
    type IQuery = Service.IQuery;
    type IQueryColumn = Service.IQueryColumn;
    type IQueryResultItem = Service.IQueryResultItem;
    type IQueryResultItemValue = Service.IQueryResultItemValue;
    type IGetPersistentObjectRequest = Service.IGetPersistentObjectRequest;
    type IGetPersistentObjectResponse = Service.IGetPersistentObjectResponse;
    type IPersistentObject = Service.IPersistentObject;
    type IPersistentObjectAttribute = Service.IPersistentObjectAttribute;
    type IPersistentObjectAttributeWithReference = Service.IPersistentObjectAttributeWithReference;
    type IExecuteActionRequest = Service.IExecuteActionRequest;
    type IExecuteQueryActionRequest = Service.IExecuteQueryActionRequest;
    type IExecuteQueryRequest = Service.IExecuteQueryRequest;
    type IExecuteQueryResponse = Service.IExecuteQueryResponse;
    type IQueryResult = Service.IQueryResult;
    type IExecuteQueryFilterActionRequest = Service.IExecuteQueryFilterActionRequest;
    type IExecutePersistentObjectActionRequest = Service.IExecutePersistentObjectActionRequest;
    type IExecuteActionResponse = Service.IExecuteActionResponse;
    class ServiceWorker {
        private serviceUri;
        private _verbose;
        private readonly _db;
        private _cacheName;
        private _service;
        private _clientData;
        private _application;
        constructor(serviceUri?: string, _verbose?: boolean);
        readonly db: IndexedDB;
        readonly clientData: IClientData;
        readonly application: Application;
        private authToken;
        private _log(message);
        private _onInstall(e);
        private _onActivate(e);
        private _onFetch(e);
        private _createFetcher<TPayload, TResult>(originalRequest);
        protected onGetClientData(): Promise<Service.IClientData>;
        protected onCacheClientData(clientData: Service.IClientData): Promise<void>;
        protected onCacheApplication(application: Service.IApplicationResponse): Promise<void>;
        protected onGetApplication(): Promise<Service.IApplicationResponse>;
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
    class ServiceWorkerActions {
        private static _types;
        static get<T>(name: string, serviceWorker: ServiceWorker): Promise<ServiceWorkerActions>;
        private _serviceWorker;
        readonly db: IndexedDB;
        protected readonly serviceWorker: ServiceWorker;
        private _isPersistentObject(arg);
        private _isQuery(arg);
        onCache<T extends IPersistentObject | IQuery>(persistentObjectOrQuery: T): Promise<void>;
        onCachePersistentObject(persistentObject: IPersistentObject): Promise<void>;
        onCacheQuery(query: IQuery): Promise<void>;
        getOwnerQuery(objOrId: IPersistentObject | string): Promise<IQuery>;
        onGetPersistentObject(parent: IPersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<IPersistentObject>;
        onGetQuery(id: string): Promise<IQuery>;
        onExecuteQuery(query: IQuery): Promise<IQueryResult>;
        onSortQueryResult(result: IQueryResult): IQueryResult;
        onDataTypeCompare(value1: any, value2?: any, datatype?: string): number;
        protected onFilter(query: IQuery): IQueryResultItem[];
        onExecuteQueryFilterAction(action: string, query: IQuery, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject>;
        onExecuteQueryAction(action: string, query: IQuery, selectedItems: IQueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<IPersistentObject>;
        onExecutePersistentObjectAction(action: string, persistentObject: IPersistentObject, parameters: Service.ExecuteActionParameters): Promise<IPersistentObject>;
        onNew(query: IQuery): Promise<IPersistentObject>;
        onRefresh(persistentObject: IPersistentObject, parameters: Service.IExecuteActionRefreshParameters): Promise<IPersistentObject>;
        onDelete(query: IQuery, selectedItems: IQueryResultItem[]): Promise<void>;
        onSave(obj: IPersistentObject): Promise<IPersistentObject>;
        saveNew(obj: IPersistentObject): Promise<IPersistentObject>;
        saveExisting(obj: IPersistentObject): Promise<IPersistentObject>;
        editQueryResultItemValues(query: IQuery, persistentObject: IPersistentObject, changeType: ItemChangeType): Promise<void>;
    }
    type ItemChangeType = "None" | "New" | "Edit" | "Delete";
    interface IItemChange {
        objectId: string;
        key: string;
        value: string;
        referenceObjectId?: string;
        logChange?: boolean;
        type?: ItemChangeType;
    }
}
declare namespace Vidyano {
    const vidyanoFiles: string[];
}
declare namespace Vidyano {
    namespace Helpers {
        type FilteredKeys<T, U> = {
            [P in keyof T]: T[P] extends U ? P : never;
        }[keyof T];
        class ByNameWrapper<T, U extends object> implements ProxyHandler<U> {
            private _objects;
            private _wrapper;
            private _keyProperty;
            private _wrapped;
            private constructor();
            get(target: U, p: PropertyKey, receiver: any): U;
            static create<T, U extends object>(objects: T[], wrapper: Function, deepFreeze?: boolean, keyProperty?: string): Helpers.ByName<U>;
            static create<T, U extends object>(objects: T[], wrapper: (o: T) => U, keyProperty?: string): Helpers.ByName<U>;
        }
        type ByName<T> = {
            [key: string]: T;
            [key: number]: T;
        };
        class Wrapper {
            static _wrap<T>(wrapper: Function, obj: any, deepFreeze?: boolean): T;
            private static _deepFreeze(obj);
        }
    }
}
declare namespace Vidyano {
    class Application {
        private _serviceWorker;
        private _application;
        readonly userLanguage: string;
        readonly userName: string;
        readonly hasSensitive: boolean;
        constructor(_serviceWorker: ServiceWorker, response: Service.IApplicationResponse);
        getTranslatedMessage(key: string, ...params: string[]): string;
    }
}
declare namespace Vidyano {
    type PersistentObjectAttribute = {
        [Q in Helpers.FilteredKeys<IPersistentObjectAttribute, any>]: IPersistentObjectAttribute[Q];
    } & Wrappers.PersistentObjectAttribute;
    type ReadOnlyPersistentObjectAttribute = Readonly<{
        [Q in Helpers.FilteredKeys<IPersistentObjectAttribute, any>]: IPersistentObjectAttribute[Q];
    }> & Wrappers.PersistentObjectAttribute;
    type PersistentObjectAttributeWithReference = {
        [Q in Helpers.FilteredKeys<IPersistentObjectAttributeWithReference, any>]: IPersistentObjectAttributeWithReference[Q];
    } & Wrappers.PersistentObjectAttributeWithReference;
    type ReadOnlyPersistentObjectAttributeWithReference = Readonly<{
        [Q in Helpers.FilteredKeys<IPersistentObjectAttributeWithReference, any>]: IPersistentObjectAttributeWithReference[Q];
    }> & Wrappers.PersistentObjectAttributeWithReference;
    namespace Wrappers {
        class PersistentObjectAttribute {
            private _obj;
            protected constructor(_obj: IPersistentObjectAttribute);
            readonly isReference: boolean;
        }
        class PersistentObjectAttributeWithReference extends Wrappers.PersistentObjectAttribute {
            private constructor();
        }
    }
}
declare namespace Vidyano {
    type PersistentObject = {
        [Q in Helpers.FilteredKeys<IPersistentObject, any>]: IPersistentObject[Q];
    } & Wrappers.PersistentObject;
    type ReadOnlyPersistentObject = Readonly<{
        [Q in Helpers.FilteredKeys<IPersistentObject, any>]: IPersistentObject[Q];
    }> & Wrappers.PersistentObject;
    namespace Wrappers {
        class PersistentObject {
            private _obj;
            private _parent;
            private readonly _attributes;
            private readonly _queries;
            private constructor();
            readonly queries: Helpers.ByName<ReadOnlyQuery>;
            getAttribute(name: string): IPersistentObjectAttribute;
        }
    }
}
declare namespace Vidyano {
    type QueryResultItemValue = Readonly<Service.IQueryResultItemValue> & Wrappers.QueryResultItemValue;
    namespace Wrappers {
        class QueryResultItemValue {
            private _value;
            private constructor();
        }
    }
}
declare namespace Vidyano {
    type QueryResultItem = Readonly<{
        [Q in Helpers.FilteredKeys<IQueryResultItem, string | boolean | number | Service.KeyValueString>]: IQueryResultItem[Q];
    }> & Wrappers.QueryResultItem;
    namespace Wrappers {
        class QueryResultItem {
            private _item;
            private readonly _values;
            private constructor();
            readonly values: Helpers.ByName<QueryResultItemValue>;
        }
    }
}
declare namespace Vidyano {
    type Query = {
        [Q in Helpers.FilteredKeys<IQuery, string | boolean | number>]: IQuery[Q];
    } & Wrappers.Query;
    type ReadOnlyQuery = Readonly<{
        [Q in Helpers.FilteredKeys<IQuery, string | boolean | number>]: IQuery[Q];
    }> & Wrappers.Query;
    namespace Wrappers {
        class Query {
            private _query;
            private readonly _persistentObject;
            private readonly _items;
            private constructor();
            readonly persistentObject: ReadOnlyPersistentObject;
            readonly items: Helpers.ByName<QueryResultItem>;
        }
    }
}
