/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Holds all of the documents and data necessary to inflate an APL component hierarchy.
 */
export class Content {

    /**
     * Creates an instance of a Content object. a single Content instance
     * can be used with multiple [[APLRenderer]]s.
     * @param doc The main APL document
     */
    public static create(doc : string) {
        return new Content(doc);
    }

    /**
     * @internal
     * @ignore
     */
    public content : APL.Content;

    /**
     * APL doc settings.
     * @private
     */
    private settings : object;

    /**
     * Get Content created from Core.
     */
    public getContent() : APL.Content {
        return this.content;
    }

    /**
     * @internal
     * @ignore
     * @param doc The main APL document
     */
    private constructor(doc : string) {
        this.content = Module.Content.create(doc);
        try {
            this.settings = JSON.parse(doc).settings || {};
        } catch (e) {
            this.settings = {};
        }
    }

    /**
     * Retrieve a set of packages that have been requested.  This method only returns an
     * individual package a single time.  Once it has been called, the "requested" packages
     * are moved internally into a "pending" list of packages.
     * @return The set of packages that should be loaded.
     */
    public getRequestedPackages() : Set<APL.ImportRequest> {
        return this.content.getRequestedPackages();
    }

    /**
     * Add a requested package to the document.
     * @param request The requested package import structure.
     * @param data Data for the package.
     */
    public addPackage(request : APL.ImportRequest, data : string) : void {
        this.content.addPackage(request, data);
    }

    /**
     * @return True if this content is in an error state and can't be inflated.
     */
    public isError() : boolean {
        return this.content.isError();
    }

    /**
     * @return True if this content is complete and ready to be inflated.
     */
    public isReady() : boolean {
        return this.content.isReady();
    }

    /**
     * @return true if this document is waiting for any valid packages to be loaded.
     */
    public isWaiting() : boolean {
        return this.content.isWaiting() && !this.content.isError();
    }

    /**
     * Add data
     * @param name The name of the data source
     * @param data The raw data source
     */
    public addData(name : string, data : string) : void {
        this.content.addData(name, data);
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
    public getExtensionRequests() : Set<string> {
        return this.content.getExtensionRequests();
    }

    /**
     * Retrieve the settings associated with an extension request.
     * @param uri The uri of the extension.
     * @return Map of settings, Object::NULL_OBJECT() if no settings are specified in the document.
     */
    public getExtensionSettings(uri : string) : object {
        return this.content.getExtensionSettings(uri);
    }

    /**
     * get APL settings in APL Doc.
     * @param key
     */
    public getAPLSettings(key : string) : any {
        return this.settings[key];
    }
 }
