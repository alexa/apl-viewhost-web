/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class SendEvent extends Event {

    public async execute() {
        const args = this.event.getValue<string[]>(EventProperty.kEventPropertyArguments);
        const components = this.event.getValue<any[]>(EventProperty.kEventPropertyComponents);
        const source = this.event.getValue<any>(EventProperty.kEventPropertySource);
        this.renderer.onSendEvent({source, arguments: args, components});
        this.resolve();
        this.destroy();
    }
}
