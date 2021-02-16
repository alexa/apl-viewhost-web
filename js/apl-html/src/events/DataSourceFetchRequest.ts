/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class DataSourceFetchRequest extends Event {

    public async execute() {
        const type = this.event.getValue<string>(EventProperty.kEventPropertyName);
        const payload = this.event.getValue<any>(EventProperty.kEventPropertyValue);
        this.renderer.onDataSourceFetchRequest({type, payload});
        this.resolve();
        this.destroy();
    }

}
