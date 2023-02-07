/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { AudioTrack } from '../enums/AudioTrack';
import { MediaPlayerEventType } from '../enums/MediaPlayerEventType';
import { TrackState } from '../enums/TrackState';
import { VideoScale } from '../enums/VideoScale';
import { ILogger } from '../logging/ILogger';
import { LoggerFactory } from '../logging/LoggerFactory';
import { IMediaEventListener } from './IMediaEventListener';
import { IMediaPlayerHandle } from './IMediaPlayerHandle';
import { IVideoPlayer } from './IVideoPlayer';
import { MediaErrorCode } from './MediaErrorCode';
import { MediaPlayerHandle } from './MediaPlayerHandle';
import { MediaState } from './MediaState';
import { IMediaResource, PlaybackManager } from './PlaybackManager';
import { PlaybackState } from './Resource';
import { PlaybackFailure, VideoPlayer } from './video';

export interface MediaEventProcessorArgs {
    mediaPlayerHandle: IMediaPlayerHandle;
    logger?: ILogger;
}

export type PromiseCallback = (value?: any) => void;

export function createMediaEventProcessor(mediaEventProcessorArgs: MediaEventProcessorArgs): any {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('Video')
    };
    mediaEventProcessorArgs = Object.assign(defaultArgs, mediaEventProcessorArgs);
    const {
        mediaPlayerHandle,
        logger
    } = mediaEventProcessorArgs;

    // Private Variables
    let videoState: PlaybackState = PlaybackState.IDLE;

    // Private Functions
    async function ensureLoaded(fromEvent: boolean, isSettingSource: boolean = false) {
        const currentMediaResource = this.playbackManager.getCurrent();
        if (!currentMediaResource.loaded) {
            await this.player.load(currentMediaResource.id, currentMediaResource.url);
            currentMediaResource.loaded = true;
            this.player.loadTextTracks(currentMediaResource.textTracks);
        } else {
            this.updateMediaState(fromEvent, isSettingSource);
        }
    }

    // Public Interface
    const mediaEventProcessor = {
        isPlaying(): boolean {
            return !(this.currentMediaState.paused || this.currentMediaState.ended);
        },
        onVideoPlayerReady() {
            if (!this.loaded) {
                logger.info('First loaded, refresh video');
                this.setTrackIndex({trackIndex: 0, fromEvent: false});
                this.rewind({fromEvent: false});
                this.loaded = true;
            }
            if (this.shouldStartPlayAfterPlayerInit) {
                logger.info('Player ready, starting playback');
                this.play({
                    waitForFinish: false,
                    fromEvent: false,
                    isSettingSource: false
                });
            }
        },
        onEvent({
            event,
            fromEvent,
            isSettingSource,
            aplMediaPlayer
        }): void {
            let mediaPlayerEventType: MediaPlayerEventType;

            switch (event) {
                case PlaybackState.IDLE:
                    this.currentMediaState.withTrackState(TrackState.kTrackNotReady);
                    this.currentMediaState.withErrorCode(MediaErrorCode.DEFAULT);
                    break;
                case PlaybackState.LOADED:
                    this.currentMediaState.withTrackState(TrackState.kTrackReady);
                    mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventTrackReady;
                    break;
                case PlaybackState.PLAYING:
                    if (this.isPlaying()) {
                        mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventTimeUpdate;
                    } else {
                        mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventPlay;
                    }
                    this.currentMediaState.ended = false;
                    this.currentMediaState.paused = false;
                    break;
                case PlaybackState.PAUSED:
                    this.currentMediaState.paused = true;
                    mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventPause;
                    break;
                case PlaybackState.ENDED:
                    if (this.playbackManager.repeat()) {
                        this.delegate.rewind().then(() => {
                            this.delegate.play(false);
                        });
                        mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventTimeUpdate;
                    } else if (this.playbackManager.hasNext()) {
                        this.delegate.next().then(() => {
                            this.delegate.play(false);
                        });
                        isSettingSource = true;
                        mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventTrackUpdate;
                    } else {
                        this.currentMediaState.ended = true;
                        this.currentMediaState.paused = true;
                        mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventEnd;
                    }
                    break;
                case PlaybackState.ERROR:
                    logger.error('Playback error.');
                    isSettingSource = false;
                    this.currentMediaState.ended = true;
                    this.currentMediaState.paused = true;
                    this.currentMediaState.withTrackState(TrackState.kTrackFailed);
                    this.currentMediaState.withErrorCode(MediaErrorCode.GENERIC);
                    mediaPlayerEventType = MediaPlayerEventType.kMediaPlayerEventTrackFail;
                    break;
                case PlaybackState.BUFFERING:
                default:
                    return;
            }

            videoState = event;

            if (typeof mediaPlayerEventType !== 'undefined') {
                this.updateMediaState(fromEvent, isSettingSource);
                aplMediaPlayer.updateMediaState(this.currentMediaState);
                aplMediaPlayer.doCallback(mediaPlayerEventType);
            }
        },
        // Playback Control Methods
        // Event-Aware Methods
        async play({ waitForFinish, fromEvent, isSettingSource }): Promise<any> {
            // Adjust Audio
            if (this.audioTrack === AudioTrack.kAudioTrackNone || this.muted) {
                this.muted = true;
                this.player.mute();
            } else {
                this.player.unmute();
            }

            await ensureLoaded.call(this, fromEvent, isSettingSource);

            const currentMediaResource = this.playbackManager.getCurrent();

            let startingPoint = toMillisecondsFromSeconds(this.player.getCurrentPlaybackPositionInSeconds());
            if (startingPoint < currentMediaResource.offset) {
                startingPoint = currentMediaResource.offset;
                this.player.setCurrentTimeInSeconds(toSecondsFromMilliseconds(startingPoint));
            }

            await this.player.play(
                currentMediaResource.id,
                currentMediaResource.url,
                startingPoint
            ).then(
                () => {
                    this.loaded = true;
                },
                (reason) => {
                    if (reason === PlaybackFailure.UNINITIALIZED) {
                        this.shouldStartPlayAfterPlayerInit = true;
                        logger.info('Player not ready, deferring playback');
                    }
                }
            );
        },
        async pause(): Promise<any> {
            if (videoState === PlaybackState.PLAYING || videoState === PlaybackState.BUFFERING) {
                await this.player.pause();
            }
        },
        async stop(): Promise<any> {
            await this.player.end();
            const currentMediaResource = this.playbackManager.getCurrent();
            const endTimeMs = this.currentMediaState.duration + currentMediaResource.offset;
            if (this.currentMediaState.currentTime > this.currentMediaState.duration) {
                this.player.setCurrentTimeInSeconds(toSecondsFromMilliseconds(endTimeMs));
            }
        },
        async seek({ seekOffset, fromEvent }): Promise<any> {
            await ensureLoaded.call(this, fromEvent);
            const mediaResource: IMediaResource = this.playbackManager.getCurrent();
            const mediaOffsetMs: number = mediaResource.offset;
            const currentPlaybackPositionMs: number = toMillisecondsFromSeconds(
                this.player.getCurrentPlaybackPositionInSeconds()
            );
            const desiredPlaybackPositionMs: number = currentPlaybackPositionMs + seekOffset;
            const videoDurationMs = toMillisecondsFromSeconds(this.player.getDurationInSeconds());
            const isNonDefaultDuration: boolean = mediaResource.duration > 0;
            const isCurrentPositionOutOfBounds: boolean =
                videoDurationMs <= desiredPlaybackPositionMs;

            if (isCurrentPositionOutOfBounds) {
                // minus unit time otherwise will rollover to start
                if (isNonDefaultDuration) {
                    this.player.setCurrentTimeInSeconds(mediaOffsetMs +
                        toSecondsFromMilliseconds(mediaResource.duration) - 0.001);
                } else {
                    this.player.setCurrentTimeInSeconds(toSecondsFromMilliseconds(videoDurationMs) - 0.001);
                }
            } else if (desiredPlaybackPositionMs < mediaOffsetMs) {
                this.player.setCurrentTimeInSeconds(toSecondsFromMilliseconds(mediaOffsetMs));
            } else {
                this.player.setCurrentTimeInSeconds(toSecondsFromMilliseconds(desiredPlaybackPositionMs));
            }

            this.updateMediaState(fromEvent);
        },
        async rewind({ fromEvent }): Promise<any> {
            if (fromEvent) {
                await this.pause();
            }
            const currentMediaResource = this.playbackManager.getCurrent();
            this.player.setCurrentTimeInSeconds(
                toSecondsFromMilliseconds(currentMediaResource.offset)
            );
        },
        async previous({ fromEvent }): Promise<any> {
            if (!this.playbackManager.hasPrevious()) {
                await this.delegate.rewind(fromEvent);
            } else {
                if (fromEvent) {
                    await this.pause();
                }
                this.playbackManager.previous();
            }
            await ensureLoaded.call(this, fromEvent);
        },
        async next({ fromEvent }): Promise<any> {
            if (fromEvent) {
                await this.pause();
            }
            if (!this.playbackManager.hasNext()) {
                this.player.setCurrentTimeInSeconds(this.player.getDurationInSeconds() - 0.001);
            } else {
                this.playbackManager.next();
                await ensureLoaded.call(this, fromEvent);
            }
        },
        async setTrackIndex({ trackIndex, fromEvent }): Promise<any> {
            if (fromEvent) {
                await this.pause();
            }
            this.playbackManager.setCurrent(trackIndex);
            this.updateMediaState(fromEvent, true);
            await ensureLoaded.call(this, fromEvent);
        },
        // End Event-Aware Methods
        setAudioTrack({ audioTrack }) {
            this.audioTrack = audioTrack;
        },
        setMuted({ muted, fromEvent }) {
            if (this.audioTrack !== AudioTrack.kAudioTrackNone) {
                this.muted = muted;

                if (this.muted) {
                    this.player.mute();
                } else {
                    this.player.unmute();
                }
                this.updateMediaState(fromEvent);
            }
        },
        async setTrackList({ trackArray }): Promise<any> {
            // Configure Player and Playback
            this.playbackManager.setup(trackArray);
            await ensureLoaded.call(this);
        },
        onTimeUpdated({ aplMediaPlayer }) {
            if (!isValidPlayer(this.player)) {
                return;
            }
            if (!this.isPlaying()) {
                return;
            }
            this.updateMediaState(false);
            aplMediaPlayer.updateMediaState(this.currentMediaState);
            aplMediaPlayer.doCallback(MediaPlayerEventType.kMediaPlayerEventTimeUpdate);
        },
        updateMediaState(fromEvent: boolean, isSettingSource: boolean = false) {
            if (!isValidPlayer(this.player)) {
                return;
            }

            let offsetMs: number = 0;
            let mediaResourceDurationMs = 0;
            try {
                const mediaResource = playBackManager.getCurrent();
                mediaResourceDurationMs = mediaResource.duration;
                offsetMs = mediaResource.offset;
            } catch (error) {
                logger.warn('Can not get current media resource', error);
            }

            this.currentMediaState.currentTime = toMillisecondsFromSeconds(
                this.player.getCurrentPlaybackPositionInSeconds()
            ) - offsetMs;
            this.currentMediaState.duration = toMillisecondsFromSeconds(
                this.player.getDurationInSeconds()
            );

            const isNonDefaultDuration: boolean = mediaResourceDurationMs > 0;
            if (isNonDefaultDuration) {
                if (mediaResourceDurationMs > this.currentMediaState.duration - offsetMs) {
                    this.currentMediaState.duration = this.currentMediaState.duration - offsetMs;
                } else {
                    this.currentMediaState.duration = mediaResourceDurationMs;
                }
                if (this.currentMediaState.currentTime > this.currentMediaState.duration) {
                    if (!isSettingSource) {
                        this.stop();
                    }
                }
            } else {
                this.currentMediaState.duration -= offsetMs;
            }

            this.currentMediaState.trackCount = this.playbackManager.getTrackCount();
            this.currentMediaState.trackIndex = this.playbackManager.getCurrentIndex();
            this.currentMediaState.muted = this.muted;

            ensureValidMediaState(this.currentMediaState);
        },
        // Component Methods
        setScale({ videoComponent, scale }) {
            let scaleType: 'contain' | 'cover' = 'contain';
            switch (scale) {
                case VideoScale.kVideoScaleBestFit:
                    scaleType = 'contain';
                    break;
                case VideoScale.kVideoScaleBestFill:
                    scaleType = 'cover';
                    break;
                default:
                    logger.warn('Incorrect VideoScale type');
                    break;
            }
            this.player.configure(videoComponent, scaleType);
        },
        applyCssShadow({ shadowParams }) {
            if (this.player) {
                this.player.applyCssShadow(shadowParams);
            }
        },
        destroy() {
            // Save state before destroying media
            const fromEvent = false;
            this.updateMediaState(fromEvent);
            this.player.destroy();
        },
        // Getters / Setters
        set fromEvent(isFromEvent: boolean) {
            this.delegate['fromEvent'] = isFromEvent;
        },
        get fromEvent() {
            return this.delegate['fromEvent'];
        },
        set isSettingSource(settingSource: boolean) {
            this.delegate['isSettingSource'] = settingSource;
        },
        get delegate(): any {
            return Object.getPrototypeOf(this);
        }
    };

    // Visible Properties
    const videoPlayer = VideoPlayer({
        eventListener: mediaPlayerHandle as IMediaEventListener,
        logger
    });
    videoPlayer.init();
    const playBackManager = new PlaybackManager();
    const currentMediaState = new MediaState();

    Object.defineProperties(mediaEventProcessor, {
        player: {
            value: videoPlayer,
            writable: false,
            configurable: false
        },
        playbackManager: {
            value: playBackManager,
            writable: false,
            configurable: false
        },
        audioTrack: {
            value: undefined as AudioTrack,
            writable: true,
            configurable: false
        },
        currentMediaState: {
            value: currentMediaState,
            writable: false,
            configurable: true
        }
    });

    return Object.setPrototypeOf(mediaEventProcessor, mediaPlayerHandle) as MediaPlayerHandle;
}

function toSecondsFromMilliseconds(milliseconds: number) {
    return milliseconds / 1000;
}

function toMillisecondsFromSeconds(seconds: number) {
    return seconds * 1000;
}

function isValidPlayer(player: any): player is IVideoPlayer {
    return player !== undefined;
}

function ensureValidMediaState(mediaState: any): mediaState is APL.IMediaState {
    const keysToClean = ['currentTime', 'currentTime', 'trackCount', 'trackIndex', 'duration'];

    for (const key of keysToClean) {
        if (mediaState.hasOwnProperty(key) && !isValidMediaStateValue(mediaState[key])) {
            mediaState[key] = 0;
        }
    }
    return mediaState;
}

function isValidMediaStateValue(n: any): n is number {
    return !Number.isNaN(n) && n !== undefined;
}
