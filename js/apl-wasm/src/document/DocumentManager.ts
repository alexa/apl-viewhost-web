/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILogger, LoggerFactory } from 'apl-html';
import { IPrepareDocumentRequest } from '../viewhost/IRequest';
import { ViewhostContext } from '../viewhost/ViewhostContext';
import { DocumentContext } from './DocumentContext';
import { DocumentState } from './DocumentState';
import { EmbeddedDocumentRequest, IEmbeddedDocumentFactory } from './IEmbeddedDocumentFactory';
import { PreparedDocument } from './PreparedDocument';

export class DocumentManager {
    private logger: ILogger;

    private cppDocumentManager: APL.DocumentManager;
    private viewhostContext: ViewhostContext;
    private embeddedDocumentFactory?: IEmbeddedDocumentFactory;
    private embeddedDocuments = new Array<DocumentContext>();

    private documentState = DocumentState.pending;

    constructor(
        viewhostContext: ViewhostContext,
        embeddedDocumentFactory?: IEmbeddedDocumentFactory
    ) {
        this.logger = LoggerFactory.getLogger('DocumentContext');

        this.embeddedDocumentFactory = embeddedDocumentFactory;
        this.viewhostContext = viewhostContext;
        this.cppDocumentManager = Module.DocumentManager.create((
            requestId: number,
            embedRequestUrl: string,
            embedRequestHeaders: string[]
        ) => {
            this.request(requestId, embedRequestUrl, embedRequestHeaders);
        });
    }

    /**
     * @internal
     * @ignore
     */
    public provideCppDocumentManager(): APL.DocumentManager {
        return this.cppDocumentManager;
    }

    public destroy(): void {
        this.cppDocumentManager.destroy();
        this.embeddedDocumentFactory = undefined;
    }

    /**
     * @internal
     * @ignore
     */
    public request(requestId: number, embedRequestUrl: string, embedRequestHeaders: string[]): void {
        if (!this.embeddedDocumentFactory) {
            this.logger.error('No IEmbeddedDocumentFactory provided. Please supply one via IAPLWASMOptions to use the Host component.');
            return;
        }

        // For use by the Runtime only. Using logic from main VH API.
        const runtimePrepareDocument = (request: IPrepareDocumentRequest): Promise<PreparedDocument> => {
            const documentContext = new DocumentContext(request, this.viewhostContext, false);
            return documentContext.prepareDocument()
            .then((handle) => {
                return new PreparedDocument(handle);
            })
            .catch(() => {
                return Promise.reject('Failed to prepare document');
            });
        };

        const embeddedDocumentRequest: EmbeddedDocumentRequest = {
            url: embedRequestUrl,
            headers: embedRequestHeaders,
            vhPrepare: runtimePrepareDocument
        };

        this.embeddedDocumentFactory.request(embeddedDocumentRequest).then((preparedDoc) => {
            const documentContext = preparedDoc.extractContext();
            this.embeddedDocuments.push(documentContext);
            const docConfig = documentContext.createAndGetDocumentConfig();
            const coreDocumentContext = this.cppDocumentManager.embedRequestSucceeded(
                requestId,
                embedRequestUrl,
                documentContext.getContent().getContent(),
                docConfig,
                false // TODO: Handle connectedVisualContext
            );
            documentContext.setCoreDocumentContext(coreDocumentContext);
            documentContext.onDocumentStateUpdate(this.documentState);
        }).catch((error) => {
            this.logger.error(`Failed to fetch embedded document: ${embedRequestUrl}, error ${error}`);
            this.cppDocumentManager.embedRequestFailed(
                requestId,
                embedRequestUrl,
                String(error)
            );
        });
    }

    /**
     * @internal
     * @ignore
     */
    public getEmbeddedDocuments(): DocumentContext[] {
        return this.embeddedDocuments;
    }

    public updateDocumentState(state: DocumentState): void {
        this.documentState = state;
        this.getEmbeddedDocuments().forEach((embeddedDocument) => {
            embeddedDocument.onDocumentStateUpdate(state);
        });
    }
}
