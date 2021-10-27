/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Video } from '../components/video/Video';
import { AudioTrack } from '../enums/AudioTrack';
import { CommandAudioTrack } from '../enums/CommandAudioTrack';
import { EventProperty } from '../enums/EventProperty';
import { IMediaSource } from '../media/IMediaSource';
import { Event } from './Event';

/**
 * @ignore
 */
export class PlayMedia extends Event {

    public async execute() {
        const componentId = this.event.getComponent().getUniqueId();
        const audioTrack = this.event.getValue<CommandAudioTrack>(EventProperty.kEventPropertyAudioTrack);
        const source = this.event.getValue<IMediaSource | IMediaSource[]>(EventProperty.kEventPropertySource);
        if (!this.renderer.componentMap[componentId]) {
            this.resolve();
            return;
        }
        const video = this.renderer.componentMap[componentId] as Video;
        if (!this.isTerminated) {
            await video.playMedia(source, this.convertAudioTrack(audioTrack));
        }

        if (!this.isTerminated) {
            this.resolve();
        }
        this.destroy();
    }

    private convertAudioTrack(cat: CommandAudioTrack): AudioTrack {
        switch (cat) {
            case CommandAudioTrack.kCommandAudioTrackForeground:
                return AudioTrack.kAudioTrackForeground;
            case CommandAudioTrack.kCommandAudioTrackBackground:
                return AudioTrack.kAudioTrackBackground;
            case CommandAudioTrack.kCommandAudioTrackNone:
                return AudioTrack.kAudioTrackNone;
            default:
                this.logger.warn('Incorrect CommandAudioTrack type');
                return AudioTrack.kAudioTrackNone;
        }
    }
}
