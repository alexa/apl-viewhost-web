/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IVideoPlayer } from '../IVideoPlayer';

const hls = require('hls.js/dist/hls.light.min.js');
const path = require('path');
import { ILogger } from '../../logging/ILogger';
import { LoggerFactory } from '../../logging/LoggerFactory';
import { IMediaEventListener } from '../IMediaEventListener';
import { PlaybackState } from '../Resource';
import { createPlayerNetworkRetryManager, PlayerNetworkRetryManager } from './PlayerNetworkRetryManager';
import { createVideoPlayer } from './VideoPlayer';

const HLSPlaybackErrors = {
    NOT_SUPPORTED: 'The provided media format is not supported.',
    FATAL_ERROR: 'A fatal playback error encountered'
};

enum VideoPlayerState {
    UNINITIALIZED = 'UNINITIALIZED',
    CONFIGURING = 'CONFIGURING',
    READY = 'READY',
    ERROR = 'ERROR'
}

export interface HLSVideoPlayerArgs {
    eventListener: IMediaEventListener;
    logger?: ILogger;
}

export function createHLSVideoPlayer(hlsVideoPlayerArgs: HLSVideoPlayerArgs): IVideoPlayer {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('Video')
    };
    hlsVideoPlayerArgs = Object.assign(defaultArgs, hlsVideoPlayerArgs);
    const {
        eventListener,
        logger
    } = hlsVideoPlayerArgs;

    // Private Variables
    let videoPlayerState: VideoPlayerState = VideoPlayerState.UNINITIALIZED;
    let hlsPlayer: any = undefined;

    // Private Functions
    function playHLS(url: string, offset?: number): Promise<void> {
        offset = offset || 0;
        return new Promise((resolve, reject) => {
            try {
                const player = getHLSPlayer();
                if (isNativePlayer(player)) {
                    playFromNativePlayer({
                        player,
                        url,
                        resolve,
                        reject
                    });
                }
                playFromHLSPlayer.call(this, {
                    player,
                    url,
                    offset,
                    resolve,
                    reject
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    interface ConfigurationArgs {
        url: string;
        resolve: any;
        reject: any;
    }

    interface FromNativePlayerArgs extends ConfigurationArgs {
        player: HTMLVideoElement;
    }

    function playFromNativePlayer(args: FromNativePlayerArgs) {
        const {
            player,
            url,
            resolve,
            reject
        } = args;

        player.addEventListener('loadedmetadata', () => {
            player.play()
                .then(resolve)
                .catch(reject);
        });
        player.src = url;
    }

    interface FromHLSPlayerArgs extends ConfigurationArgs {
        player: any;
    }

    interface PlayFromHLSPlayerArgs extends FromHLSPlayerArgs {
        offset: number;
    }

    async function playFromHLSPlayer(args: PlayFromHLSPlayerArgs) {
        const {
            player,
            url,
            offset,
            resolve,
            reject
        } = args;

        if (videoPlayerState === VideoPlayerState.UNINITIALIZED) {
            new Promise((configureSuccess, configureFailure) => {
                configureHLSPlayer.call(this, {
                    player,
                    url,
                    resolve: configureSuccess,
                    reject: configureFailure
                });
            }).then(() => {
                playFromHLSPlayer.call(this, {
                    player,
                    url,
                    offset,
                    resolve,
                    reject
                });
            });
        }

        player.startLoad(offset);

        await this.player.play()
            .then(resolve)
            .catch(reject);
    }

    function loadHLS(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const canPlayHLSContent = playerSupportsMediaResourceTypes(this.player) || hlsIsSupported();

            if (!canPlayHLSContent) {
                reject(HLSPlaybackErrors.NOT_SUPPORTED);
            }

            try {
                const player = getHLSPlayer.call(this);
                if (isNativePlayer(player)) {
                    configureNativePlayer.call(this, { player, url, resolve, reject });
                } else {
                    configureHLSPlayer.call(this, { player, url, resolve, reject });
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    function handlePlaybackError(error) {
        logger.error(`${HLSPlaybackErrors.FATAL_ERROR}: ${error}`);
        this.playbackStateHandler.transitionToState(PlaybackState.ERROR);
    }

    function configureNativePlayer(args: FromNativePlayerArgs) {
        const {
            player,
            url,
            resolve
        } = args;
        player.src = url;
        player.load();

        resolve();
    }

    function configureHLSPlayer(args: FromHLSPlayerArgs) {
        videoPlayerState = VideoPlayerState.CONFIGURING;

        const {
            player,
            url,
            reject,
            resolve
        } = args;

        resetPlayerState.call(this);

        const playerNetworkRetryManager: PlayerNetworkRetryManager = createPlayerNetworkRetryManager({
            player,
            errorCallback: handlePlaybackError.bind(this, HLSPlaybackErrors.FATAL_ERROR)
        });

        player.on(hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                if (!playerNetworkRetryManager.shouldRetry()) {
                    videoPlayerState = VideoPlayerState.ERROR;
                    playerNetworkRetryManager.fail();
                    reject();
                    return;
                }
                switch (data.type) {
                    case hls.ErrorTypes.NETWORK_ERROR:
                        playerNetworkRetryManager.retry(url, data.details);
                        break;
                    case hls.ErrorTypes.MEDIA_ERROR:
                        player.recoverMediaError();
                        break;
                    default:
                        videoPlayerState = VideoPlayerState.ERROR;
                        handlePlaybackError.call(this, HLSPlaybackErrors.FATAL_ERROR);
                        reject();
                        break;
                }
            }
        });

        // Prepare for Video Playback
        player.on(hls.Events.MEDIA_ATTACHED, () => {
            player.loadSource(url);
        });

        if (isAlternativeHLSFormat(url)) {
            player.on(hls.Events.FRAG_LOADED, () => {
                this.playbackStateHandler.transitionToState(PlaybackState.LOADED);
                resolve();
            });
        } else {
            player.on(hls.Events.MANIFEST_PARSED, () => {
                this.playbackStateHandler.transitionToState(PlaybackState.LOADED);
                resolve();
            });
        }

        player.attachMedia(this.player);
    }

    function resetPlayerState() {
        try {
            const player = getHLSPlayer.call(this);
            player.stopLoad();
            player.detachMedia();
        } catch (e) {
        }
    }

    function getHLSPlayer(): HTMLVideoElement | any {
        if (hlsPlayer) {
            return hlsPlayer;
        }

        if (hlsIsSupported()) {
            if (hlsPlayer === undefined) {
                hlsPlayer = new hls();
                return hlsPlayer;
            }
            return hlsPlayer;
        }

        if (playerSupportsMediaResourceTypes(this.player)) {
            hlsPlayer = this.player;
            return hlsPlayer;
        }

        throw new Error(HLSPlaybackErrors.NOT_SUPPORTED);
    }

    // Public Interface
    const hlsVideoPlayer = {
        load(id: string, url: string): Promise<void> {
            this.player.id = id;
            if (isHLSSource(url)) {
                this.player.onloadeddata = undefined;
                this.playbackStateHandler.transitionToState(PlaybackState.IDLE);
                return loadHLS.call(this, url);
            }

            resetPlayerState.call(this);
            return this._delegate.load.call(this, id, url);
        },
        play(id: string, url: string, offset: number): Promise<void> {
            this.player.id = id;
            if (isHLSSource(url)) {
                return playHLS.call(this, url, offset);
            }
            return this._delegate.play.call(this, id, url, offset);
        },
        get _delegate() {
            return Object.getPrototypeOf(this);
        }
    };

    // Set up prototype delegation chain
    const videoPlayer = createVideoPlayer(eventListener);
    return Object.setPrototypeOf(hlsVideoPlayer, videoPlayer);
}

// Helper Functions
function hlsIsSupported(): boolean {
    return hls.isSupported();
}

const SupportedHLSAlternativeFormats = [
    'format=m3u8-aapl'
];

const SupportedHLSExtensionTypes = [
    'm3u8',
    'hls'
];

function isHLSExtension(url: string): boolean {
    const urlObject = new URL(url);
    urlObject.search = '';

    const extension = path.extname(urlObject.toString());
    return SupportedHLSExtensionTypes.reduce((accumulator, currentExtensionType) => {
        return accumulator || extension.includes(currentExtensionType);
    }, false);
}

function isAlternativeHLSFormat(url: any): boolean {
    return SupportedHLSAlternativeFormats.reduce((accumulator, currentFormat) => {
        return accumulator || url.includes(currentFormat);
    }, false);
}

function isHLSSource(url: string) {
    return isHLSExtension(url) || isAlternativeHLSFormat(url);
}

const SupportedMediaResourceTypes = [
    'application/vnd.apple.mpegurl'
];

function playerSupportsMediaResourceTypes(player: any) {
    // tslint:disable-next-line:only-arrow-functions
    return SupportedMediaResourceTypes.reduce(function mediaResourceTypeCheck(accumulator, currentMediaResourceType) {
        return accumulator || player.canPlayType(currentMediaResourceType);
    }, false);
}

function isNativePlayer(player: any): player is HTMLVideoElement {
    return Object.getPrototypeOf(player) === HTMLVideoElement.prototype;
}
