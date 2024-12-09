/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IConfigurationChangeOptions } from 'apl-html';
import { DocumentContext } from '../../document/DocumentContext';

export class SavedDocument {
    private storedConfigurationChange: IConfigurationChangeOptions | null;

    public static create(context: DocumentContext, id: string): SavedDocument {
        return new SavedDocument(context, id);
    }

    private constructor(private context: DocumentContext, private id: string) {
        this.context = context;
    }

    public restore(): DocumentContext {
        if (this.storedConfigurationChange) {
            this.context.configurationChange(this.storedConfigurationChange);
            this.storedConfigurationChange = null;
        }
        return this.context;
    }

    public destroy(): void {
        this.context.destroy();
    }

    public getId(): string {
        return this.id;
    }

    public storeConfigurationChange(configChange: IConfigurationChangeOptions) {
        this.storedConfigurationChange = { ...this.storedConfigurationChange, ...configChange };
    }
}
