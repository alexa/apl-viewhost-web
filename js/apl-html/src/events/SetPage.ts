/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { PagerComponent } from '../components/pager/PagerComponent';
import {CommandPosition} from '../enums/CommandPosition';
import {EventProperty} from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class SetPage extends Event {

    public async execute() {
        const componentId = this.event.getComponent().getUniqueId();

        const position = this.event.getValue<CommandPosition>(EventProperty.kEventPropertyPosition);
        if (!this.renderer.componentMap[componentId]) {
            this.logger.error(`Could not SetPage. Cannot find Pager with id ${componentId}`);
            this.resolve();
            return;
        }
        const pager = this.renderer.componentMap[componentId] as PagerComponent;
        await pager.setPage(position);

        if (!this.isTerminated) {
            this.resolve();
        }
        this.destroy();
    }
}
