/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

/**
 * Create an ExtensionConfiguration by consumer which contains granted extension and extension to initialize.
 */
export class ExtensionConfiguration {
    private granted : Set<string> = new Set<string>();
    private initialized : Map<string, string> = new Map<string, string>();

    /**
     * add granted extensions.
     * @param uri
     */
    public addGranted(uri : string) {
        this.granted.add(uri);
    }

    /**
     * add initialized extension.
     * @param uri
     * @param settings
     */
    public addInitialized(uri : string, settings : string) {
        this.initialized.set(uri, settings);
    }

    /**
     * get the initialized extensions.
     */
    public getInitializedExtensions() {
        return this.initialized;
    }

    /**
     * check if the extension is granted.
     * @param uri
     */
    public isGranted(uri : string) {
        return this.granted.has(uri);
    }
}
