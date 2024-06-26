/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { logLevelToLogCommandLevel, OnLogCommand } from './logging/LogCommand';

/**
 * Holds all of the documents and data necessary to inflate an APL component hierarchy.
 */
export class Content {

    /**
     * Creates an instance of a Content object. a single Content instance
     * can be used with multiple [[APLRenderer]]s.
     * @param doc The main APL document
     * @param data The data used for the main document
     * @param onLogCommand The callback to send back the log info
     */
    public static create(doc: string, data: string = '', onLogCommand?: OnLogCommand,
                         metrics?: APL.Metrics, config?: APL.RootConfig, fillMissingData = true) {
        return new Content(doc, data, onLogCommand, metrics, config, fillMissingData);
    }

    /**
     * Creates an instance of a Content object. a single Content instance
     * can be used with multiple [[APLRenderer]]s.
     * @param doc The main APL document
     * @param data The data used for the main document
     * @param onLogCommand The callback to send back the log info
     */
    public static recreate(other: Content, onLogCommand?: OnLogCommand) {
        if (other.data) {
            return new Content(other.doc, other.data, onLogCommand);
        }
        return new Content(other.doc, JSON.stringify(other.dataMap), onLogCommand);
    }

    /**
     * @internal
     * @ignore
     */
    public content: APL.Content;

    /**
     * APL doc settings.
     * @private
     */
    private settings: object;

    /**
     * Get Content created from Core.
     */
    public getContent(): APL.Content {
        return this.content;
    }

    /**
     * @internal
     * @ignore
     * @param doc The main APL document
     * @param data The data used for the main document
     */
    private constructor(private doc: string, private data: string, onLogCommand?: OnLogCommand,
                        metrics?: APL.Metrics, config?: APL.RootConfig, fillMissingData = true) {
        try {
            this.settings = JSON.parse(doc).settings || {};
        } catch (e) {
            this.settings = {};
        }
        const onLogCommandCallback = (level, message, args) => {
            if (onLogCommand) {
                onLogCommand(logLevelToLogCommandLevel(level), message, args);
            }
        };
        if (metrics && config) {
            this.content = Module.Content.createWithConfig(this.doc, Module.Session.create(onLogCommandCallback),
                                                 metrics, config);
        } else {
            this.content = Module.Content.create(this.doc, Module.Session.create(onLogCommandCallback));
        }

        if (this.data) {
            const jsonDoc = JSON.parse(this.doc);
            if (jsonDoc.mainTemplate && jsonDoc.mainTemplate.parameters &&
                Array.isArray(jsonDoc.mainTemplate.parameters) &&
                jsonDoc.mainTemplate.parameters.length > 0) {
                const parsedData = JSON.parse(data);
                jsonDoc.mainTemplate.parameters.forEach((name: string) => {
                    if (name === 'payload') {
                        this.content.addData(name, data);
                    } else if (parsedData[name]) {
                        this.content.addData(name, JSON.stringify(parsedData[name]));
                    } else if (fillMissingData) {
                        this.content.addData(name, '{}');
                    }
                });
            }
        }
    }

    /**
     * @deprecated
     * Runtime shouldn't need to do this anymore. Please use APLViewhostWASM API
     */
    public getRequestedPackages(): Set<APL.ImportRequest> {
        return this.content.getRequestedPackages();
    }

    /**
     * @deprecated
     * Runtime shouldn't need to do this anymore. Please use APLViewhostWASM API
     */
    public addPackage(request: APL.ImportRequest, data: string): void {
        this.content.addPackage(request, data);
    }

    /**
     * @return True if this content is in an error state and can't be inflated.
     */
    public isError(): boolean {
        return this.content.isError();
    }

    /**
     * @return True if this content is complete and ready to be inflated.
     */
    public isReady(): boolean {
        return this.content.isReady();
    }

    /**
     * @return true if this document is waiting for any valid packages to be loaded.
     */
    public isWaiting(): boolean {
        return this.content.isWaiting() && !this.content.isError();
    }

    /**
     * @deprecated Should use create(doc, data, onLogCommand)
     * Add data
     * @param name The name of the data source
     * @param data The raw data source
     */
    public addData(name: string, data: string): void {
        if (this.data) {
            console.warn('Created with datasource already, no-op for addData.');
            return;
        }
        if (name === 'payload') {
            this.dataMap = {...this.dataMap, ...JSON.parse(data)};
        }
        this.dataMap[name] = JSON.parse(data);
        this.content.addData(name, data);
    }

    public refresh(metrics: APL.Metrics, config: APL.RootConfig): void {
        this.content.refresh(metrics, config);
    }

    /**
     * Get document version specified in the input
     */
    public getAPLVersion() {
        return this.content.getAPLVersion();
    }

    /**
     * Deletes this obejct and all data associated with it.
     */
    public delete() {
        this.content.delete();
        (this.content as any) = undefined;
    }

    /**
     * @return The set of requested custom extensions (a list of URI values)
     */
    public getExtensionRequests(): Set<string> {
        return this.content.getExtensionRequests();
    }

    /**
     * Retrieve the settings associated with an extension request.
     * @param uri The uri of the extension.
     * @return Map of settings, Object::NULL_OBJECT() if no settings are specified in the document.
     */
    public getExtensionSettings(uri: string): object {
        return this.content.getExtensionSettings(uri);
    }

    /**
     * get APL settings in APL Doc.
     * @param key
     */
    public getAPLSettings(key: string): any {
        return this.settings[key];
    }

    /**
     * get the parameter through index.
     * @param index
     */
    public getParameterAt(index: number): string {
        return this.content.getParameterAt(index);
    }

    /**
     * get the total customized parameter needed for APL.
     */
    public getParameterCount(): number {
        return this.content.getParameterCount();
    }

    private dataMap = {};
}
