/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IExtensionEventCallbackResult } from 'apl-html';
import { ExtensionCommandDefinition, ExtensionEventHandler } from './Extension';
import { LiveMap } from '../LiveMap';
import { LiveArray } from '../LiveArray';

export interface ILiveDataDefinition {
    name : string;
    data : LiveMap | LiveArray;
}

/**
 * The common interface for all extensions.
 */
export interface IExtension {
    getUri() : string;
    getEnvironment() : any;
    getExtensionCommands() : ExtensionCommandDefinition[];
    getExtensionEventHandlers() : ExtensionEventHandler[];
    getLiveData() : ILiveDataDefinition[];
    setContext(context : APL.Context) : void;
    onExtensionEvent(uri : string, commandName : string, source : object,
                     params : object, resultCallback : IExtensionEventCallbackResult);
    applySettings(settings : object);
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
    connect(settings : string) : boolean;

    /**
     * Destroy a connection between extension and service.
     * @return boolean indicates disconnect success or not.
     */
    disconnect() : boolean;

    /**
     * Send message from extension to service.
     * @param message to send.
     */
    sendMessage(message : IExtensionConnectionMessage) : void;

    /**
     * When message received from service.
     * @param message received.
     */
    onMessage(message : IExtensionConnectionMessage) : void;

    /**
     * When connection is closed.
     * @param event.
     */
    onClose(event : any) : void;

    /**
     * When connection is open.
     * @param event.
     */
    onOpen(event : any) : void;

    /**
     * When connection has error.
     * @param event.
     */
    onError(event : any) : void;
}

export interface IExtensionConnectionMessage {
    uri : string;
    payload : any;
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
    onConnect(settings? : string, connection? : IExtensionConnection) : void;

    /**
     * when disconnected.
     */
    onDisconnect() : void;

    /**
     * onMessage received.
     * @param message
     */
    onMessage(message : IExtensionConnectionMessage) : void;

    /**
     * send message.
     * @param message
     */
    sendMessage(message : IExtensionConnectionMessage) : void;

    /**
     * apply settings of the extension.
     * @param settings
     */
    applySettings(settings : object) : void;
}
