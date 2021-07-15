/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export class ExtensionFilterDefinition {

    /**
     * @internal
     * @ignore
     */
    public filterExtensionDef: APL.ExtensionFilterDefinition;

    /**
     * Standard constructor
     * @param uri The URI of the extension
     * @param name The name of the filter extension.
     * @param imageCount The number of images referenced by this filter.
     */
    public constructor( uri: string, name: string, imageCount: number) {
        this.filterExtensionDef = Module.ExtensionFilterDefinition.create(uri, name, imageCount);
        return this;
    }

    /**
     * Add a named property. The property names "when" and "type" are reserved.
     * @param property The property to add
     * @param defValue The default value to use for this property when it is not provided.
     * @return This object for chaining.
     */
    public property(property: string, defValue: any): ExtensionFilterDefinition {
        this.filterExtensionDef.property(property, defValue);
        return this;
    }

    /**
     * @return The extension URI associated with this filter extension
     */
    public getURI(): string {
        return this.filterExtensionDef.getURI();
    }

    /**
     * @return The name of this filter extension
     */
    public getName(): string {
        return this.filterExtensionDef.getName();
    }

    /**
     * @return The number of images referenced by this filter (0, 1, or 2);
     */
    public getImageCount(): number {
        return this.filterExtensionDef.getImageCount();
    }
}
