/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../../APLRenderer';
import {AudioTrack} from '../../enums/AudioTrack';
import {CommandControlMedia} from '../../enums/CommandControlMedia';
import {VideoScale} from '../../enums/VideoScale';
import {ILogger} from '../../logging/ILogger';
import {LoggerFactory} from '../../logging/LoggerFactory';
import {IMediaSource} from '../../media/IMediaSource';
import {PlaybackState} from '../../media/Resource';
import {Component, FactoryFunction} from '../Component';
import {AbstractVideoComponent} from './AbstractVideoComponent';
import {createVideoEventProcessor} from './VideoEventProcessor';
import {createVideoEventSequencer, VideoEventSequencer, VideoInterface} from './VideoEventSequencer';

const logger: ILogger = LoggerFactory.getLogger('Video');

// Shell Interface to Core
// If a command gets invoked externally, put in the queue and tell the sequencer to process
export class Video extends AbstractVideoComponent {
    private readonly videoEventProcessor: any;
    private readonly videoEventSequencer: VideoEventSequencer;
    private fromEvent: boolean = false;
    private isSettingSource: boolean = false;

    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
        this.videoEventProcessor = createVideoEventProcessor({
            videoComponent: this,
            logger
        });
        this.videoEventSequencer = createVideoEventSequencer({
            videoEventProcessor: this.videoEventProcessor,
            logger
        });
    }

    public onEvent(event: PlaybackState): void {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.ON_EVENT, {
            event,
            fromEvent: this.fromEvent,
            isSettingSource: this.isSettingSource
        });
    }

    // Event Methods
    public async playMedia(source: IMediaSource | IMediaSource[], audioTrack: AudioTrack) {
        await this.videoEventSequencer.processExclusively(VideoInterface.PLAY_MEDIA, {
            source,
            audioTrack
        });
    }

    public async controlMedia(operation: CommandControlMedia, optionalValue: number) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.CONTROL_MEDIA, {
            operation,
            optionalValue
        });
    }

    // Playback Control Methods
    public async play(waitForFinish?: boolean): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.PLAY, {
            waitForFinish,
            fromEvent: this.fromEvent,
            isSettingSource: this.isSettingSource
        });
    }

    public async pause(): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.PAUSE, {
            fromEvent: this.fromEvent
        });
    }

    public async end(): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.END, {
            fromEvent: this.fromEvent
        });
    }

    public async seek(offset: number): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SEEK, {
            seekOffset: offset,
            fromEvent: this.fromEvent
        });
    }

    public async rewind(): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.REWIND, {
            fromEvent: this.fromEvent
        });
    }

    public async previous(): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.PREVIOUS, {
            fromEvent: this.fromEvent
        });
    }

    public async next(): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.NEXT, {
            fromEvent: this.fromEvent
        });
    }

    public async setTrack(trackIndex: number): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_TRACK, {
            trackIndex,
            fromEvent: this.fromEvent
        });
    }

    protected setAudioTrack(audioTrack: AudioTrack) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_AUDIO_TRACK, {
            audioTrack
        });
    }

    protected setMuted(muted: boolean) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_MUTED, {
            muted,
            fromEvent: this.fromEvent
        });
    }

    protected async setSource(source: IMediaSource | IMediaSource[]): Promise<any> {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_SOURCE, {
            source
        });
    }

    protected setTrackCurrentTime(trackCurrentTime: number) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_TRACK_CURRENT_TIME, {
            trackCurrentTime
        });
    }

    protected setTrackIndex(trackIndex: number) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_TRACK_INDEX, {
            trackIndex
        });
    }

    protected setScale(scale: VideoScale) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_SCALE, {
            scale
        });
    }

    protected setTrackPaused(isPaused: boolean) {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.SET_TRACK_PAUSED, {
            shouldBePaused: isPaused
        });
    }

    // Video Component Methods
    protected updateMediaState() {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.UPDATE_MEDIA_STATE, {
            fromEvent: this.fromEvent,
            isSettingSource: this.isSettingSource
        });
    }

    public destroy() {
        logger.info('#destroy');
        super.destroy();
        this.videoEventSequencer.destroy();
        this.videoEventProcessor.destroy();
    }

    // Component Methods
    protected applyCssShadow = (shadowParams: string) => {
        this.videoEventSequencer.enqueueForProcessing(VideoInterface.APPLY_CSS_SHADOW, {
            shadowParams
        });
    }

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
