/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {PlaybackState} from '../Resource';
import {IMediaEventListener} from '../IMediaEventListener';

export enum EmitBehavior {
    Dedup = 'DEDUP',
    AlwaysEmit = 'ALWAYS_EMIT'
}

export enum PlaybackStateTransitionResult {
    StateUpdatedDidEmit = 'TRANSITION_EMIT',
    StateNotUpdatedDidNotEmit = 'NO_TRANSITION_NO_EMIT'
}

export interface IPlaybackStateHandler {
    transitionToState(playbackState: PlaybackState): PlaybackStateTransitionResult;

    isState(playbackState: PlaybackState): boolean;
}

export interface PlaybackStateArgs {
    eventListener: IMediaEventListener;
    initialPlaybackState?: PlaybackState;
}

function emitPlaybackStateChangeEvent(eventListener: IMediaEventListener) {
    eventListener.onEvent(this.currentPlaybackState);
}

export function PlaybackStateHandler(args: PlaybackStateArgs): IPlaybackStateHandler {
    const defaultArgs = {
        initialPlaybackState: PlaybackState.IDLE
    };

    args = Object.assign(defaultArgs, args);
    const {
        eventListener,
        initialPlaybackState
    } = args;

    const playbackStateHandler: IPlaybackStateHandler = {
        // tslint:disable-next-line:max-line-length
        transitionToState(playbackState: PlaybackState, emitBehavior: EmitBehavior = EmitBehavior.Dedup): PlaybackStateTransitionResult {
            if (emitBehavior === EmitBehavior.Dedup && playbackState === this.currentPlaybackState) {
                return PlaybackStateTransitionResult.StateNotUpdatedDidNotEmit;
            }
            this.currentPlaybackState = playbackState;
            emitPlaybackStateChangeEvent.call(this, eventListener);
            return PlaybackStateTransitionResult.StateUpdatedDidEmit;
        },
        isState(playbackState: PlaybackState): boolean {
            return this.currentPlaybackState === playbackState;
        }
    };

    return Object.defineProperties(playbackStateHandler, {
        currentPlaybackState: {
            value: initialPlaybackState,
            writable: true,
            configurable: false
        }
    });
}
