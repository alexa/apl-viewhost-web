/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Event } from './Event';

/**
 * @ignore
 */
export class ReInflate extends Event {
    public async execute() {
        await this.renderer.loadPackages();
        this.renderer.destroyRenderingComponents();
        await this.renderer.context.reInflate();
        this.renderer.reRenderComponents();
        this.event.resolve();
        this.destroy();
    }
}
