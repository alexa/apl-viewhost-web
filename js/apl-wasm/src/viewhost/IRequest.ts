/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IEnvironment } from 'apl-html';
import { ScalingOptions } from '../APLWASMRenderer';
import { IDocumentLifecycleListener } from '../document/DocumentState';
import { IEmbeddedDocumentFactory } from '../document/IEmbeddedDocumentFactory';
import { PreparedDocument } from '../document/PreparedDocument';

export interface IPrepareDocumentRequest {
    /** Raw APL document */
    doc: string;
    /** optional data source */
    data?: string;
    /** optional token. If not provided, a random uid will be used */
    token?: string;
    /** extra enviroment varibles */
    environment?: IEnvironment;
    /** scaling options of this APL doc */
    scaling?: ScalingOptions;
    /** EmbeddedDocumentFactory from runtime */
    embeddedDocumentFactory?: IEmbeddedDocumentFactory;
    /**
     * IDocumentLifecycleListener
     * If provided, the request will resolve the promise with a DocumentHandle immediately
     * All lifecycle events will be sent to the lifecycleListener.
     */
    lifecycleListener?: IDocumentLifecycleListener;
}

export interface IRenderDocumentRequest {
    /** A prepared APL document, if provided, wiil ignore the rest in the object */
    preparedDoc?: PreparedDocument;
    /** Raw APL document */
    doc?: string;
    /** optional data source */
    data?: string;
    /** optional token. If not provided, a random uid will be used */
    token?: string;
    /** extra enviroment varibles */
    environment?: IEnvironment;
    /** scaling options of this APL doc */
    scaling?: ScalingOptions;
    /** EmbeddedDocumentFactory from runtime */
    embeddedDocumentFactory?: IEmbeddedDocumentFactory;
    /**
     * IDocumentLifecycleListener
     * If provided, the request will resolve the promise with a DocumentHandle immediately
     * All lifecycle events will be sent to the lifecycleListener.
     */
    lifecycleListener?: IDocumentLifecycleListener;
}
export interface IExecuteCommandsRequest {
    /** Command to execute */
    command: string;
}
