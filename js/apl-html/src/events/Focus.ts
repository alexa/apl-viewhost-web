/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventProperty} from '..';
import {ActionableComponent} from '../components/ActionableComponent';
import {Event} from './Event';

/**
 * @ignore
 */
export class Focus extends Event {
    public async execute() {
        const component = this.event.getComponent();
        if (component) {
            const viewhostComponent = this.renderer.componentMap[component.getUniqueId()] as ActionableComponent;
            if (!viewhostComponent || !viewhostComponent.focus) {
                this.event.resolve();
                return;
            }
            viewhostComponent.focus();
            this.event.resolve();
        } else {
            if (this.event.getValue(EventProperty.kEventPropertyDirection)) {
                this.event.resolve();
            } else {
                (document.activeElement as HTMLElement).blur();
                this.event.resolveWithArg(1);
            }
        }
    }
}
