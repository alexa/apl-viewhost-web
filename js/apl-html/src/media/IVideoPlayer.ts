/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {IPlayer} from './IPlayer';

export interface IVideoPlayer extends IPlayer {
    init(): void;

    configure(parent: HTMLElement, scale: 'contain' | 'cover'): void;

    applyCssShadow(shadowParams: string): void;

    mute(): void;

    unmute(): void;

    setCurrentTimeInSeconds(offsetInSeconds: number): void;

    getCurrentPlaybackPositionInSeconds(): number;

    getDurationInSeconds(): number;

    pause(): void;

    end(): void;

    reset(): void;

    destroy(): void;
}
