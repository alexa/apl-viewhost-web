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
export class RequestLineBounds extends Event {

    private component: Component | undefined;

    public async execute() {
        const rangeStart = this.event.getValue<number>(EventProperty.kEventPropertyRangeStart);
        const rangeEnd = this.event.getValue<number>(EventProperty.kEventPropertyRangeEnd);

        if (rangeStart < 0 || rangeEnd < 0) {
            this.event.resolveWithRect(0, 0, 0, 0);
            return;
        }

        this.component = this.renderer.componentMap[this.event.getComponent().getUniqueId()];
        if (this.component instanceof Text) {
            const lineNumber = this.component.getLineByRange(rangeStart, rangeEnd);
            const line = this.component.getLineRanges()[lineNumber];

            const top = line ? line.top : 0;
            const height = line ? line.height : 0;

            this.event.resolveWithRect(0, top, this.component.bounds.width, height);
        } else if (this.component === undefined) {
            this.event.resolveWithRect(0, 0, 0, 0);
        }
    }
}
