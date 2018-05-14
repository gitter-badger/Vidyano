declare namespace Vidyano {
    abstract class ServiceWorker {
        private _verbose;
        private readonly _initializeDB;
        private _db;
        private _rootPath;
        constructor(_verbose?: boolean);
        private _log(message);
        private _onInstall(e);
        private _onActivate(e);
        private _onFetch(e);
    }
}
