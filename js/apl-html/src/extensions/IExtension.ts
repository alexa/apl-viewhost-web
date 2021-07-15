/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {IExtensionEventCallbackResult} from './IExtensionEventCallbackResult';
import {LiveMap} from './LiveMap';
import {LiveArray} from './LiveArray';

export interface ILiveDataDefinition {
    name: string;
    data: LiveMap | LiveArray;
}

export type CreateAplExtensionCommandDefintion = (uri: string, name: string) => APL.ExtensionCommandDefinition;

export interface ExtensionCommandDefinitionArgs {
    /**
     * The URI of the extension
     */
    uri: string;
    /**
     * The name of the command.
     */
    name: string;
    /**
     * factory function
     */
    createAplExtensionCommandDefinition: CreateAplExtensionCommandDefintion;
}

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
    public commandDefinition: APL.ExtensionCommandDefinition;

    /**
     * Standard constructor
     * @param args ExtensionCommandDefinitionArgs
     */
    public constructor(createExtensionCommandDefinitionArgs: ExtensionCommandDefinitionArgs) {
        const {uri, name, createAplExtensionCommandDefinition} = createExtensionCommandDefinitionArgs;
        this.commandDefinition = createAplExtensionCommandDefinition(uri, name);
        return this;
    }

    /**
     * Configure if this command can run in fast mode.  When the command runs in fast mode the
     * "requireResolution" property is ignored (fast mode commands do not support action resolution).
     * @param allowFastMode If true, this command can run in fast mode.
     * @return This object for chaining
     */
    public allowFastMode(allowFastMode: boolean): ExtensionCommandDefinition {
        this.commandDefinition.allowFastMode(allowFastMode);
        return this;
    }

    /**
     * Configure if this command (in normal mode) will return an action pointer
     * that must be resolved by the view host before the next command in the sequence is executed.
     * @param requireResolution If true, this command will provide an action pointer (in normal mode).
     * @return This object for chaining.
     */
    public requireResolution(requireResolution: boolean): ExtensionCommandDefinition {
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
    public property(property: string, defValue: any, required: boolean): ExtensionCommandDefinition {
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
    public arrayProperty(property: string, required: boolean): ExtensionCommandDefinition {
        this.commandDefinition.arrayProperty(property, required);
        return this;
    }

    /**
     * @return The URI of the extension
     */
    public getURI(): string {
        return this.commandDefinition.getURI();
    }

    /**
     * @return The name of the command
     */
    public getName(): string {
        return this.commandDefinition.getName();
    }

    /**
     * @return True if this command can execute in fast mode
     */
    public getAllowFastMode(): boolean {
        return this.commandDefinition.getAllowFastMode();
    }

    /**
     * @return True if this command will return an action pointer that must be
     *         resolved.  Please note that a command running in fast mode will
     *         never wait to be resolved.
     */
    public getRequireResolution(): boolean {
        return this.commandDefinition.getRequireResolution();
    }
}

export type CreateAplExtensionEventHandler = (uri: string, name: string) => APL.ExtensionEventHandler;

export interface CreateExtensionEventHandlerArgs {
    /**
     * The URI of the extension
     */
    uri: string;
    /**
     * The name of the command.
     */
    name: string;
    /**
     * factory function
     */
    createAplExtensionEventHandler: CreateAplExtensionEventHandler;
}

export class ExtensionEventHandler {
    public eventHandler: APL.ExtensionEventHandler;

    /**
     * Standard constructor
     * @param args createExtensionEventHandlerArgs
     */
    public constructor(args: CreateExtensionEventHandlerArgs) {
        const {uri, name, createAplExtensionEventHandler} = args;
        this.eventHandler = createAplExtensionEventHandler(uri, name);
        return this;
    }

    /**
     * @return The extension URI associated with this event handler
     */
    public getURI(): string {
        return this.eventHandler.getURI();
    }

    /**
     * @return The name of this event handler
     */
    public getName(): string {
        return this.eventHandler.getName();
    }
}

/**
 * The common interface for all extensions.
 */
export interface IExtension {
    getUri(): string;

    getEnvironment(): any;

    getExtensionCommands(): ExtensionCommandDefinition[];

    getExtensionEventHandlers(): ExtensionEventHandler[];

    getLiveData(): ILiveDataDefinition[];

    setContext(context: APL.Context): void;

    onExtensionEvent(uri: string, commandName: string, source: object,
                     params: object, resultCallback: IExtensionEventCallbackResult);

    applySettings(settings: object);
}

/**
 * The connection between extensionManager/extensionClient and server/service.
 * This is for local connection only, for services through http/ws, it is not in scope.
 */
export interface IExtensionConnection {
    /**
     * Create a connection between extension and service.
     * @return boolean indicates connection establish success or not.
     */
    connect(settings: string): boolean;

    /**
     * Destroy a connection between extension and service.
     * @return boolean indicates disconnect success or not.
     */
    disconnect(): boolean;

    /**
     * Send message from extension to service.
     * @param message to send.
     */
    sendMessage(message: IExtensionConnectionMessage): void;

    /**
     * When message received from service.
     * @param message received.
     */
    onMessage(message: IExtensionConnectionMessage): void;

    /**
     * When connection is closed.
     * @param event.
     */
    onClose(event: any): void;

    /**
     * When connection is open.
     * @param event.
     */
    onOpen(event: any): void;

    /**
     * When connection has error.
     * @param event.
     */
    onError(event: any): void;
}

export interface IExtensionConnectionMessage {
    uri: string;
    payload: any;
}

/**
 * The extension service provider connected through function calls instead of hosted service.
 */
export interface IExtensionService {
    /**
     * configuration and connection only required for local function call service (no IPC).
     * @param settings
     * @param connection
     */
    onConnect(settings?: string, connection?: IExtensionConnection): void;

    /**
     * when disconnected.
     */
    onDisconnect(): void;

    /**
     * onMessage received.
     * @param message
     */
    onMessage(message: IExtensionConnectionMessage): void;

    /**
     * send message.
     * @param message
     */
    sendMessage(message: IExtensionConnectionMessage): void;

    /**
     * apply settings of the extension.
     * @param settings
     */
    applySettings(settings: object): void;
}
