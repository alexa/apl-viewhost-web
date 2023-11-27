/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { Video } from '../components/video/Video';
import { AudioTrack } from '../enums/AudioTrack';
import { IMediaEventListener } from './IMediaEventListener';

export interface IMediaPlayerHandle extends IMediaEventListener {
    /**
     * Called by C++ code
     */
    setTrackList(trackArray: Array<{url: string, offset: number, duration: number, repeatCount: number}>): void;

    setTrackIndex(index: number): Promise<any>;

    seek(offset: number): Promise<any>;

    seekTo(position: number): Promise<any>;

    play(waitForFinish: boolean): Promise<any>;

    pause(): Promise<any>;

    stop(): Promise<any>;

    next(): Promise<any>;

    previous(): Promise<any>;

    rewind(): Promise<any>;

    setAudioTrack(audioTrack: AudioTrack): void;

    setMute(mute: boolean): void;

    /**
     * Called by JS code
     */
    setVideoComponent(video: Video): void;

    getProcessor(): any;

    getSequencer(): any;

    destroy(): void;
}
