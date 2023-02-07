/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearAllTextTracks, loadDynamicTextTrack, TextTrackKind } from '../../utils/TextTrackUtils';
import { IMediaEventListener } from '../IMediaEventListener';
import { ITextTrackSource } from '../IMediaSource';
import { IVideoPlayer } from '../IVideoPlayer';
import { PlaybackState } from '../Resource';
import { EmitBehavior, IPlaybackStateHandler, PlaybackStateHandler } from './PlaybackStateHandler';

export interface PlayerInitializationArgs {
    player: HTMLVideoElement;
    parent: HTMLElement;
    scale: 'contain' | 'cover';
}

export enum PlaybackFailure {
    UNINITIALIZED = 'UNINITIALIZED',
    GENERIC = 'GENERIC'
}

export function createVideoPlayer(eventListener: IMediaEventListener): IVideoPlayer {
    // Private Functions
    function initializePlayer(args: PlayerInitializationArgs) {
        const {
            player,
            parent,
            scale
        } = args;
        parent.appendChild(player);
        Object.assign(player.style, {
            'height': '100%',
            'object-fit': scale,
            'width': '100%'
        });
    }

    function positionRelativeToCurrentTime(time: number): Comparison {
        if (time > this.player.currentTime) {
            return Comparison.GT;
        }
        if (time < this.player.currentTime) {
            return Comparison.LT;
        }
        return Comparison.EQ;
    }

    function updateCurrentTimeTo(time: number): void {
        this.player.currentTime = time / 1000;
    }

    // Video LifeCycle Callbacks
    function attachOnPlayCallback() {
        function onPlayCallback(): void {
            this.playbackStateHandler.transitionToState(PlaybackState.PLAYING);
        }

        this.player.onplay = onPlayCallback.bind(this);
    }

    function attachOnPlayingCallback() {
        function onPlayingCallback(): void {
            this.playbackStateHandler.transitionToState(PlaybackState.PLAYING);
        }

        this.player.onplaying = onPlayingCallback.bind(this);
    }

    function attachOnEndedCallback() {
        function onEndedCallback(): void {
            this.playbackStateHandler.transitionToState(PlaybackState.ENDED);
        }

        this.player.onended = onEndedCallback.bind(this);
    }

    function attachOnPauseCallback() {
        function onPauseCallback() {
            this.playbackStateHandler.transitionToState(PlaybackState.PAUSED, EmitBehavior.AlwaysEmit);
        }

        this.player.onpause = onPauseCallback.bind(this);
    }

    function attachOnErrorCallback() {
        function onErrorCallback() {
            this.playbackStateHandler.transitionToState(PlaybackState.ERROR);
        }
        this.player.onerror = onErrorCallback.bind(this);
    }

    function attachOnLoadedDataCallback() {
        function onLoadedDataCallback() {
            this.playbackStateHandler.transitionToState(PlaybackState.LOADED);
        }

        this.player.onloadeddata = onLoadedDataCallback.bind(this);
    }

    function attachOnTimeUpdateCallback() {
        function onTimeUpdateCallback() {
            const currentPlaybackState = this.playbackStateHandler.currentPlaybackState;
            if (currentPlaybackState === PlaybackState.PLAYING) {
                this.playbackStateHandler.transitionToState(currentPlaybackState, EmitBehavior.AlwaysEmit);
            }
        }

        this.player.ontimeupdate = onTimeUpdateCallback.bind(this);
    }

    // Public Interface
    const videoPlayer: IVideoPlayer = {
        // IVideoPlayer Interface
        init(): void {
            this.playbackStateHandler.transitionToState(PlaybackState.IDLE);
            attachOnPlayCallback.call(this);
            attachOnPlayingCallback.call(this);
            attachOnEndedCallback.call(this);
            attachOnPauseCallback.call(this);
            attachOnErrorCallback.call(this);
            attachOnLoadedDataCallback.call(this);
            attachOnTimeUpdateCallback.call(this);

            this.playerIsInitialized = false;
            this.shouldStartPlayAfterInit = false;
        },
        configure(parent: HTMLElement, scale: 'contain' | 'cover'): void {
            initializePlayer({
                player: this.player,
                parent,
                scale
            });
            this.playerIsInitialized = true;
            this.eventListener.onPlayerReady();
        },
        applyCssShadow(shadowParams: string): void {
            this.player.style.boxShadow = shadowParams;
        },
        setCurrentTimeInSeconds(offsetInSeconds: number): void {
            this.player.currentTime = offsetInSeconds;
        },
        getCurrentPlaybackPositionInSeconds(): number {
            return this.player.currentTime;
        },
        getDurationInSeconds(): number {
            return this.player.duration;
        },
        mute(): void {
            this.player.muted = true;
        },
        unmute(): void {
            this.player.muted = false;
        },
        // IPlayer Interface
        load(id: string, url: string): Promise<void> {
            attachOnLoadedDataCallback.call(this);
            this.player.id = id;
            this.playbackStateHandler.transitionToState(PlaybackState.IDLE);
            this.player.src = url;
            this.player.load();

            return Promise.resolve(undefined);
        },
        loadTextTracks(textTracks: ITextTrackSource[]) {
            clearAllTextTracks(this.player);
            if (textTracks && textTracks.length !== 0) {
                loadDynamicTextTrack(this.player, textTracks[0].url, textTracks[0].kind as TextTrackKind);
            }
        },
        play(id: string, url: string, offset: number): Promise<void> {
            if (!this.playerIsInitialized) {
                return Promise.reject(PlaybackFailure.UNINITIALIZED);
            }
            const playbackIsNotPaused = !this.playbackStateHandler.isState(PlaybackState.PAUSED);
            const offsetIsAhead = positionRelativeToCurrentTime.call(this, offset) === Comparison.GT;
            if (playbackIsNotPaused && offsetIsAhead) {
                updateCurrentTimeTo.call(this, offset);
            }
            return new Promise((resolve, reject) => {
                this.player.play()
                    .then(resolve)
                    .catch(reject);
            });
        },
        pause() {
            this.playbackStateHandler.transitionToState(PlaybackState.PAUSED);
            return this.player.pause();
        },
        end() {
            this.playbackStateHandler.transitionToState(PlaybackState.ENDED);
            return this.player.pause();
        },
        setVolume(volume: number): void {
            this.player.volume = volume;
        },
        flush(): void {
            this.pause();
        },
        getMediaId(): string {
            return this.player.id;
        },
        getMediaState(): PlaybackState {
            return this.playbackStateHandler.currentPlaybackState;
        },
        reset() {
            // Pause any existing playback
            this.player.pause();
            // Empty out the source
            this.player.removeAttribute('src');
            // Reload the player to refresh its state
            this.player.load();
        },
        destroy() {
            this.reset();
            // Remove from DOM
            this.player.remove();
        }
    };

    const videoElement = document.createElement('video');
    const playbackStateHandler = PlaybackStateHandler({
        eventListener,
        initialPlaybackState: PlaybackState.IDLE
    });

    // Object Properties
    return Object.defineProperties(videoPlayer, {
        player: {
            value: videoElement as HTMLVideoElement,
            writable: false,
            configurable: false
        },
        playbackStateHandler: {
            value: playbackStateHandler as IPlaybackStateHandler,
            writable: false,
            configurable: false
        },
        eventListener: {
            value: eventListener as IMediaEventListener,
            writable: false,
            configurable: false
        }
    });
}

// Helper Enums
enum Comparison {
    LT = 'LT',
    GT = 'GT',
    EQ = 'EQ'
}
