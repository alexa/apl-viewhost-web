/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Video } from '../components/video/Video';
import { AudioTrack } from '../enums/AudioTrack';
import { IMediaEventListener } from './IMediaEventListener';
import { IMediaPlayerHandle } from './IMediaPlayerHandle';
import { createMediaEventProcessor } from './MediaEventProcessor';
import { createMediaEventSequencer, MediaEventSequencer, VideoInterface } from './MediaEventSequencer';
import { PlaybackState } from './Resource';

export class MediaPlayerHandle implements IMediaPlayerHandle, IMediaEventListener {
    private readonly eventProcessor: any;
    private readonly eventSequencer: MediaEventSequencer;
    private readonly mediaPlayer: APL.MediaPlayer;
    private videoComponent: Video;
    private playWhenLoaded: boolean;
    private waitForFinishOnInit: boolean;
    private lastPlaybackState: PlaybackState;

    constructor(aplMediaPlayer: APL.MediaPlayer) {
        this.mediaPlayer = aplMediaPlayer;
        this.eventProcessor = createMediaEventProcessor({mediaPlayerHandle: this});
        this.eventSequencer = createMediaEventSequencer({mediaEventProcessor: this.eventProcessor});
    }

    public destroy(): void {
        this.mediaPlayer.delete();
        this.eventSequencer.destroy();
        this.eventProcessor.destroy();
    }

    public setVideoComponent(video: Video) {
        this.videoComponent = video;
        setTimeout(() => {
            if (this.lastPlaybackState) {
                this.videoComponent.onEvent(this.lastPlaybackState);
            }
            if (this.playWhenLoaded) {
                this.play(this.waitForFinishOnInit);
            }
        }, 0);
    }

    public getProcessor(): any {
        return this.eventProcessor;
    }

    public getSequencer(): any {
        return this.eventSequencer;
    }

    public setTrackList(trackArray: Array<{url: string, offset: number, duration: number, repeatCount: number}>): void {
        this.eventSequencer.enqueueForProcessing(VideoInterface.SET_TRACK_LIST, {
            trackArray
        });
    }

    public async setTrackIndex(index: number): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.SET_TRACK_INDEX, {
            trackIndex: index,
            fromEvent: true
        });
    }

    public async seek(offset: number): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.SEEK, {
            seekOffset: offset,
            fromEvent: true
        });
    }

    public async play(waitForFinish: boolean): Promise<any> {
        // Route through video component so can be override
        if (!this.videoComponent) {
            this.playWhenLoaded = true;
            this.waitForFinishOnInit = waitForFinish;
            return;
        }
        this.videoComponent.play(waitForFinish);
    }

    public async pause(): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.PAUSE, {
            fromEvent: true
        });
    }

    public async stop(): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.STOP, {
            fromEvent: true
        });
    }

    public async next(): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.NEXT, {
            fromEvent: true
        });
    }

    public async previous(): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.PREVIOUS, {
            fromEvent: true
        });
    }

    public async rewind(): Promise<any> {
        this.eventSequencer.enqueueForProcessing(VideoInterface.REWIND, {
            fromEvent: true
        });
    }

    public setAudioTrack(audioTrack: AudioTrack): void {
        this.eventSequencer.enqueueForProcessing(VideoInterface.SET_AUDIO_TRACK, {
            audioTrack
        });
    }

    public setMute(muted: boolean): void {
        this.eventSequencer.enqueueForProcessing(VideoInterface.SET_MUTED, {
            muted,
            fromEvent: true
        });
    }

    public onEvent(event: PlaybackState): void {
        this.eventProcessor.onEvent({
            event,
            fromEvent: false,
            isSettingSource: false,
            aplMediaPlayer: this.mediaPlayer
        });
        if (this.videoComponent) {
            this.videoComponent.onEvent(event);
        } else {
            this.lastPlaybackState = event;
        }
    }

    public onPlayerReady(): void {
        this.eventProcessor.onVideoPlayerReady();
    }

    /*
     * Previously Exposed Properties
     *
     * Ideally we wouldn't expose these, but they were previously exposed and developers have already taken a dependency
     * on these properties in their implementations
     */

    protected get player() {
        return this.eventProcessor.player;
    }

    protected get audioTrack() {
        return this.eventProcessor.audioTrack;
    }

    protected get playbackManager() {
        return this.eventProcessor.playbackManager;
    }

    protected get currentMediaResource() {
        return this.eventProcessor.playbackManager.getCurrent();
    }

    protected get currentMediaState() {
        return this.eventProcessor.currentMediaState;
    }
}
