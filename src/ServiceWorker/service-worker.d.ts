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
        static isBooleanType(type: string): boolean;
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
    type Request = {
        userName?: string;
        authToken?: string;
        clientVersion?: string;
        environment: "Web" | "Web,ServiceWorker";
        environmentVersion: string;
    };
    type Response = {
        authToken: string;
    };
    type GetApplicationRequest = {
        password?: string;
    } & Request;
    type GetQueryRequest = {
        id: string;
    } & Request;
    type GetQueryResponse = {
        query: Query;
    } & Response;
    type GetPersistentObjectRequest = {
        persistentObjectTypeId: string;
        objectId?: string;
        isNew?: boolean;
        parent?: PersistentObject;
    } & Request;
    type GetPersistentObjectResponse = {
        result: PersistentObject;
    } & Response;
    type ExecuteActionParameters = {
        [key: string]: string;
    };
    type ExecuteActionRequest = {
        action: string;
        parameters: ExecuteActionParameters;
    } & Request;
    type ExecuteActionRefreshParameters = {
        RefreshedPersistentObjectAttributeId: string;
    } & ExecuteActionParameters;
    type ExecuteQueryActionRequest = {
        query: Query;
        selectedItems: QueryResultItem[];
    } & ExecuteActionRequest;
    type ExecuteQueryFilterActionRequest = {
        query: Query;
    } & ExecuteActionRequest;
    type ExecutePersistentObjectActionRequest = {
        parent: PersistentObject;
    } & ExecuteActionRequest;
    type ExecuteActionResponse = {
        result: PersistentObject;
    } & Response;
    type ExecuteQueryRequest = {
        query: Query;
    } & Request;
    type ExecuteQueryResponse = {
        result: QueryResult;
    } & Response;
    type ProviderParameters = {
        label: string;
        description: string;
        requestUri: string;
        signOutUri: string;
        redirectUri: string;
        registerPersistentObjectId?: string;
        registerUser?: string;
        forgotPassword?: boolean;
        getCredentialType?: boolean;
    };
    type ClientData = {
        defaultUser: string;
        exception: string;
        languages: Languages;
        providers: {
            [name: string]: {
                parameters: ProviderParameters;
            };
        };
        windowsAuthentication: boolean;
    };
    type Languages = {
        [culture: string]: Language;
    };
    type Language = {
        name: string;
        isDefault: boolean;
        messages: KeyValueString;
    };
    type ApplicationResponse = {
        application: PersistentObject;
        userCultureInfo: string;
        userLanguage: string;
        userName: string;
        hasSensitive: boolean;
    } & Response;
    type PersistentObject = {
        actions: string[];
        attributes: PersistentObjectAttribute[];
        breadcrumb?: string;
        dialogSaveAction: string;
        fullTypeName: string;
        id: string;
        isBreadcrumbSensitive: boolean;
        isNew?: boolean;
        isSystem: boolean;
        label: string;
        newOptions: string;
        notification: string;
        notificationType: NotificationType;
        notificationDuration: number;
        objectId: string;
        queries: Query[];
        queryLayoutMode: string;
        securityToken: never;
        stateBehavior: "OpenInEdit" | "StayInEdit" | "AsDialog";
        tabs: PersistentObjectTab[];
        type: string;
    };
    type PersistentObjectAttribute = {
        name: string;
        type: string;
        group: string;
        tab: string;
        label: string;
        value: string;
        isReadOnly?: boolean;
        isRequired?: boolean;
        isSensitive?: boolean;
        isValueChanged?: boolean;
        offset: number;
        rules?: string;
        visibility: string;
    };
    type PersistentObjectAttributeWithReference = {
        displayAttribute: string;
        lookup: Query;
        objectId: string;
    } & PersistentObjectAttribute;
    type PersistentObjectTab = {
        columnCount: number;
        id: string;
        name: string;
    };
    type Query = {
        actionLabels?: KeyValueString;
        actions: string[];
        allowTextSearch: boolean;
        autoQuery: boolean;
        canRead: boolean;
        columns: QueryColumn[];
        disableBulkEdit: boolean;
        enableSelectAll: boolean;
        filters: PersistentObject;
        groupedBy: string;
        id: string;
        label: string;
        name: string;
        notification: string;
        notificationType: NotificationType;
        notificationDuration: number;
        pageSize: number;
        persistentObject: PersistentObject;
        result: QueryResult;
        sortOptions: string;
        textSearch: string;
    };
    type QueryColumn = {
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
    };
    type QueryResult = {
        charts: QueryChart[];
        columns: QueryColumn[];
        continuation?: string;
        groupedBy?: string;
        groupingInfo?: QueryGroupingInfo;
        items: QueryResultItem[];
        notification?: string;
        notificationDuration?: number;
        notificationType?: NotificationType;
        pageSize?: number;
        sortOptions: string;
        totalItem?: QueryResultItem;
        totalItems?: number;
    };
    type QueryResultItem = {
        id: string;
        values: QueryResultItemValue[];
        typeHints?: KeyValueString;
    };
    type QueryResultItemValue = {
        key: string;
        value: string;
        objectId?: string;
        persistentObjectId?: string;
        typeHints?: KeyValueString;
    };
    type QueryGroupingInfo = {
        groupedBy: string;
        groups?: QueryResultItemGroup[];
    };
    type QueryResultItemGroup = {
        name: string;
        count: number;
    };
    type QueryChart = {
        label: string;
        name: string;
        type: string;
        options: any;
    };
    type RetryAction = {
        cancelOption?: number;
        defaultOption?: number;
        message: string;
        options: string[];
        persistentObject?: PersistentObject;
        title: string;
    };
    type ProfilerRequest = {
        method: string;
        profiler: Profiler;
        request: any;
        response: any;
        transport: number;
        when: Date;
    };
    type Profiler = {
        elapsedMilliseconds: number;
        entries: ProfilerEntry[];
        exceptions: {
            id: string;
            message: string;
        }[];
        sql: ProfilerSql[];
        taskId: number;
    };
    type ProfilerEntry = {
        arguments: any[];
        elapsedMilliseconds: number;
        entries: ProfilerEntry[];
        exception: string;
        hasNPlusOne?: boolean;
        methodName: string;
        sql: string[];
        started: number;
    };
    type ProfilerSql = {
        commandId: string;
        commandText: string;
        elapsedMilliseconds: number;
        parameters: ProfilerSqlParameter[];
        recordsAffected: number;
        taskId: number;
        type: string;
    };
    type ProfilerSqlParameter = {
        name: string;
        type: string;
        value: string;
    };
}
declare namespace Vidyano {
    type Store = "Requests" | "Queries" | "QueryResults" | "PersistentObjects" | "ActionClassesById";
    type RequestMapKey = "GetQuery" | "GetPersistentObject";
    type StoreGetClientDataRequest = {
        id: "GetClientData";
        response: Service.ClientData;
    };
    type StoreGetApplicationRequest = {
        id: "GetApplication";
        response: Service.ApplicationResponse;
    };
    type StoreQuery = {
        id: string;
        query: Service.Query;
        newPersistentObject: Service.PersistentObject;
    };
    type StoreQueryResult = {
        id: string;
        result: Service.QueryResult;
        deleted: Service.QueryResultItem[];
    };
    type StorePersistentObject = {
        id: string;
        query?: string;
        persistentObject: Service.PersistentObject;
    };
    type StoreActionClassById = {
        id: string;
        name: string;
    };
    type StoreNameMap = {
        "Requests": StoreGetClientDataRequest | StoreGetApplicationRequest;
        "Queries": StoreQuery;
        "QueryResults": StoreQueryResult;
        "PersistentObjects": StorePersistentObject;
        "ActionClassesById": StoreActionClassById;
    };
    type RequestsStoreNameMap = {
        "GetClientData": StoreGetClientDataRequest;
        "GetApplication": StoreGetApplicationRequest;
    };
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
    class ServiceWorker {
        private serviceUri?;
        private _verbose?;
        private readonly _db;
        private _cacheName;
        private _clientData;
        private _application;
        constructor(serviceUri?: string, _verbose?: boolean);
        readonly db: IndexedDB;
        readonly clientData: Service.ClientData;
        readonly application: Application;
        private authToken;
        private _log;
        private _onInstall;
        private _onActivate;
        private _onFetch;
        private _createFetcher;
        private _getOffline;
        protected onGetClientData(): Promise<Service.ClientData>;
        protected onCacheClientData(clientData: Service.ClientData): Promise<void>;
        protected onCacheApplication(application: Service.ApplicationResponse): Promise<void>;
        protected onGetApplication(): Promise<Service.ApplicationResponse>;
        protected createRequest(data: any, request: Request): Request;
        protected createResponse(data: any, response?: Response): Response;
    }
}
declare namespace Vidyano {
    class ServiceWorkerActions {
        private static _types;
        static get<T>(name: string, serviceWorker: ServiceWorker): Promise<ServiceWorkerActions>;
        private _serviceWorker;
        readonly db: IndexedDB;
        protected readonly serviceWorker: ServiceWorker;
        private _isPersistentObject;
        private _isQuery;
        getOwnerQuery(objOrId: Service.PersistentObject | string): Promise<Service.Query>;
        onGetPersistentObject(parent: Service.PersistentObject, id: string, objectId?: string, isNew?: boolean): Promise<Service.PersistentObject>;
        onGetQuery(id: string): Promise<Query>;
        onExecuteQuery(query: Query): Promise<QueryResult>;
        protected onTextSearch(textSearch: string, result: QueryResult): QueryResultItem[];
        onSortQueryResult(result: QueryResult): QueryResultItem[];
        onDataTypeCompare(value1: any, value2?: any, datatype?: string): number;
        protected onFilter(query: Service.Query): QueryResultItem[];
        onExecuteQueryAction(action: string, query: Query, selectedItems: QueryResultItem[], parameters: Service.ExecuteActionParameters): Promise<PersistentObject>;
        onExecutePersistentObjectAction(action: string, persistentObject: PersistentObject, parameters: Service.ExecuteActionParameters): Promise<PersistentObject>;
        onNew(query: Query): Promise<PersistentObject>;
        onRefresh(persistentObject: PersistentObject, parameters: Service.ExecuteActionRefreshParameters): Promise<PersistentObject>;
        onDelete(query: Query, selectedItems: QueryResultItem[]): Promise<void>;
        onSave(obj: PersistentObject): Promise<PersistentObject>;
        saveNew(obj: PersistentObject): Promise<PersistentObject>;
        saveExisting(obj: PersistentObject): Promise<PersistentObject>;
        editQueryResultItemValues(query: Service.Query, persistentObject: Service.PersistentObject, changeType: ItemChangeType): Promise<void>;
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
    class Application {
        private _serviceWorker;
        private _application;
        readonly userLanguage: string;
        readonly userName: string;
        readonly hasSensitive: boolean;
        constructor(_serviceWorker: ServiceWorker, response: Service.ApplicationResponse);
        getTranslatedMessage(key: string, ...params: string[]): string;
    }
}
declare namespace Vidyano {
    namespace Wrappers {
        type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
        type Overwrite<T, U> = Omit<T, Extract<keyof T, keyof U>> & U;
        type Wrap<ServiceType, Writable extends keyof ServiceType, WrapperType> = Overwrite<Readonly<Omit<ServiceType, Writable>> & Pick<ServiceType, Writable>, WrapperType> & WrapperType;
        type WrapperTypes = PersistentObjectAttributeWrapper | PersistentObjectAttributeWrapper | PersistentObjectAttributeWithReferenceWrapper | QueryWrapper | QueryColumnWrapper | QueryResultWrapper | QueryResultItemWrapper | QueryResultItemValueWrapper;
        abstract class Wrapper<T> {
            private __wrappedProperties__;
            protected _unwrap(...children: string[]): T;
            static _wrap<T>(wrapper: Function, object: any): T;
            static _wrap<T>(wrapper: Function, objects: any[]): T[];
            static _unwrap<T extends Wrapper<U>, U>(obj: T): U;
        }
    }
}
declare namespace Vidyano {
    type PersistentObjectAttribute = Wrappers.Wrap<Service.PersistentObjectAttribute, "label" | "group" | "offset" | "tab" | "visibility", Wrappers.PersistentObjectAttributeWrapper>;
    type ReadOnlyPersistentObjectAttribute = Readonly<PersistentObjectAttribute>;
    type PersistentObjectAttributeWithReference = Wrappers.Wrap<Service.PersistentObjectAttributeWithReference, "label" | "group" | "offset" | "tab" | "visibility", Wrappers.PersistentObjectAttributeWithReferenceWrapper>;
    type ReadOnlyPersistentObjectAttributeWithReference = Readonly<PersistentObjectAttributeWithReference>;
    namespace Wrappers {
        class PersistentObjectAttributeWrapper extends Wrapper<Service.PersistentObjectAttribute> {
            private _attr;
            private _value;
            protected constructor(_attr: Service.PersistentObjectAttribute);
            readonly isValueChanged: boolean;
            protected _isValueChanged: boolean;
            value: any;
            protected _unwrap(): Service.PersistentObjectAttribute;
        }
        class PersistentObjectAttributeWithReferenceWrapper extends PersistentObjectAttributeWrapper {
            private _attrWithReference;
            private constructor();
            objectId: string;
            protected _unwrap(): Service.PersistentObjectAttributeWithReference;
        }
    }
}
declare namespace Vidyano {
    type PersistentObject = Wrappers.Wrap<Service.PersistentObject, "breadcrumb" | "label" | "notification" | "notificationType" | "notificationDuration", Wrappers.PersistentObjectWrapper>;
    type ReadOnlyPersistentObject = Readonly<PersistentObject>;
    namespace Wrappers {
        class PersistentObjectWrapper extends Wrapper<Service.PersistentObject> {
            private _obj;
            private _parent?;
            private readonly _attributes;
            private readonly _queries;
            private constructor();
            readonly queries: ReadOnlyQuery[];
            getQuery(name: string): ReadOnlyQuery;
            readonly attributes: PersistentObjectAttribute[];
            protected _unwrap(): Service.PersistentObject;
        }
    }
}
declare namespace Vidyano {
    type QueryColumn = Wrappers.Wrap<Service.QueryColumn, "canSort" | "label" | "offset", Wrappers.QueryColumnWrapper>;
    type ReadOnlyQueryColumn = Readonly<QueryColumn>;
    namespace Wrappers {
        class QueryColumnWrapper extends Wrapper<Service.QueryColumn> {
            private _column;
            private constructor();
            protected _unwrap(): Service.QueryColumn;
        }
    }
}
declare namespace Vidyano {
    type QueryResultItemValue = Readonly<Service.QueryResultItemValue> & Wrappers.QueryResultItemValueWrapper;
    namespace Wrappers {
        class QueryResultItemValueWrapper extends Wrapper<Service.QueryResultItemValue> {
            private _value;
            private constructor();
            protected _unwrap(): Service.QueryResultItemValue;
        }
    }
}
declare namespace Vidyano {
    type QueryResultItem = Wrappers.Wrap<Service.QueryResultItem, never, Wrappers.QueryResultItemWrapper>;
    type ReadOnlyQueryResultItem = Readonly<QueryResultItem>;
    namespace Wrappers {
        class QueryResultItemWrapper extends Wrapper<Service.QueryResultItem> {
            private _item;
            private readonly _values;
            private constructor();
            readonly values: QueryResultItemValue[];
            getValue(key: string): QueryResultItemValue;
            protected _unwrap(): Service.QueryResultItem;
        }
    }
}
declare namespace Vidyano {
    type QueryResult = Wrappers.Wrap<Service.QueryResult, "notification" | "notificationType" | "notificationDuration" | "sortOptions", Wrappers.QueryResultWrapper>;
    type ReadOnlyQueryResult = Readonly<QueryResult>;
    namespace Wrappers {
        class QueryResultWrapper extends Wrapper<Service.QueryResult> {
            private _result;
            private readonly _columns;
            private _items;
            private constructor();
            readonly columns: QueryColumn[];
            getColumn(name: string): QueryColumn;
            readonly items: QueryResultItem[];
            getItem(id: string): QueryResultItem;
            private _update;
            protected _unwrap(): Service.QueryResult;
        }
    }
}
declare namespace Vidyano {
    type Query = Wrappers.Wrap<Service.Query, "actionLabels" | "allowTextSearch" | "label" | "enableSelectAll" | "notification" | "notificationType" | "notificationDuration" | "sortOptions" | "textSearch", Wrappers.QueryWrapper>;
    type ReadOnlyQuery = Readonly<Query>;
    namespace Wrappers {
        class QueryWrapper extends Wrapper<Service.Query> {
            private _query;
            private readonly _columns;
            private readonly _persistentObject;
            private readonly _result;
            private constructor();
            readonly columns: QueryColumn[];
            readonly persistentObject: ReadOnlyPersistentObject;
            readonly result: QueryResult;
            protected _unwrap(): Service.Query;
        }
    }
}
