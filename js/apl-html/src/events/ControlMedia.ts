/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Video } from '../components/video/Video';
import { CommandControlMedia } from '../enums/CommandControlMedia';
import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class ControlMedia extends Event {

    public async execute() {
        const componentId = this.event.getComponent().getUniqueId();
        const optionalValue = this.event.getValue<number>(EventProperty.kEventPropertyValue);
        const command = this.event.getValue<CommandControlMedia>(EventProperty.kEventPropertyCommand);
        if (!this.renderer.componentMap[componentId]) {
            this.logger.error(`Could not ControlMedia. Cannot find Component with id ${componentId}`);
            this.resolve();
            return;
        }
        const video = this.renderer.componentMap[componentId] as Video;
        if (!this.isTerminated) {
            await video.controlMedia(command, optionalValue);
        }

        if (!this.isTerminated) {
            this.resolve();
        }
        this.destroy();
    }
}
