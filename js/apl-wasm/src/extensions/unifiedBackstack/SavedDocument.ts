/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentContext } from '../../document/DocumentContext';

export class SavedDocument {
    public static create(context: DocumentContext, id: string): SavedDocument {
        return new SavedDocument(context, id);
    }

    private constructor(private context: DocumentContext, private id: string) {
        this.context = context;
    }

    public restore(): DocumentContext {
        return this.context;
    }

    public destroy(): void {
        this.context.destroy();
    }

    public getId(): string {
        return this.id;
    }
}
