/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IConfigurationChangeOptions, ILogger, LoggerFactory } from 'apl-html';
import { AplDisplayState } from '../common/ViewhostTypes';
import { DocumentContext } from '../document/DocumentContext';
import { DocumentHandle } from '../document/DocumentHandle';
import { DocumentState } from '../document/DocumentState';
import { UnifiedBackstackExtension } from '../extensions/unifiedBackstack/UnifiedBackstackExtension';
import { ViewhostContext } from './ViewhostContext';

/**
 * Defines the rendering logic. Need to be bound to a native view.
 * This class should be only reachable from inside the Viewhost
 */
export class ViewController {
    private bound = false;
    private view: HTMLElement;
    private currentDocument: DocumentContext | null;
    private logger: ILogger;
    private backstackExtension?: UnifiedBackstackExtension;
    private displayState = AplDisplayState.foreground;
    private viewhostContext: ViewhostContext;
    private paused: boolean = false;

    /**
     * @param viewhostConfig IAPLViewhostConfig to initialize the VH
     * @returns new instance of APLViewhostWASM
     */
    public static create(viewhostContext: ViewhostContext) {
        return new ViewController(viewhostContext);
    }

    private constructor(viewhostContext: ViewhostContext) {
        this.viewhostContext = viewhostContext;
        this.logger = LoggerFactory.getLogger('APLViewController');
        this.backstackExtension = this.viewhostContext.getConfig().backstackExtension;
        if (this.backstackExtension) {
            this.backstackExtension.provideRestoreCallback(
                (documentContext: DocumentContext) => this.restoreDocument(documentContext));
        }
    }

    /**
     * Destroy the viewhost
     */
    public destroy() {
        if (this.currentDocument) {
            this.currentDocument.destroy();
            this.currentDocument = null;
            this.bound = false;
        }
    }

    /**
     * Bind to a native view
     * @param view HTMLElement APL renders on
     */
    public bind(view: HTMLElement) {
        this.bound = true;
        this.view = view;
        if (this.currentDocument) {
            this.currentDocument.resume();
        }
    }

    /**
     * Unbind from the native view
     */
    public unbind() {
        this.bound = false;
        if (this.currentDocument) {
            this.currentDocument.pause();
        }
    }

    /**
     * @returns if the viewhost is bound to a native view
     */
    public isBound() {
        return this.bound && this.view.isConnected;
    }

    /**
     * @internal
     * @ignore
     */
    public async renderDocument(documentContext: DocumentContext): Promise<DocumentHandle> {
        await documentContext.prepareDocument();
        if (documentContext.getDocumentState() !== DocumentState.prepared) {
            return Promise.reject('Failed to prepare document');
        }

        if (this.currentDocument && this.currentDocument.isRendered()) {
            if (!this.tryPushToBackstack(this.currentDocument)) {
                this.currentDocument.destroy();
            }
        }
        this.currentDocument = documentContext;
        if (this.paused) {
            this.currentDocument.pause();
        }
        return this.currentDocument.renderDocument(this.view);
    }

    private tryPushToBackstack(documentContext: DocumentContext): boolean {
        if (this.backstackExtension && this.backstackExtension.shouldCacheActiveDocument()) {
            this.logger.info('push to backstack');
            documentContext.pause();
            documentContext.unbindFromView();
            documentContext.updateDisplayState(AplDisplayState.hidden);
            return this.backstackExtension.addDocumentContextToBackstack(documentContext);
        }
        return false;
    }

    /**
     * @internal
     * @ignore
     * For use by Backstack, we don't want to push a popped document back onto the stack
     */
    public restoreDocument(documentContext: DocumentContext): void {
        this.logger.info('restore from backstack');
        if (this.currentDocument) {
            this.currentDocument.destroy();
        }

        this.currentDocument = documentContext;
        if (!this.paused) {
            this.currentDocument.resume();
        }
        this.currentDocument.renderDocument(this.view);
        this.currentDocument.updateDisplayState(this.displayState);
    }

    /**
     * Update the configure of the view and viewhost
     * @param config IConfigurationChangeOptions
     */
    public configurationChange(config: IConfigurationChangeOptions) {
        if (this.backstackExtension) {
            this.backstackExtension.provideConfigChangeToStackedDocuments(config);
        }
        if (this.currentDocument) {
            this.currentDocument.configurationChange(config);
        }
    }

    /**
     * Update the DisplayState to the current displayed document
     * @param state new DisplayState
     */
    public updateDisplayState(state: AplDisplayState) {
        if (this.currentDocument && state !== this.displayState) {
            this.currentDocument.updateDisplayState(state);
        }
        this.displayState = state;
    }

    public resumeDocument() {
        if (!this.paused) {
            this.logger.warn('resumeDocument called when not paused');
        }
        this.paused = false;
        if (this.currentDocument) {
            this.currentDocument.resume();
        }
    }

    public pauseDocument() {
        if (this.paused) {
            this.logger.warn('pauseDocument called when already paused');
        }
        this.paused = true;
        if (this.currentDocument) {
            this.currentDocument.pause();
        }
    }
}
