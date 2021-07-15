/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../../APLRenderer';
import { AudioTrack } from '../../enums/AudioTrack';
import { Component, FactoryFunction } from '../Component';
import { CommandControlMedia } from '../../enums/CommandControlMedia';
import { PlaybackState } from '../../media/Resource';
import { IMediaSource } from '../../media/IMediaSource';
import { VideoScale } from '../../enums/VideoScale';
import { AbstractVideoComponent } from './AbstractVideoComponent';

/**
 * @ignore
 */
export class VideoHolder extends AbstractVideoComponent {
    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
    }

    public onEvent(event: PlaybackState): void {
    }

    public async playMedia(source: IMediaSource | IMediaSource[], audioTrack: AudioTrack) {
    }

    public async controlMedia(operation: CommandControlMedia, optionalValue: number) {
    }

    public async play(waitForFinish: boolean = false) {
    }

    public async pause() {
    }

    public async next() {
    }

    public async previous() {
    }

    public async rewind() {
    }

    public async seek(offset: number) {
    }

    public async setTrack(trackIndex: number) {
    }

    protected setScale(scale: VideoScale) {
    }

    protected setAudioTrack(audioTrack: AudioTrack) {
    }

    protected setSource(source: IMediaSource | IMediaSource[]) {
    }

    protected setTrackCurrentTime(trackCurrentTime: number) {
    }

    protected setTrackIndex(trackIndex: number) {
    }
}
