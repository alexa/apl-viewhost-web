/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Event } from './Event';
import { Text } from '../components/text/Text';
import { Component } from '../components/Component';

/**
 * @ignore
 */
export class RequestFirstLineBounds extends Event {

    private component: Component | undefined;

    public async execute() {
        this.component = this.renderer.componentMap[this.event.getComponent().getUniqueId()];
        if (this.component instanceof Text) {
            const range = this.component.getLineRanges();
            const top = (range && range.length > 0) ? range[0].top : 0;
            const height = (range && range.length > 0) ? range[0].height : 0;
            // Highlight first line as this event applicable only to line highlighting.
            this.component.highlight(0);
            this.event.resolveWithRect(top, 0, this.component.bounds.width, height);
        }
    }
}
