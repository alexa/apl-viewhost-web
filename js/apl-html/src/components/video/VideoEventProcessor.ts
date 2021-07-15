/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {AudioTrack} from '../../enums/AudioTrack';
import {CommandControlMedia} from '../../enums/CommandControlMedia';
import {PropertyKey} from '../../enums/PropertyKey';
import {VideoScale} from '../../enums/VideoScale';
import {IMediaResource, PlaybackManager} from '../../media/PlaybackManager';
import {PlaybackState} from '../../media/Resource';
import {IVideoPlayer} from '../../media/IVideoPlayer';
import {Video} from './Video';
import {VideoPlayer} from '../../media/video';
import {PromiseCallback, SetTrackCurrentTimeArgs} from './VideoCallTypes';
import {ILogger} from '../../logging/ILogger';
import {LoggerFactory} from '../../logging/LoggerFactory';
import {IMediaEventListener} from '../../media/IMediaEventListener';

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
        if (!this.currentMediaResource.loaded) {
            await this.player.load(this.currentMediaResource.id, this.currentMediaResource.url);
        } else {
            this.updateMediaState(fromEvent, isSettingSource);
        }
    }

    /**
     * Return if the video should be paused when seeking to an offset.
     * The play/pause should depend on kPropertyAutoplay at initial load - offset == 0.
     * The play/pause should depend on kPropertyTrackPaused once video has been played - offset > 0.
     *
     * @param seekOffset
     * @private
     */
    function shouldPauseAtSeek(seekOffset: number): boolean {
        let pauseAtSeek = true;
        if (shouldAutoPlay.call(this)) {
            pauseAtSeek = false;
        }
        if (seekOffset > 0) {
            pauseAtSeek = this.props[PropertyKey.kPropertyTrackPaused];
        }
        return pauseAtSeek;
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
        onEvent({event, fromEvent, isSettingSource}): void {
            switch (event) {
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
                    this.currentMediaState.ended = true;
                    this.currentMediaState.paused = true;
                    break;
                case PlaybackState.LOADED:
                    this.currentMediaResource.loaded = true;
                    break;
                case PlaybackState.BUFFERING:
                case PlaybackState.IDLE:
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
            this.currentMediaResource = this.playbackManager.getCurrent();

            await this.delegate.seek(this.currentMediaResource.offset);
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
                    await this.delegate.play();
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
            this.currentMediaResource = this.playbackManager.getCurrent();

            // Adjust Audio
            if (this.audioTrack === AudioTrack.kAudioTrackNone) {
                this.player.mute();
            } else {
                this.player.unmute();
            }

            await ensureLoaded.call(this, fromEvent, isSettingSource);

            if (this.currentMediaResource.duration > 0) {
                const endTime =
                    toSecondsFromMilliseconds(this.currentMediaResource.offset + this.currentMediaResource.duration);
                this.player.setEndTimeInSeconds(endTime);
            }

            const startingPoint = this.currentMediaState.currentTime + this.currentMediaResource.offset;

            await this.player.play(
                this.currentMediaResource.id,
                this.currentMediaResource.url,
                startingPoint
            );

            this.updateMediaState(fromEvent, isSettingSource);

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
                this.updateMediaState(fromEvent);
            }
        },
        async seek({offset, fromEvent}): Promise<any> {
            const pauseAtSeek = shouldPauseAtSeek.call(this, offset);
            if (pauseAtSeek) {
                await this.delegate.pause();
            }

            const mediaResource: IMediaResource = this.playbackManager.getCurrent();
            const startOffset: number = mediaResource.offset;
            const desireOffset: number = startOffset + offset;

            await ensureLoaded.call(this, fromEvent);

            if (this.player.getDurationInSeconds() <= toSecondsFromMilliseconds(desireOffset)) {
                // minus unit time otherwise will rollover to start
                this.player.setCurrentTimeInSeconds(this.player.getDurationInSeconds() - 0.001);
            } else {
                const updatedOffset = this.player.getCurrentPlaybackPositionInSeconds()
                    + toSecondsFromMilliseconds(desireOffset);

                this.player.setCurrentTimeInSeconds(updatedOffset);
            }

            this.updateMediaState(fromEvent);
        },
        async rewind(): Promise<any> {
            await this.delegate.seek(this.currentMediaResource.offset);
        },
        async previous({fromEvent}): Promise<any> {
            await this.delegate.pause();
            this.currentMediaResource = this.playbackManager.previous();
            await ensureLoaded.call(this, fromEvent);
        },
        async next({fromEvent}): Promise<any> {
            await this.delegate.pause();

            if (!this.playbackManager.hasNext()) {
                this.player.setCurrentTimeInSeconds(this.player.getDurationInSeconds() - 0.001);
                this.updateMediaState(fromEvent);
            } else {
                this.currentMediaResource = this.playbackManager.next();
                await ensureLoaded.call(this, fromEvent);
            }
        },
        async setTrack({trackIndex, fromEvent}): Promise<any> {
            await this.delegate.pause();
            this.playbackManager.setCurrent(trackIndex);
            this.currentMediaResource = this.playbackManager.getCurrent();
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
            this.currentMediaResource = this.playbackManager.getCurrent();
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

            // Update Media State
            // tslint:disable-next-line:max-line-length
            this.currentMediaState.currentTime = toMillisecondsFromSeconds(this.player.getCurrentPlaybackPositionInSeconds());
            this.currentMediaState.duration = toMillisecondsFromSeconds(this.player.getDurationInSeconds());
            this.currentMediaState.trackCount = this.playbackManager.getTrackCount();
            this.currentMediaState.trackIndex = this.playbackManager.getCurrentIndex();

            if (!isSettingSource && isValidMediaState(this.currentMediaState)) {
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
    const currentMediaState: APL.IMediaState = {
        currentTime: 0,
        duration: 0,
        ended: false,
        paused: true,
        trackCount: 0,
        trackIndex: 0
    };

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
        currentMediaResource: {
            value: undefined as IMediaResource,
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

function isValidMediaState(mediaState: any): mediaState is APL.IMediaState {
    const {
        currentTime,
        duration,
        trackCount,
        trackIndex
    } = mediaState;

    return isValidValue(currentTime) &&
        isValidValue(duration) &&
        isValidValue(trackCount) &&
        isValidValue(trackIndex);
}

function isValidValue(n: any): n is number {
    return !Number.isNaN(n) && n !== undefined;
}
