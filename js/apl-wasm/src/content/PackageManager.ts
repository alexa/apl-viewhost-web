/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { PackageLoader } from './PackageLoader';

export class PackageManager {
    private packageLoader: PackageLoader;
    private cppPackageManager: APL.PackageManager;

    constructor(packageLoader: PackageLoader) {
        this.packageLoader = packageLoader;
        this.cppPackageManager = Module.PackageManager.create((
            importRequest: APL.ImportRequest
        ) => {
            this.importPackage(importRequest);
        });
    }

    public getCppPackageManager(): APL.PackageManager {
        // Return the C++ PackageManager for registration via RootConfig
        return this.cppPackageManager;
    }

    public destroy() {
        this.cppPackageManager.destroy();
    }

    public async importPackage(request: APL.ImportRequest) {
        const loadedPackages = await this.packageLoader.load([request]);

        // We only receive one ImportRequest at a time. Nested package imports are resolved as
        // individual requests by Core. Therefore: we expect one package download at a time.
        if (loadedPackages.length === 1 && Object.keys(loadedPackages[0].json).length > 0) {
            this.cppPackageManager.importPackageSucceeded(
                request.reference().toString(),
                JSON.stringify(loadedPackages[0].json)
            );
        } else {
            this.cppPackageManager.importPackageFailed(request.reference().toString(), '', -1);
        }
    }
}
