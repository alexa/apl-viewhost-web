/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {IPlayer} from './IPlayer';

export interface IVideoPlayer extends IPlayer {
    configure(parent: HTMLElement, scale: 'contain' | 'cover'): void;

    applyCssShadow(shadowParams: string): void;

    mute(): void;

    unmute(): void;

    setCurrentTimeInSeconds(offsetInSeconds: number): void;

    getCurrentPlaybackPositionInSeconds(): number;

    setEndTimeInSeconds(endTimeInSeconds: number): void;

    getDurationInSeconds(): number;

    pause(): Promise<void>;

    destroy(): void;
}
