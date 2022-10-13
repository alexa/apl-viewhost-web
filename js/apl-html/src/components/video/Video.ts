/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../../APLRenderer';
import {VideoScale} from '../../enums/VideoScale';
import {ILogger} from '../../logging/ILogger';
import {LoggerFactory} from '../../logging/LoggerFactory';
import {IMediaPlayerHandle} from '../../media/IMediaPlayerHandle';
import {VideoInterface} from '../../media/MediaEventSequencer';
import {PlaybackState} from '../../media/Resource';
import {Component, FactoryFunction} from '../Component';
import {AbstractVideoComponent} from './AbstractVideoComponent';

const logger: ILogger = LoggerFactory.getLogger('Video');

// Shell Interface to Core
// If a command gets invoked externally, put in the queue and tell the sequencer to process
export class Video extends AbstractVideoComponent {
    private readonly videoEventProcessor: any;
    private mediaPlayerHandle: IMediaPlayerHandle;

    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);

        this.mediaPlayerHandle = component.getMediaPlayer().getMediaPlayerHandle();
        if (this.mediaPlayerHandle) {
            this.videoEventProcessor = this.mediaPlayerHandle.getProcessor();
            this.mediaPlayerHandle.setVideoComponent(this);
        }
    }

    // Component Methods
    protected applyCssShadow = (shadowParams: string) => {
        this.videoEventProcessor.applyCssShadow({
            shadowParams
        });
    }

    protected setScale(scale: VideoScale) {
        this.mediaPlayerHandle.getSequencer().enqueueForProcessing(VideoInterface.SET_SCALE, {
            videoComponent: this.container,
            scale
        });
    }

    public destroy() {
        logger.info('#destroy');
        super.destroy();
    }

    public async play(waitForFinish?: boolean): Promise<void> {
        this.mediaPlayerHandle.getSequencer().enqueueForProcessing(VideoInterface.PLAY, {
            waitForFinish,
            fromEvent: true,
            isSettingSource: false
        });
    }

    public async pause(): Promise<void> {
        this.mediaPlayerHandle.pause();
    }

    public onEvent(_event: PlaybackState): void {}

    /*
     * Previously Exposed Properties
     *
     * Ideally we wouldn't expose these, but they were previously exposed and developers have already taken a dependency
     * on these properties in their implementations
     */

    protected get player() {
        return this.videoEventProcessor.player;
    }

    protected get audioTrack() {
        return this.videoEventProcessor.audioTrack;
    }

    protected get playbackManager() {
        return this.videoEventProcessor.playbackManager;
    }

    protected get currentMediaResource() {
        return this.videoEventProcessor.playbackManager.getCurrent();
    }

    protected get currentMediaState() {
        return this.videoEventProcessor.currentMediaState;
    }
}
