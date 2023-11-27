/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {ILogger} from '../logging/ILogger';
import {LoggerFactory} from '../logging/LoggerFactory';
import {PromiseCallback} from './MediaEventProcessor';

export enum VideoInterface {
    ON_EVENT = 'onEvent',
    PLAY_MEDIA = 'playMedia',
    CONTROL_MEDIA = 'controlMedia',
    PLAY = 'play',
    PAUSE = 'pause',
    STOP = 'stop',
    SEEK = 'seek',
    SEEKTO = 'seekTo',
    REWIND = 'rewind',
    PREVIOUS = 'previous',
    NEXT = 'next',
    SET_TRACK_LIST = 'setTrackList',
    SET_TRACK_INDEX = 'setTrackIndex',
    SET_AUDIO_TRACK = 'setAudioTrack',
    SET_MUTED = 'setMuted',
    SET_SCALE = 'setScale',
    ON_TIME_UPDATED = 'onTimeUpdated',
    APPLY_CSS_SHADOW = 'applyCssShadow'
}

export interface MediaEventSequencer {
    enqueueForProcessing(event: VideoInterface, callArgs: any): void;

    processExclusively(event: VideoInterface, callArgs: any): Promise<void>;

    destroy(): void;
}

export interface MediaEventSequencerArgs {
    mediaEventProcessor: any;
    logger?: ILogger;
}

export function createMediaEventSequencer(videoEventSequencerArgs: MediaEventSequencerArgs): MediaEventSequencer {
    type EventQueueItem = [
        VideoInterface, any
    ];

    const defaultArgs = {
        logger: LoggerFactory.getLogger('MediaEventSequencer')
    };
    videoEventSequencerArgs = Object.assign(defaultArgs, videoEventSequencerArgs);
    const {
        mediaEventProcessor,
        logger
    } = videoEventSequencerArgs;

    let isProcessing = false;
    let eventsQueue = [] as EventQueueItem[];
    let currentAnimationFrame: number;

    async function processEvent(event: VideoInterface, callArgs: any) {
        logger.debug('processEvent ' + `${event as string}`);
        await mediaEventProcessor[(event as string)](callArgs);
    }

    async function processLoop() {
        const nextEvent = eventsQueue.shift();
        if (!nextEvent) {
            isProcessing = false;
            return;
        }
        const [
            event,
            callArgs
        ] = nextEvent;

        await processNextEvent(event, callArgs);

        currentAnimationFrame = requestAnimationFrame(processLoop);
    }

    // tslint:disable-next-line:max-line-length
    function processNextEvent(event: VideoInterface, callArgs: any, callback?: PromiseCallback): Promise<void> {
        // Ensure continued execution of events
        return new Promise((resolve) => {
            processEvent(event, callArgs)
                .then(() => {
                    ensureResolve(resolve, callback);
                })
                .catch((error) => {
                    logger.warn(`error processing ${event}: ${error}`);
                    ensureResolve(resolve, callback);
                });
        });
    }

    function ensureResolve(resolve: any, callback?: PromiseCallback) {
        try {
            if (callback) {
                callback();
            }
        } finally {
            resolve();
        }
    }

    function ensureProcessing() {
        if (!isProcessing) {
            isProcessing = true;
            // Start loop / Fire and Forget
            processLoop().then(undefined);
        }
    }

    return {
        processExclusively(event: VideoInterface, callArgs: any): Promise<void> {
            // Kill the queue
            eventsQueue = [];
            // Kill the current animation frame
            cancelAnimationFrame(currentAnimationFrame);
            // Indicate not processing
            isProcessing = false;
            // Process my request now
            return new Promise(async (resolve) => {
                await processNextEvent(event, callArgs, resolve);
            });
        },
        enqueueForProcessing(event: VideoInterface, callArgs: any): void {
            logger.debug('enqueueEvent ' + `${event as string}`);
            eventsQueue.push([event, callArgs]);
            ensureProcessing();
        },
        destroy() {
            eventsQueue = [];
            cancelAnimationFrame(currentAnimationFrame);
            isProcessing = false;
        }
    };
}
