/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {AudioTrack} from '../../enums/AudioTrack';
import {CommandControlMedia} from '../../enums/CommandControlMedia';
import {PropertyKey} from '../../enums/PropertyKey';
import {TrackState} from '../../enums/TrackState';
import {VideoScale} from '../../enums/VideoScale';
import {ILogger} from '../../logging/ILogger';
import {LoggerFactory} from '../../logging/LoggerFactory';
import {IMediaEventListener} from '../../media/IMediaEventListener';
import {IVideoPlayer} from '../../media/IVideoPlayer';
import {MediaErrorCode} from '../../media/MediaErrorCode';
import {MediaState} from '../../media/MediaState';
import {IMediaResource, PlaybackManager} from '../../media/PlaybackManager';
import {PlaybackState} from '../../media/Resource';
import {VideoPlayer} from '../../media/video';
import {Video} from './Video';
import {PromiseCallback, SetTrackCurrentTimeArgs} from './VideoCallTypes';

export interface VideoEventProcessorArgs {
    videoComponent: Video;
    logger?: ILogger;
}

export function createVideoEventProcessor(videoEventProcessorArgs: VideoEventProcessorArgs): any {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('Video')
    };
    videoEventProcessorArgs = Object.assign(defaultArgs, videoEventProcessorArgs);
    const {
        videoComponent,
        logger
    } = videoEventProcessorArgs;

    // Private Variables
    let videoState: PlaybackState = PlaybackState.IDLE;
    let trackCurrentTime: number = 0;
    const endEventPromiseListeners: PromiseCallback[] = [];

    // Private Functions
    async function ensureLoaded(fromEvent: boolean, isSettingSource: boolean = false) {
        const currentMediaResource = this.playbackManager.getCurrent();
        if (!currentMediaResource.loaded) {
            await this.player.load(currentMediaResource.id, currentMediaResource.url);
            currentMediaResource.loaded = true;
        } else {
            this.updateMediaState(fromEvent, isSettingSource);
        }
    }

    function shouldAutoPlay(): boolean {
        return this.props[PropertyKey.kPropertyAutoplay];
    }

    function trackShouldBePaused(): boolean {
        const currentTime = this.player.getCurrentPlaybackPositionInSeconds();
        const playerNotStarted = currentTime === undefined || currentTime === 0;
        const willAutoPlayForFirstTime = (shouldAutoPlay.call(this) && playerNotStarted);
        return this.props[PropertyKey.kPropertyTrackPaused] && !willAutoPlayForFirstTime;
    }

    // Public Interface
    const videoEventProcessor = {
        onEvent({
            event,
            fromEvent,
            isSettingSource
        }): void {
            switch (event) {
                case PlaybackState.IDLE:
                    this.currentMediaState.withTrackState(TrackState.kTrackNotReady);
                    this.currentMediaState.withErrorCode(MediaErrorCode.DEFAULT);
                    break;
                case PlaybackState.LOADED:
                    this.currentMediaState.withTrackState(TrackState.kTrackReady);
                    break;
                case PlaybackState.PLAYING:
                    this.currentMediaState.ended = false;
                    this.currentMediaState.paused = false;
                    break;
                case PlaybackState.PAUSED:
                    this.currentMediaState.paused = true;
                    break;
                case PlaybackState.ENDED:
                    if (this.playbackManager.repeat()) {
                        this.delegate.rewind().then(() => {
                            this.delegate.play();
                        });
                    } else if (this.playbackManager.hasNext()) {
                        this.delegate.next().then(() => {
                            this.delegate.play();
                        });
                    } else {
                        this.currentMediaState.ended = true;
                        this.currentMediaState.paused = true;
                    }
                    endEventPromiseListeners.forEach((resolvePromise) => {
                        try {
                            resolvePromise();
                        } catch (e) {
                        }
                    });
                    break;
                case PlaybackState.ERROR:
                    logger.error('Playback error.');
                    isSettingSource = false;
                    this.currentMediaState.ended = true;
                    this.currentMediaState.paused = true;
                    this.currentMediaState.withTrackState(TrackState.kTrackFailed);
                    this.currentMediaState.withErrorCode(MediaErrorCode.GENERIC);
                    break;
                case PlaybackState.BUFFERING:
                default:
                    return;
            }
            videoState = event;

            this.updateMediaState(fromEvent, isSettingSource);
        },
        // Event Methods
        async playMedia({source, audioTrack}) {
            this.fromEvent = true;

            this.playbackManager.setup(source);
            this.audioTrack = audioTrack;

            const currentMediaResource = this.playbackManager.getCurrent();
            await this.delegate.seek(currentMediaResource.offset);
            await this.delegate.play();

            this.fromEvent = false;

            const waitForFinish = this.audioTrack === AudioTrack.kAudioTrackForeground;
            if (waitForFinish) {
                await new Promise((resolve) => {
                    endEventPromiseListeners.push(resolve);
                });
            }
        },
        async controlMedia({operation, optionalValue}) {
            this.fromEvent = true;

            switch (operation) {
                case CommandControlMedia.kCommandControlMediaPlay:
                    if (this.player.getMediaState() !== PlaybackState.PLAYING) {
                        await this.delegate.play();
                    }
                    break;
                case CommandControlMedia.kCommandControlMediaPause:
                    await this.delegate.pause();
                    break;
                case CommandControlMedia.kCommandControlMediaNext:
                    await this.delegate.next();
                    break;
                case CommandControlMedia.kCommandControlMediaPrevious:
                    await this.delegate.previous();
                    break;
                case CommandControlMedia.kCommandControlMediaRewind:
                    await this.delegate.rewind();
                    break;
                case CommandControlMedia.kCommandControlMediaSeek:
                    await this.delegate.seek(optionalValue);
                    break;
                case CommandControlMedia.kCommandControlMediaSetTrack:
                    await this.delegate.setTrack(optionalValue);
                    break;
                default:
                    logger.warn('Incorrect CommandControlMedia operation type');
                    break;
            }

            this.fromEvent = false;
        },
        // Playback Control Methods
        // Event-Aware Methods
        async play({waitForFinish, fromEvent, isSettingSource}): Promise<any> {
            // Adjust Audio
            if (this.audioTrack === AudioTrack.kAudioTrackNone) {
                this.player.mute();
            } else {
                this.player.unmute();
            }

            await ensureLoaded.call(this, fromEvent, isSettingSource);

            const currentMediaResource = this.playbackManager.getCurrent();

            if (currentMediaResource.duration > 0) {
                const endTime = toSecondsFromMilliseconds(currentMediaResource.offset + currentMediaResource.duration);
                this.player.setEndTimeInSeconds(endTime);
            }

            const startingPoint = toMillisecondsFromSeconds(this.player.getCurrentPlaybackPositionInSeconds());

            await this.player.play(
                currentMediaResource.id,
                currentMediaResource.url,
                startingPoint
            );

            // This isn't the responsibility of play, it's the responsibility of the callee
            // We need to pull this out
            if (waitForFinish) {
                await new Promise((resolve) => {
                    endEventPromiseListeners.push(resolve);
                });
            }
        },
        async pause({fromEvent}): Promise<any> {
            if (videoState === PlaybackState.PLAYING || videoState === PlaybackState.BUFFERING) {
                await this.player.pause();
            }
        },
        async seek({seekOffset, fromEvent}): Promise<any> {
            const mediaResource: IMediaResource = this.playbackManager.getCurrent();
            const mediaOffset = toSecondsFromMilliseconds(mediaResource.offset);
            const currentPlaybackPosition: number = this.player.getCurrentPlaybackPositionInSeconds();
            const desiredPlaybackPosition: number = currentPlaybackPosition + toSecondsFromMilliseconds(seekOffset);

            await ensureLoaded.call(this, fromEvent);

            if (this.player.getDurationInSeconds() <= toSecondsFromMilliseconds(desiredPlaybackPosition)) {
                // minus unit time otherwise will rollover to start
                this.player.setCurrentTimeInSeconds(this.player.getDurationInSeconds() - 0.001);
            } else if (desiredPlaybackPosition < mediaOffset) {
                this.player.setCurrentTimeInSeconds(mediaOffset);
            } else {
                this.player.setCurrentTimeInSeconds(desiredPlaybackPosition);
            }

            this.updateMediaState(fromEvent);
        },
        async rewind(): Promise<any> {
            await this.delegate.pause();
            const currentMediaResource = this.playbackManager.getCurrent();
            const currentTime = toMillisecondsFromSeconds(this.player.getCurrentPlaybackPositionInSeconds());
            await this.delegate.seek(-(currentTime - currentMediaResource.offset));
        },
        async previous({fromEvent}): Promise<any> {
            await this.delegate.rewind();
            this.playbackManager.previous();
            await ensureLoaded.call(this, fromEvent);
        },
        async next({fromEvent}): Promise<any> {
            await this.delegate.pause();

            if (!this.playbackManager.hasNext()) {
                this.player.setCurrentTimeInSeconds(this.player.getDurationInSeconds() - 0.001);
            } else {
                this.playbackManager.next();
                await ensureLoaded.call(this, fromEvent);
            }
        },
        async setTrack({trackIndex, fromEvent}): Promise<any> {
            await this.delegate.pause();
            this.playbackManager.setCurrent(trackIndex);
            await ensureLoaded.call(this, fromEvent);
        },
        // End Event-Aware Methods
        setAudioTrack({audioTrack}) {
            this.audioTrack = audioTrack;
        },
        async setSource({source}): Promise<any> {
            this.isSettingSource = true;

            // Configure Player and Playback
            this.playbackManager.setup(source);
            await ensureLoaded.call(this);

            // Play on set Source
            if (shouldAutoPlay.call(this) && !trackShouldBePaused.call(this)) {
                await this.delegate.play();
            }

            this.isSettingSource = false;
            // Seek Accordingly
            await this.delegate.seek(trackCurrentTime);
        },
        setTrackCurrentTime(args: SetTrackCurrentTimeArgs) {
            const {
                trackCurrentTime: updatedTrackCurrentTime
            } = args;

            trackCurrentTime = updatedTrackCurrentTime;
            this.player.setCurrentTimeInSeconds(toSecondsFromMilliseconds(trackCurrentTime));
        },
        setTrackIndex({trackIndex}) {
            if (this.props[PropertyKey.kPropertyTrackIndex]) {
                // Fire and Forget
                this.delegate.setTrack(trackIndex);
            }
        },
        async setTrackPaused({shouldBePaused}) {
            if (shouldBePaused && trackShouldBePaused.call(this)) {
                await this.delegate.pause();
            }
        },
        setScale({scale}) {
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
            this.player.configure(this.container, scaleType);
        },
        updateMediaState(fromEvent: boolean, isSettingSource: boolean = false) {
            if (!isValidPlayer(this.player)) {
                return;
            }

            let offset: number = 0;
            try {
                offset = playBackManager.getCurrent().offset;
            } catch (error) {
                logger.warn('Can not get current media resource');
            }
            this.currentMediaState.currentTime = toMillisecondsFromSeconds(
                this.player.getCurrentPlaybackPositionInSeconds()
            ) - offset;
            this.currentMediaState.duration = toMillisecondsFromSeconds(
                this.player.getDurationInSeconds()
            ) - offset;

            this.currentMediaState.trackCount = this.playbackManager.getTrackCount();
            this.currentMediaState.trackIndex = this.playbackManager.getCurrentIndex();

            ensureValidMediaState(this.currentMediaState);
            if (!isSettingSource) {
                this.component.updateMediaState(this.currentMediaState, fromEvent);
                this.emit('onUpdateMediaState', this.currentMediaState, fromEvent);
            }
        },
        // Component Methods
        applyCssShadow({shadowParams}) {
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
        eventListener: videoComponent as IMediaEventListener,
        logger
    });
    const playBackManager = new PlaybackManager();
    const currentMediaState = new MediaState();

    Object.defineProperties(videoEventProcessor, {
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

    return Object.setPrototypeOf(videoEventProcessor, videoComponent) as Video;
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
    const keysToClean = ['currentTime', 'currentTime', 'trackCount', 'trackIndex'];

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
