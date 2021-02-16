/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { Event } from './Event';

/**
 * @ignore
 */
export class Finish extends Event {
    public async execute() {
        this.renderer.onFinish();
        await this.renderer.stopUpdate();
        this.renderer.destroy();
        if (!this.isTerminated) {
            this.resolve();
        }
        this.destroy();
    }
}
