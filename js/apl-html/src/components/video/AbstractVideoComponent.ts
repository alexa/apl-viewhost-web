/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../../APLRenderer';
import {AudioTrack} from '../../enums/AudioTrack';
import {PropertyKey} from '../../enums/PropertyKey';
import {VideoScale} from '../../enums/VideoScale';
import {IMediaSource} from '../../media/IMediaSource';
import { PlaybackState } from '../../media/Resource';
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
export abstract class AbstractVideoComponent extends Component<IVideoProperties> {

    protected constructor(renderer: APLRenderer,
                          component: APL.Component,
                          factory: FactoryFunction,
                          parent?: Component) {
        super(renderer, component, factory, parent);

        this.propExecutor
        (this.setScaleFromProp, PropertyKey.kPropertyScale);
    }

    public abstract onEvent(event: PlaybackState): void;

    public abstract play(waitForFinish?: boolean);

    public abstract pause();

    protected abstract setScale(scale: VideoScale);

    // Optional Pass-Thru
    protected setTrackPaused(isPaused: boolean) {
        // No-Op - Default Implementation
    }

    private setScaleFromProp = () => {
        this.setScale(this.props[PropertyKey.kPropertyScale]);
    }
}
