/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { FontUtils, IConfigurationChangeOptions, ILogger, LoggerFactory, MetricsRecorder } from 'apl-html';
import { AplDisplayState } from '../common/ViewhostTypes';
import { DocumentContext } from '../document/DocumentContext';
import { DocumentHandle } from '../document/DocumentHandle';
import { PreparedDocument } from '../document/PreparedDocument';
import { IPrepareDocumentRequest, IRenderDocumentRequest } from './IRequest';
import { ViewController } from './ViewController';
import { IAPLViewhostConfig } from './ViewhostConfig';
import { ViewhostContext } from './ViewhostContext';

export class APLViewhostWASM {
    private logger: ILogger;
    private viewhostContext: ViewhostContext;
    private viewController: ViewController;
    private metricsRecorder?: MetricsRecorder;

    /**
     * @param viewhostConfig IAPLViewhostConfig to initialize the VH
     * @returns new instance of APLViewhostWASM
     */
    public static create(viewhostConfig: IAPLViewhostConfig) {
        return new APLViewhostWASM(viewhostConfig);
    }

    private constructor(viewhostConfig: IAPLViewhostConfig) {
        LoggerFactory.initialize(viewhostConfig.logLevel || 'debug', viewhostConfig.logTransport);
        this.logger = LoggerFactory.getLogger('APLViewhost');
        if (viewhostConfig.metricSinks) {
            this.metricsRecorder = new MetricsRecorder();
            viewhostConfig.metricSinks.forEach((sink) => { this.metricsRecorder!.addSink(sink); });
        }
        this.viewhostContext = ViewhostContext.create(viewhostConfig, this.metricsRecorder);
        this.viewController = ViewController.create(this.viewhostContext);
        this.logger.info('APLViewhostWASM created');
    }

    /**
     * Destroy the viewhost
     */
    public destroy() {
        this.viewController.destroy();
    }

    /**
     * initialze VH
     */
    public async init() {
        if (!this.viewhostContext.getConfig().notLoadFonts) {
            await FontUtils.initialize();
        }
    }

    /**
     * Bind to a native view
     * @param view HTMLElement APL renders on
     */
    public bind(view: HTMLElement) {
        this.viewController.bind(view);
    }

    /**
     * Unbind from the native view
     */
    public unbind() {
        this.viewController.unbind();
    }

    /**
     * @returns if the viewhost is bound to a native view
     */
    public isBound() {
        return this.viewController.isBound();
    }

    /**
     * Prepare the document context with the APL doc
     * @param request IPrepareDocumentRequest with document, data and other optional varibles
     * @returns A promise of PreparedDocument
     */
    public async prepare(request: IPrepareDocumentRequest): Promise<PreparedDocument> {
        const documentContext = new DocumentContext(request, this.viewhostContext);
        if (request.lifecycleListener) {
            documentContext.registerListener(request.lifecycleListener);
            setTimeout(() => {
                documentContext.prepareDocument();
            }, 0);
            return new PreparedDocument(documentContext.getHandle());
        }
        return documentContext.prepareDocument()
            .then((handle) => {
                return new PreparedDocument(handle);
            })
            .catch(() => {
                return Promise.reject('Failed to prepare document');
            });
    }

    /**
     * Render a APL doc on the bound view
     * @param request IRenderDocumentRequest with a PreparedDocument or raw document
     * @returns A promise of DocumentHandle
     */
    public async render(request: IRenderDocumentRequest): Promise<DocumentHandle> {
        if (!this.isBound()) {
            return Promise.reject('not bound to view');
        }

        let documentContext;
        if (request.preparedDoc) {
            documentContext = request.preparedDoc.extractContext();
        } else if (request.doc) {
            documentContext = new DocumentContext(request, this.viewhostContext);
        } else {
            return Promise.reject('missing raw document or perpared document');
        }

        if (!documentContext) {
            return Promise.reject('Failed to create context');
        }

        if (request.lifecycleListener) {
            documentContext.registerListener(request.lifecycleListener);
            setTimeout(() => {
                this.viewController.renderDocument(documentContext);
            }, 0);
            return documentContext.getHandle();
        }

        return this.viewController.renderDocument(documentContext);
    }

    /**
     * Update the configure of the view and viewhost
     * @param config IConfigurationChangeOptions
     */
    public configurationChange(config: IConfigurationChangeOptions) {
        this.viewhostContext.configurationChange(config);
        this.viewController.configurationChange(config);
    }

    /**
     * Update the DisplayState to the current displayed document
     * @param state new DisplayState
     */
    public updateDisplayState(state: AplDisplayState) {
        this.viewController.updateDisplayState(state);
    }

    public pauseDocument() {
        this.viewController.pauseDocument();
    }

    public resumeDocument() {
        this.viewController.resumeDocument();
    }
}
