namespace Vidyano.WebComponents {
    export class AppServiceHooks extends Vidyano.WebComponents.AppServiceHooksBase {
        constructor(public app: App) {
            super(app);
        }

        async onAction(args: ExecuteActionArgs): Promise<Vidyano.PersistentObject> {
            if (args.action === "ShowHelp") {
                // Only pass selected tab for actions on persistent objects
                if (!args.query) {
                    let cacheEntry = new PersistentObjectAppCacheEntry(args.persistentObject);
                    cacheEntry = <PersistentObjectAppCacheEntry>this.app.cacheEntries.find(ce => ce.isMatch(cacheEntry));

                    if (cacheEntry && cacheEntry.selectedMasterTab) {
                        if (!args.parameters)
                            args.parameters = {};

                        args.parameters["selectedMasterTab"] = cacheEntry.selectedMasterTab.name;
                    } else if (args.parameters && args.parameters["selectedMasterTab"])
                        args.parameters["selectedMasterTab"] = undefined;
                }

                return super.onAction(args);
            }
            else if (args.action === "viAudit")
                this.app.importComponent("Audit");

            return super.onAction(args);
        }

        async onOpen(obj: ServiceObject, replaceCurrent: boolean = false, fromAction: boolean = false) {
            if (obj instanceof Vidyano.PersistentObject) {
                const po = <Vidyano.PersistentObject>obj;

                if (po.stateBehavior.indexOf("AsWizard") >= 0) {
                    await this.app.importComponent("PersistentObjectWizardDialog");
                    await this.app.showDialog(new Vidyano.WebComponents.PersistentObjectWizardDialog(po));

                    return;
                }
                else if (po.stateBehavior.indexOf("OpenAsDialog") >= 0) {
                    await this.app.importComponent("PersistentObjectDialog");
                    await this.app.showDialog(new Vidyano.WebComponents.PersistentObjectDialog(po));

                    return;
                }
                else if (!(this.app instanceof App))
                    return;

                let path: string;
                if (!fromAction) {
                    path = this.app.getUrlForPersistentObject(po.id, po.objectId);

                    const cacheEntry = new PersistentObjectAppCacheEntry(po);
                    const existing = this.app.cachePing(cacheEntry);
                    if (existing)
                        this.app.cacheRemove(existing);

                    this.app.cache(cacheEntry);
                }
                else {
                    const fromActionId = Unique.get();
                    path = this.app.getUrlForFromAction(fromActionId);

                    if (!po.isNew && po.objectId) {
                        const existingPoCacheEntry = this.app.cachePing(new PersistentObjectAppCacheEntry(po));
                        if (existingPoCacheEntry)
                            this.app.cacheRemove(existingPoCacheEntry);
                    }
                    else if (po.isBulkEdit) {
                        po.bulkObjectIds.forEach(poId => {
                            const existingPoCacheEntry = this.app.cachePing(new PersistentObjectAppCacheEntry(po.id, poId));
                            if (existingPoCacheEntry)
                                this.app.cacheRemove(existingPoCacheEntry);
                        });
                    }

                    this.app.cache(new PersistentObjectFromActionAppCacheEntry(po, fromActionId, this.app.path));
                }

                this.app.changePath(path, replaceCurrent);
            }
        }

        onClose(parent: Vidyano.ServiceObject) {
            if (parent instanceof Vidyano.PersistentObject) {
                const cacheEntry = <PersistentObjectFromActionAppCacheEntry>this.app.cachePing(new PersistentObjectFromActionAppCacheEntry(parent));
                if (cacheEntry instanceof PersistentObjectFromActionAppCacheEntry && cacheEntry.fromActionIdReturnPath) {
                    if (AppBase.removeRootPath(this.app.getUrlForFromAction(cacheEntry.fromActionId)) === AppBase.removeRootPath(this.app.path)) {
                        if (this.app.noHistory)
                            this.app.changePath(cacheEntry.fromActionIdReturnPath, true);
                        else
                            history.back();
                    }
                }
            }
        }

        onClientOperation(operation: ClientOperations.IClientOperation) {
            switch (operation.type) {
                case "Refresh":
                    const refresh = <ClientOperations.IRefreshOperation>operation;
                    if (refresh.queryId) {
                        const cacheEntry = <QueryAppCacheEntry>this.app.cachePing(new QueryAppCacheEntry(refresh.queryId));
                        if (cacheEntry && cacheEntry.query)
                            cacheEntry.query.search({ delay: refresh.delay });

                        const poCacheEntriesWithQueries = <PersistentObjectAppCacheEntry[]>this.app.cacheEntries.filter(e => e instanceof PersistentObjectAppCacheEntry && !!e.persistentObject && e.persistentObject.queries.length > 0);
                        poCacheEntriesWithQueries.forEach(poEntry => poEntry.persistentObject.queries.filter(q => q.id === refresh.queryId).forEach(q => q.search({ delay: refresh.delay })));
                    }
                    else {
                        const refreshPersistentObject = async () => {
                            const cacheEntry = <PersistentObjectAppCacheEntry>this.app.cachePing(new PersistentObjectAppCacheEntry(refresh.fullTypeName, refresh.objectId));
                            if (!cacheEntry || !cacheEntry.persistentObject)
                                return;

                            try {
                                const po = await this.app.service.getPersistentObject(cacheEntry.persistentObject.parent, cacheEntry.persistentObject.id, cacheEntry.persistentObject.objectId);
                                cacheEntry.persistentObject.refreshFromResult(po, true);
                            }
                            catch (e) {
                                cacheEntry.persistentObject.setNotification(e);
                            }
                        };

                        if (refresh.delay)
                            setTimeout(refreshPersistentObject, refresh.delay);
                        else
                            refreshPersistentObject();
                    }

                    break;

                default:
                    super.onClientOperation(operation);
                    break;
            }
        }

        async onQueryFileDrop(query: Vidyano.Query, name: string, contents: string): Promise<boolean> {
            const config = this.app.configuration.getQueryConfig(query);
            const fileDropAction = <Vidyano.Action>query.actions[config.fileDropAction];

            const po = await fileDropAction.execute({ skipOpen: true });
            return query.queueWork(async () => {
                const fileDropAttribute = po.getAttribute(config.fileDropAttribute);
                if (!fileDropAttribute)
                    return false;

                try {
                    await fileDropAttribute.setValue(`${name}|${contents}`);
                    return await po.save();
                }
                catch (e) {
                    query.setNotification(e);
                    return false;
                }
            }, true);
        }
    }
}