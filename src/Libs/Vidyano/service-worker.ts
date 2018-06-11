namespace Vidyano {
    export interface IServiceWorkerMonitor {
        readonly available: boolean;
        readonly activation: Promise<void>;
    }

    class ServiceWorkerMonitor implements IServiceWorkerMonitor {
        private _activation: Promise<void>;

        constructor(private _register?: Promise<ServiceWorkerRegistration>) {
            if (this.available) {
                this._activation = new Promise(async resolve => {
                    const reg = await this._register;
                    if (reg.active && reg.active.state === "activated") {
                        resolve();
                        return;
                    }

                    reg.onupdatefound = () => {
                        if (reg.active && reg.active.state === "activated") {
                            resolve();
                            return;
                        }

                        const installer = reg.installing;
                        installer.onstatechange = () => {
                            if (installer.state === "activated")
                                resolve();
                        }
                    };
                });
            }
        }

        get available(): boolean {
            return this._register != null;
        }

        get activation(): Promise<void> {
            return this._activation;
        }
    }

    const monitor = new ServiceWorkerMonitor("serviceWorker" in navigator ? navigator.serviceWorker.register("service-worker.js") : null);

    export class ServiceWorker {
        static get Monitor(): IServiceWorkerMonitor {
            return monitor;
        }
    }
}