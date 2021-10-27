/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class ExtensionEvent extends Event {
    public async execute() {
        const uri = this.event.getValue<string>(EventProperty.kEventPropertyExtensionURI);
        const name = this.event.getValue<string>(EventProperty.kEventPropertyName);
        const source = this.event.getValue<object>(EventProperty.kEventPropertySource);
        const params = this.event.getValue<object>(EventProperty.kEventPropertyExtension);

        const result = await this.renderer.onExtensionEvent({uri, event : this.event, name, source, params});
        if (!result) {
            this.event.resolveWithArg(1);
        } else {
            this.event.resolve();
        }
    }
}
