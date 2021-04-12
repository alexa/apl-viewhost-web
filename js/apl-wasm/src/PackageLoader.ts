/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { LoggerFactory } from 'apl-html';
import { ILogger } from 'apl-html';

const PREDEFINED_HOST : string = 'https://d2na8397m465mh.cloudfront.net/packages';
const PREDEFINED_FILE_NAME : string = 'document.json';

/**
 *
 * Load packages from a given importReuqests
 *
 * @export
 * @class PackageLoader
 */
export class PackageLoader {
    /// Logger to be used for this component logs.
    private logger : ILogger;

    /**
     * The packages map connects package name to data. It stores:
     *     name -> { json: JSON,
     *               state: load|done,
     *             }
     *
     * @private
     * @type {Map<string, ILoadingProcessData>}
     * @memberOf PackageLoader
     */
    private loadPackages : Map<string, ILoadingProcessData>;

    /**
     * Initialize PackageLoader attributes
     * @memberOf PackageLoader
     */
    constructor() {
        this.logger = LoggerFactory.getLogger('PackageLoader');
        this.loadPackages = new Map<string, ILoadingProcessData>();
    }

    /**
     * Dynamically load packages in the given list
     * @param importPackages Packages that need to be imported
     * @returns ILoadedResult[]
     * @memberOf PackageLoader
     */
    public async load(importRequests : APL.ImportRequest[]) : Promise<ILoadedResult[]> {
        if (importRequests) {
            await this.ensureLoaded(importRequests);
            return this.namesToData(importRequests);
        } else {
            return [];
        }
    }

    /**
     * Flush loaded packages
     */
    public flush() {
        this.loadPackages.clear();
        return;
    }

    /**
     * Walk a list of packages until all of them have been loaded.
     */
    private async ensureLoaded(importRequests : APL.ImportRequest[]) : Promise<any> {
        return new Promise((resolve, reject) => {
            let count = importRequests.length;

            if (count > 0) {
                importRequests.forEach(async (pkg) => {
                    await this.loadPackage(pkg.reference().name(), pkg.reference().version(),
                        pkg.source());
                    count -= 1;
                    if (count === 0) {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /*
     * Execute a package load.
     */
    private async loadPackage(name : string, version : string, url : string) : Promise<any> {
        const key = `${name}/${version}`;
        if (this.loadPackages.get(key)) {
            const data : ILoadingProcessData | undefined = this.loadPackages.get(key);
            if (data && data.state === LoadState.done) {
                return Promise.resolve();
            }
        } else {
            this.loadPackages.set(key, {
                state: LoadState.load,
                json: {}
            });
            const pkg : ILoadingProcessData | undefined = this.loadPackages.get(key);

            if (!url) {
                url = `${PREDEFINED_HOST}/${name}/${version}/${PREDEFINED_FILE_NAME}`;
            }

            if (url) {
                return fetch(url, {mode: 'cors'}).then((response) => {
                    return response.json();
                }).then(async (jsonResponse) => {
                    if (pkg) {
                        pkg.json = this.deepFreeze(jsonResponse);
                        pkg.state = LoadState.done;
                    }
                    return Promise.resolve();
                }).catch((error) => {
                    this.logger.error(error);
                    if (pkg) {
                        pkg.json = {};
                        pkg.state = LoadState.done;
                    }
                    return Promise.resolve();
                });
            }
        }
    }

    /*
     * This is the actual data structure that will be returned by the loader.  In other words,
     * you will receive an array, where each item in the array is of the form:
     *
     * [
     *   { json: JSON, justLoaded: true/false, importRequest: ImportRequest },
     *   ...
     * ]
     */
    private namesToData(importRequests : APL.ImportRequest[]) : ILoadedResult[] {
        return importRequests.map((ir) => {
            const key = `${ir.reference().name()}/${ir.reference().version()}`;
            const pkgdoc : ILoadingProcessData | undefined = this.loadPackages.get(key);
            return {
                json: pkgdoc ? pkgdoc.json : {},
                justLoaded: pkgdoc ? true : false,
                importRequest: ir
            };
        });
    }

    /**
     *   Deep-freeze object to ensure JSON is never modified
     */
    private deepFreeze(obj : object) {
        return JSON.parse(JSON.stringify(obj));
    }
}

/**
 * During loading packages, use ILoadingProcessData to track loading process
 *
 * @export
 * @interface ILoadingProcessData
 */
export interface ILoadingProcessData {
    json : object;
    state : LoadState;
}

/**
 * Loading process contains:
 * - load : start loading this package
 * - done : finish loading this package
 *
 * @export
 * @enum {number}
 */
export enum LoadState {
    load = 'load' as any,
    done = 'done' as any
}

/**
 * The actual data structure that will be returned by the packageLoader.
 *
 * @export
 * @interface ILoadedResult
 */
export interface ILoadedResult {
    json : object;
    justLoaded : boolean;
    importRequest : APL.ImportRequest;
}
