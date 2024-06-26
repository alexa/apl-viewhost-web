/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPrepareDocumentRequest } from '../viewhost/IRequest';
import { PreparedDocument } from './PreparedDocument';

export interface IEmbeddedDocumentFactory {
    /**
     * requst to fetch a embedded document
     * @param uri presentation uri or https url
     * @return the Json string of the document, reject if cannot download
     */
    request: (request: EmbeddedDocumentRequest) => Promise<PreparedDocument>;
}

export interface EmbeddedDocumentRequest {
    url: string;
    headers: string[];
    vhPrepare: (request: IPrepareDocumentRequest) => Promise<PreparedDocument>;
}
