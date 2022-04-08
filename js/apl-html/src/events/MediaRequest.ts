/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventProperty } from '../enums/EventProperty';
import { parseHeaders } from '../media/IURLRequest';
import { requestMedia } from '../utils/MediaRequestUtils';
import { Event } from './Event';

/**
 * @ignore
 */
export class MediaRequest extends Event {
    public async execute() {
        const mediaType = this.event.getValue<number>(EventProperty.kEventPropertyMediaType);
        const sources = this.event.getValue<string[]>(EventProperty.kEventPropertySource);
        const eventHeaders: string[][] = this.event.getValue(EventProperty.kEventPropertyHeaders);
        const headers = eventHeaders.map((value, index, array) => parseHeaders(value));
        const requestMediaArgs = {
            renderer: this.renderer
        };
        await requestMedia(mediaType, sources, headers, requestMediaArgs);
        this.resolve();
        this.destroy();
    }
}
