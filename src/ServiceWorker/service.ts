// Contains the interfaces that define the service communication objects

namespace Vidyano.Service {
    export type KeyValue<T> = { [key: string]: T; };
    export type KeyValueString = KeyValue<string>;
    export type NotificationType = "" | "OK" | "Notice" | "Warning" | "Error";
    export type SortDirection = "" | "ASC" | "DESC";

    export interface IRequest {
        userName?: string;
        authToken?: string;
        clientVersion?: string;
        environment: "Web" | "Web,ServiceWorker";
        environmentVersion: string;
    }

    export interface IResponse {
        authToken: string;
    }

    export interface IGetApplicationRequest extends IRequest {
        password?: string;
    }

    export interface IGetQueryRequest extends IRequest {
        id: string;
    }

    export interface IGetQueryResponse extends IResponse {
        query: IQuery;
    }

    export interface IGetPersistentObjectRequest extends IRequest {
        persistentObjectTypeId: string;
        objectId?: string;
        isNew?: boolean;
        parent?: IPersistentObject;
    }

    export interface IGetPersistentObjectResponse extends IResponse {
        result: IPersistentObject;
    }

    export type ExecuteActionParameters = { [key: string]: string; }

    export interface IExecuteActionRequest extends IRequest {
        action: string;
        parameters: ExecuteActionParameters;
    }

    export interface IExecuteQueryActionRequest extends IExecuteActionRequest {
        query: IQuery;
        selectedItems: IQueryResultItem[];
    }

    export interface IExecuteQueryFilterActionRequest extends IExecuteActionRequest {
        query: IQuery;
    }

    export interface IExecutePersistentObjectActionRequest extends IExecuteActionRequest {
        parent: IPersistentObject;
    }

    export interface IExecuteActionResponse extends IResponse {
        result: IPersistentObject;
    }

    export interface IExecuteQueryRequest extends IRequest {
        query: IQuery;
    }

    export interface IExecuteQueryResponse extends IResponse {
        result: IQueryResult;
    }

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

    export interface IClientData {
        defaultUser: string;
        exception: string;
        languages: ILanguages;
        providers: { [name: string]: { parameters: IProviderParameters } };
        windowsAuthentication: boolean;
    }

    export interface ILanguages {
        [code: string]: ILanguage;
    }

    export interface ILanguage {
        name: string;
        isDefault: boolean;
        messages: KeyValueString;
    }

    export interface IApplicationResponse extends IResponse {
        application: IPersistentObject;
        userCultureInfo: string;
        userLanguage: string;
        userName: string;
        hasSensitive: boolean;
    }

    export interface IPersistentObject {
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
        securityToken: string;
        stateBehavior?: "OpenInEdit" | "StayInEdit" | "AsDialog";
        tabs: IPersistentObjectTab[];
        type: string;
    }

    export interface IPersistentObjectAttribute {
        name: string;
        type: string;
        label: string;
        value?: string;
        objectId?: string;
        lookup?: IQuery;
        isReadOnly?: boolean;
        isRequired?: boolean;
        isSensitive?: boolean;
        isValueChanged?: boolean;
        rules?: string;
        visibility: string;
    }

    export interface IPersistentObjectTab {
        columnCount: number;
        id: string;
        name: string;
    }

    export interface IQuery {
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

    export interface IQueryColumn {
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

    export interface IQueryResult {
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

    export interface IQueryResultItem {
        id: string;
        values: IQueryResultItemValue[];
        typeHints?: KeyValueString;
    }

    export interface IQueryResultItemValue {
        key: string;
        value: string;
        objectId?: string;
        persistentObjectId?: string;
        typeHints?: KeyValueString;
    }

    export interface IQueryGroupingInfo {
        groupedBy: string;
        groups?: IQueryResultItemGroup[];
    }

    export interface IQueryResultItemGroup {
        name: string;
        count: number;
    }

    export interface IQueryChart {
        label: string;
        name: string;
        type: string;
        options: any;
    }

    export interface IRetryAction {
        title: string;
        message: string;
        options: string[];
        defaultOption?: number;
        cancelOption?: number;
        persistentObject?: IPersistentObject;
    }

    export interface IProfilerRequest {
        when: Date;
        profiler: IProfiler;
        transport: number;
        method: string;
        request: any;
        response: any;
    }

    export interface IProfiler {
        taskId: number;
        elapsedMilliseconds: number;
        entries: IProfilerEntry[];
        sql: IProfilerSQL[];
        exceptions: {
            id: string;
            message: string;
        }[];
    }

    export interface IProfilerEntry {
        entries: IProfilerEntry[];
        methodName: string;
        sql: string[];
        started: number;
        elapsedMilliseconds: number;
        hasNPlusOne?: boolean;
        exception: string;
        arguments: any[];
    }

    export interface IProfilerSQL {
        commandId: string;
        commandText: string;
        elapsedMilliseconds: number;
        recordsAffected: number;
        taskId: number;
        type: string;
        parameters: IProfilerSQLParameter[];
    }

    export interface IProfilerSQLParameter {
        name: string;
        type: string;
        value: string;
    }

    export interface IProfilerRequest {
        when: Date;
        profiler: IProfiler;
        transport: number;
        method: string;
        request: any;
        response: any;
    }

    export interface IProfiler {
        taskId: number;
        elapsedMilliseconds: number;
        entries: IProfilerEntry[];
        sql: IProfilerSQL[];
        exceptions: {
            id: string;
            message: string;
        }[];
    }

    export interface IProfilerEntry {
        entries: IProfilerEntry[];
        methodName: string;
        sql: string[];
        started: number;
        elapsedMilliseconds: number;
        hasNPlusOne?: boolean;
        exception: string;
        arguments: any[];
    }

    export interface IProfilerSQL {
        commandId: string;
        commandText: string;
        elapsedMilliseconds: number;
        recordsAffected: number;
        taskId: number;
        type: string;
        parameters: IProfilerSQLParameter[];
    }

    export interface IProfilerSQLParameter {
        name: string;
        type: string;
        value: string;
    }
}