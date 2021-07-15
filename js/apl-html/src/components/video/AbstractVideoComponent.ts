/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../../APLRenderer';
import {AudioTrack} from '../../enums/AudioTrack';
import {CommandControlMedia} from '../../enums/CommandControlMedia';
import {PropertyKey} from '../../enums/PropertyKey';
import {VideoScale} from '../../enums/VideoScale';
import {IMediaEventListener} from '../../media/IMediaEventListener';
import {IMediaSource} from '../../media/IMediaSource';
import {PlaybackState} from '../../media/Resource';
import {Component, FactoryFunction, IComponentProperties} from '../Component';

/**
 * @ignore
 */
export interface IVideoProperties extends IComponentProperties {
    [PropertyKey.kPropertyAudioTrack]: AudioTrack;
    [PropertyKey.kPropertyAutoplay]: boolean;
    [PropertyKey.kPropertyScale]: VideoScale;
    [PropertyKey.kPropertySource]: IMediaSource | IMediaSource[];
    [PropertyKey.kPropertyTrackCurrentTime]: number;
    [PropertyKey.kPropertyTrackIndex]: number;
    [PropertyKey.kPropertyTrackPaused]: boolean;
}

/**
 * @ignore
 */
export abstract class AbstractVideoComponent extends Component<IVideoProperties> implements IMediaEventListener {

    protected constructor(renderer: APLRenderer,
                          component: APL.Component,
                          factory: FactoryFunction,
                          parent?: Component) {
        super(renderer, component, factory, parent);

        this.propExecutor
        (this.setScaleFromProp, PropertyKey.kPropertyScale)
        (this.setAudioTrackFromProp, PropertyKey.kPropertyAudioTrack)
        (this.setTrackCurrentTimeFromProp, PropertyKey.kPropertyTrackCurrentTime)
        (this.setPauseFromProp, PropertyKey.kPropertyTrackPaused)
        (this.setSourceFromProp, PropertyKey.kPropertySource)
        (this.setTrackIndexFromProp, PropertyKey.kPropertyTrackIndex);
    }

    public abstract onEvent(event: PlaybackState): void;

    public abstract async playMedia(source: IMediaSource | IMediaSource[], audioTrack: AudioTrack);

    public abstract async controlMedia(operation: CommandControlMedia, optionalValue: number);

    public abstract async play(waitForFinish?: boolean);

    public abstract async pause();

    public abstract async next();

    public abstract async previous();

    public abstract async rewind();

    public abstract async seek(offset: number);

    public abstract async setTrack(trackIndex: number);

    protected abstract setScale(scale: VideoScale);

    protected abstract setAudioTrack(audioTrack: AudioTrack);

    protected abstract async setSource(source: IMediaSource | IMediaSource[]);

    protected abstract setTrackCurrentTime(trackCurrentTime: number);

    protected abstract setTrackIndex(trackIndex: number);

    // Optional Pass-Thru
    protected setTrackPaused(isPaused: boolean) {
        // No-Op - Default Implementation
    }

    private setScaleFromProp = () => {
        this.setScale(this.props[PropertyKey.kPropertyScale]);
    }

    private setAudioTrackFromProp = () => {
        this.setAudioTrack(this.props[PropertyKey.kPropertyAudioTrack]);
    }

    private setSourceFromProp = () => {
        this.setSource(this.props[PropertyKey.kPropertySource]);
    }

    private setTrackCurrentTimeFromProp = () => {
        this.setTrackCurrentTime(this.props[PropertyKey.kPropertyTrackCurrentTime]);
    }

    private setTrackIndexFromProp = () => {
        this.setTrackIndex(this.props[PropertyKey.kPropertyTrackIndex]);
    }

    private setPauseFromProp = () => {
        this.setTrackPaused(this.props[PropertyKey.kPropertyTrackPaused]);
    }
}
