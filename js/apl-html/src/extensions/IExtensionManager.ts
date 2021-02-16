/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { IExtensionEventCallbackResult } from './IExtensionEventCallbackResult';

/**
 * A common interface for managing extensions.
 */
export interface IExtensionManager {
    onExtensionEvent(uri : string, event : APL.Event, commandName : string, source : object, params : object, resultCallback : IExtensionEventCallbackResult);
    onDocumentRender(rootContext : APL.Context, content : APL.Content);
    configureExtensions(extensionConfiguration : any);
    onMessageReceived(uri : string, payload : string);
    onDocumentFinished();
    resetRootContext();
}