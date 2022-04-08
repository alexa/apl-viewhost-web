/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { LoggerFactory } from './logging/LoggerFactory';
import { AudioPlayer, AudioPlayerFactory } from './media/audio/AudioPlayer';
import { DefaultAudioPlayer } from './media/audio/DefaultAudioPlayer';
import { IAudioEventListener } from './media/audio/IAudioEventListener';
import { IBaseMarker } from './media/audio/SpeechMarks';
import { PromiseContainer } from './utils/PromiseUtils';

/**
 * @internal
 */
export interface IPlaybackEventListener {
    onPlaybackStarted();

    onPlaybackFinished();
}

/**
 * @internal
 */
export class AudioPlayerWrapper implements IAudioEventListener {
    protected audioPlayer: AudioPlayer;
    protected latestId: string;
    protected preparePromise: PromiseContainer<void>;
    protected latestMarkers: IBaseMarker[];
    protected audioContext: AudioContext;
    protected playbackEventListener: IPlaybackEventListener;
    protected logger = LoggerFactory.getLogger(AudioPlayerWrapper.name);

    constructor(factory: AudioPlayerFactory) {
        this.audioPlayer = factory ? factory(this) : new DefaultAudioPlayer(this);
    }

    protected reset() {
        this.preparePromise = undefined;
        this.latestId = undefined;
        this.latestMarkers = undefined;
        this.playbackEventListener = undefined;
    }

    public prepareAsync(url: string, decodeMarkers: boolean) {
        if (this.preparePromise) {
            this.logger.warn('prepare already in progress');
            return;
        }
        this.preparePromise = new PromiseContainer();
        this.latestId = this.audioPlayer.prepare(url, decodeMarkers);
    }

    public playLatest(playbackEventListener: IPlaybackEventListener) {
        if (!this.preparePromise) {
            throw new Error('prepareAsync has not been called');
        }
        this.playbackEventListener = playbackEventListener;
        const p = this.preparePromise.promise;
        p.then(() => {
            this.audioPlayer.play(this.latestId);
        }).catch((reason?: any) => {
            this.onPlaybackFinished(this.latestId);
        });
    }

    public stop() {
        this.audioPlayer.flush();
    }

    public destroy() {
        this.stop();
        this.reset();

        // Clean up audio player
        this.audioPlayer.releaseAudioContext();
        this.audioPlayer = null;

        // Clean up audio context
        if (this.audioContext) {
            this.audioContext.close().then(() => {
                this.audioContext = null;
            });
        }
    }

    public getLatestMarkers(): IBaseMarker[] {
        return this.latestMarkers;
    }

    public onPrepared(id: string): void {
        if (this.latestId === id) {
            this.preparePromise.accept(undefined);
        }
    }

    public onMarker(id: string, markers: IBaseMarker[]): void {
        this.latestMarkers = markers;
    }

    public onPlaybackStarted(id: string): void {
        this.playbackEventListener.onPlaybackStarted();
    }

    public onPlaybackFinished(id: string): void {
        this.playbackEventListener.onPlaybackFinished();
        this.reset();
    }

    public onError(id: string, reason: string): void {
        if (this.preparePromise) {
            this.preparePromise.reject(reason);
        }
    }
}
