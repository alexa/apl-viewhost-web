/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentContext } from './DocumentContext';
import { DocumentHandle } from './DocumentHandle';

export class PreparedDocument {
    private handle: DocumentHandle | null;
    constructor(handle: DocumentHandle) {
        this.handle = handle;
    }

    /**
     * Destroy the prepared document with the content it is holding
     */
    public destroy(): void {
        if (!this.handle) {
            return;
        }
        this.handle.getContext().destroy();
        this.handle.destroy();
        this.handle = null;
    }

    /**
     * @internal
     * @ignore
     * Move the DocumentContext out of the PreparedDocument
     */
    public extractContext(): DocumentContext {
        if (!this.handle) {
            throw new Error('Document is already destroyed or extracted');
        }
        if (!this.handle.isReady()) {
            throw new Error('Document in invalid state');
        }
        const context = this.handle.getContext();
        this.handle = null;
        return context;
    }

    /**
     * @returns true if the document is prepared and not extracted
     */
    public isReady(): boolean {
        return !!this.handle && this.handle.isReady();
    }

    /**
     * @returns the DocumentHandle to the DocumentContext inside the PreparedDocument
     */
    public getHandle(): DocumentHandle {
        if (!this.handle) {
            throw new Error('Document is already destroyed or extracted');
        }
        return this.handle;
    }
}
