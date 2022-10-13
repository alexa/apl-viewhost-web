/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Component } from '../components/Component';
import { Text } from '../components/text/Text';
import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class LineHighlight extends Event {

    private component: Component | undefined;

    public async execute() {
        const rangeStart = this.event.getValue<number>(EventProperty.kEventPropertyRangeStart);
        const rangeEnd = this.event.getValue<number>(EventProperty.kEventPropertyRangeEnd);

        this.component = this.renderer.componentMap[this.event.getComponent().getUniqueId()];
        if (this.component instanceof Text) {
            if (rangeStart < 0 || rangeEnd < 0) {
                this.component.unhighlight();
                return;
            }

            const lineNumber = this.component.getLineByRange(rangeStart, rangeEnd);
            this.component.highlight(lineNumber);
        }
        this.event.resolve();
    }
}
