/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventProperty } from '../enums/EventProperty';
import { requestMedia } from '../utils/MediaRequestUtils';
import { Event } from './Event';

/**
 * @ignore
 */
export class MediaRequest extends Event {
    public async execute() {
        const mediaType = this.event.getValue<number>(EventProperty.kEventPropertyMediaType);
        const source = this.event.getValue<string[]>(EventProperty.kEventPropertySource);

        const requestMediaArgs = {
            renderer: this.renderer
        };
        await requestMedia(mediaType, source, requestMediaArgs);
        this.resolve();
        this.destroy();
    }
}
