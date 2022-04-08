/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
import APLRenderer, { IAPLOptions } from '../../APLRenderer';
import { Component, FactoryFunction } from '../Component';
import { AbstractVideoComponent } from './AbstractVideoComponent';
import { IVideoFactory } from './IVideoFactory';
import { Video } from './Video';
import { VideoHolder } from './VideoHolder';

export class VideoFactory implements IVideoFactory {
    public create(renderer: APLRenderer,
                  component: APL.Component,
                  factory: FactoryFunction,
                  parent?: Component): AbstractVideoComponent {
        if ((renderer.options as IAPLOptions).environment.disallowVideo) {
            return new VideoHolder(renderer, component, factory, parent);
        } else {
            return new Video(renderer, component, factory, parent);
        }
    }
}
