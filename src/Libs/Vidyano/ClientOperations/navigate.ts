﻿namespace Vidyano {
    "use strict";

    export namespace ClientOperations {
        export function navigate(hooks: ServiceHooks, path: string, replaceCurrent?: boolean): void {
            hooks.onNavigate(path, replaceCurrent);
        }
    }
}