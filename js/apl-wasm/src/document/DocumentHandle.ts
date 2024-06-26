/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Content } from 'apl-html';
import { APLWASMRenderer } from '../APLWASMRenderer';
import { IExecuteCommandsRequest } from '../viewhost/IRequest';
import { DocumentContext } from './DocumentContext';
import { IDocumentLifecycleListener } from './DocumentState';

export class DocumentHandle {
    private delegate: DocumentContext|null;

    constructor(context: DocumentContext) {
        this.delegate = context;
    }

    /**
     * Release the context linked to this handle
     * Should be called when the Runtime is done with this document to perform a early resource clean up
     */
    public destroy() {
        this.delegate = null;
    }

    /**
     * @returns The token runtime assigned or VH generated
     */
    public getToken(): string {
        return this.delegate!.getToken();
    }

    /**
     * Execute APL command on this document
     * @param command IExecuteCommandsRequest
     * @returns true if the command is successfully executed by the core
     *          false if the command is canceled by the core during executation
     *          Reject if the command failed to be execute
     */
    public async executeCommands(command: IExecuteCommandsRequest): Promise<boolean> {
        return this.delegate!.executeCommands(command);
    }

    /**
     * Cancel any pending execution, will trigger executeCommand to resolve with cancelation
     */
    public cancelExecution() {
        this.delegate!.cancelExecution();
    }

    /**
     * Finish the current document
     */
    public finish() {
        this.delegate!.destroy();
        this.delegate = null;
    }

    /**
     * @returns the visual context of the document
     */
    public async getVisualContext(): Promise<string> {
        return this.delegate!.getVisualContext();
    }

    /**
     * @returns the data source context of the document
     */
    public async getDataSourceContext(): Promise<string> {
        return this.delegate!.getDataSourceContext();
    }

    /**
     * Update the data source of the document
     * @param payload data source update command
     * @param type DataSource type. Optional, should be one of runtime registered
     * @returns true for success, false for failure.
     */
    public async updateDataSource(payload: string, type?: string): Promise<boolean> {
        return this.delegate!.updateDataSource(payload, type);
    }

    /**
     * Add a IDocumentLifecycleListener to the document.
     * @param listener IDocumentLifecycleListener
     * @returns a unique ID of the listener, used for removing the listener later.
     */
    public registerListener(listener: IDocumentLifecycleListener): number {
        return this.delegate!.registerListener(listener);
    }

    /**
     * Remove a IDocumentLifecycleListener
     * @param id the ID of the IDocumentLifecycleListener
     */
    public unregisterListener(id: number) {
        this.delegate!.unregisterListener(id);
    }

    public getUserData(): Map<string, object> {
        return this.delegate!.userData;
    }

    /**
     * @internal
     * @ignore
     */
    public getContext(): DocumentContext {
        return this.delegate!;
    }

    /**
     * @internal
     * @ignore
     */
    public getContent(): Content {
        return this.delegate!.getContent();
    }

    /**
     * @deprecated
     * @ignore
     */
    public getLegacy(): APLWASMRenderer|null {
        return this.delegate!.getLegacy();
    }

    /**
     * @returns true if the handle is pointing to a document that is prepared or rendered.
     */
    public hasDocument(): boolean {
        return this.delegate !== null && ( this.delegate.isReady() || this.delegate.isRendered() );
    }

    /**
     *
     * @returns true if the handle is pointing to a document that is prepared
     */
    public isReady(): boolean {
        return this.delegate !== null && this.delegate!.isReady();
    }
}
