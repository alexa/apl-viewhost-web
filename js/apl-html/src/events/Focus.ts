/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { Event } from './Event';
import { Component } from '../components/Component';

/**
 * @ignore
 */
export class Focus extends Event {
    public async execute() {
        const component = this.event.getComponent();
        if (component) {
            const viewhostComponent = this.renderer.componentMap[component.getUniqueId()] as Component;
            viewhostComponent.container.focus();
        } else {
            (document.activeElement as HTMLElement).blur();
        }

        this.event.resolve();
    }
}
