/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration settings used when creating a ExtensionCommandDefinition.
 *
 * This is normally used as:
 * '''
 *     ExtensionCommandDefinition commandDefinition = new ExtensionCommandDefinition("apl:myext:10","SomeCommand")
 *                                     .allowFastMode(true)
 *                                     .requireResolution(false);
 * '''
 */
export class ExtensionCommandDefinition {

    /**
     * @internal
     * @ignore
     */
    public commandDefinition : APL.ExtensionCommandDefinition;

    /**
     * Standard constructor
     * @param uri The URI of the extension
     * @param name The name of the command.
     */
    public constructor( uri : string, name : string) {
        this.commandDefinition = Module.ExtensionCommandDefinition.create(uri, name);
        return this;
    }

    /**
     * Configure if this command can run in fast mode.  When the command runs in fast mode the
     * "requireResolution" property is ignored (fast mode commands do not support action resolution).
     * @param allowFastMode If true, this command can run in fast mode.
     * @return This object for chaining
     */
    public allowFastMode(allowFastMode : boolean) : ExtensionCommandDefinition {
        this.commandDefinition.allowFastMode(allowFastMode);
        return this;
    }

    /**
     * Configure if this command (in normal mode) will return an action pointer
     * that must be resolved by the view host before the next command in the sequence is executed.
     * @param requireResolution If true, this command will provide an action pointer (in normal mode).
     * @return This object for chaining.
     */
    public requireResolution(requireResolution : boolean) : ExtensionCommandDefinition {
       this.commandDefinition.requireResolution(requireResolution);
       return this;
    }

    /**
     * Add a named property. The property names "when" and "type" are reserved.
     * @param property The property to add
     * @param defValue The default value to use for this property when it is not provided.
     * @param required If true and the property is not provided, the command will not execute.
     * @return This object for chaining.
     */
    public property(property : string, defValue : any, required : boolean) : ExtensionCommandDefinition {
        this.commandDefinition.property(property, defValue, required);
        return this;
    }

    /**
     * Add a named array-ified property. The property will be converted into an array of values. The names "when"
     * and "type" are reserved.
     * @param property The property to add
     * @param defvalue The default value to use for this property when it is not provided.
     * @param required If true and the property is not provided, the command will not execute.
     * @return This object for chaining.
     */
    public arrayProperty(property : string, required : boolean ) : ExtensionCommandDefinition {
        this.commandDefinition.arrayProperty(property, required);
        return this;
    }

    /**
     * @return The URI of the extension
     */
    public getURI() : string {
        return this.commandDefinition.getURI();
    }

    /**
     * @return The name of the command
     */
    public getName() : string {
        return this.commandDefinition.getName();
    }

    /**
     * @return True if this command can execute in fast mode
     */
    public getAllowFastMode() : boolean {
        return this.commandDefinition.getAllowFastMode();
    }

    /**
     * @return True if this command will return an action pointer that must be
     *         resolved.  Please note that a command running in fast mode will
     *         never wait to be resolved.
     */
    public getRequireResolution() : boolean {
        return this.commandDefinition.getRequireResolution();
    }
}

export class ExtensionEventHandler {

    /**
     * @internal
     * @ignore
     */
    public eventHandler : APL.ExtensionEventHandler;

    /**
     * Standard constructor
     * @param uri The URI of the extension
     * @param name The name of the handler.
     */
    public constructor( uri : string, name : string) {
        this.eventHandler = Module.ExtensionEventHandler.create(uri, name);
        return this;
    }

    /**
     * @return The extension URI associated with this event handler
     */
    public getURI() : string {
        return this.eventHandler.getURI();
    }

    /**
     * @return The name of this event handler
     */
    public getName() : string {
        return this.eventHandler.getName();
    }
}

export class ExtensionFilterDefinition {

    /**
     * @internal
     * @ignore
     */
    public filterExtensionDef : APL.ExtensionFilterDefinition;

    /**
     * Standard constructor
     * @param uri The URI of the extension
     * @param name The name of the filter extension.
     * @param imageCount The number of images referenced by this filter.
     */
    public constructor( uri : string, name : string, imageCount : number) {
        this.filterExtensionDef = Module.ExtensionFilterDefinition.create(uri, name, imageCount);
        return this;
    }

    /**
     * Add a named property. The property names "when" and "type" are reserved.
     * @param property The property to add
     * @param defValue The default value to use for this property when it is not provided.
     * @return This object for chaining.
     */
    public property(property : string, defValue : any) : ExtensionFilterDefinition {
        this.filterExtensionDef.property(property, defValue);
        return this;
    }

    /**
     * @return The extension URI associated with this filter extension
     */
    public getURI() : string {
        return this.filterExtensionDef.getURI();
    }

    /**
     * @return The name of this filter extension
     */
    public getName() : string {
        return this.filterExtensionDef.getName();
    }

    /**
     * @return The number of images referenced by this filter (0, 1, or 2);
     */
    public getImageCount() : number {
        return this.filterExtensionDef.getImageCount();
    }
}
