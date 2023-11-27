/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
import APLRenderer from '../../APLRenderer';
import { Component, FactoryFunction } from '../Component';
import { AbstractVideoComponent } from './AbstractVideoComponent';
import { IVideoFactory } from './IVideoFactory';
import { Video } from './Video';

export class VideoFactory implements IVideoFactory {
    public create(renderer: APLRenderer,
                  component: APL.Component,
                  factory: FactoryFunction,
                  parent?: Component): AbstractVideoComponent {
        return new Video(renderer, component, factory, parent);
    }
}
