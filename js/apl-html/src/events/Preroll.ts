/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { EventProperty } from '../enums/EventProperty';
import { Event } from './Event';

/**
 * @ignore
 */
export class Preroll extends Event {
    public execute() {
        const speech : string = this.event.getValue(EventProperty.kEventPropertySource);
        if (speech && speech.length > 0) {
            this.renderer.audioPlayer.prepareAsync(speech, true);
        } else {
            this.logger.error(`Event does not have a "source" property with speech`);
        }

        if (!this.isTerminated) {
            this.resolve();
        }
    }

    /**
     * Called when speech has been interrupted playing
     */
    public terminate() {
        this.renderer.audioPlayer.stop();
        super.terminate();
    }
}
