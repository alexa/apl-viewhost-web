/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {EventProperty} from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class OpenUrl extends Event {

    public async execute() {
        const source = this.event.getValue<string>(EventProperty.kEventPropertySource);
        const supported = await this.renderer.onOpenUrl(source);
        if (!supported) {
            this.event.resolveWithArg(1);
        } else {
            this.event.resolve();
        }
    }
}
