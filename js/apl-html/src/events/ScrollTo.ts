/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { Scrollable } from '../components/Scrollable';
import { ComponentType } from '../enums/ComponentType';
import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class ScrollTo extends Event {

    public async execute() {
        const componentId = this.event.getComponent().getUniqueId();
        const position = this.event.getValue<number>(EventProperty.kEventPropertyPosition);
        const scrollable = this.renderer.componentMap[componentId] as Scrollable;

        if (scrollable && (scrollable.component.getType() === ComponentType.kComponentTypeSequence ||
            scrollable.component.getType() === ComponentType.kComponentTypeScrollView)) {
            await scrollable.scrollToPosition(position, 2);
        } else {
            this.logger.error(`Could not Scroll. Cannot find scrollable with id ${componentId}`);
        }

        if (!this.isTerminated) {
            this.resolve();
        }
        this.destroy();
    }
}
