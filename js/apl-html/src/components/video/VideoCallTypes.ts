/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import {AudioTrack} from '../../enums/AudioTrack';
import {CommandControlMedia} from '../../enums/CommandControlMedia';
import {VideoScale} from '../../enums/VideoScale';
import {IMediaSource} from '../../media/IMediaSource';
import {PlaybackState} from '../../media/Resource';

export type PromiseCallback = (value?: any) => void;
export interface OnEventArgs {
    event: PlaybackState;
}

export interface PlayMediaArgs {
    source: IMediaSource | IMediaSource[];
    audioTrack: AudioTrack;
}

export interface ControlMediaArgs {
    operation: CommandControlMedia;
    optionalValue: number;
}

export interface PlayArgs {
    waitForFinish?: boolean;
}

export interface SeekArgs {
    offset: number;
}

export interface SetTrackArgs {
    trackIndex: number;
}

export interface SetAudioTrackArgs {
    audioTrack: AudioTrack;
}

export interface SetSourceArgs {
    source: IMediaSource | IMediaSource[];
}

export interface SetTrackCurrentTimeArgs {
    trackCurrentTime: number;
}

export interface SetTrackIndexArgs {
    trackIndex: number;
}

export interface SetTrackPausedArgs {
    shouldBePaused: boolean;
}

export interface SetScaleArgs {
    scale: VideoScale;
}

export interface ApplyCSSShadowArgs {
    shadowParams: string;
}
