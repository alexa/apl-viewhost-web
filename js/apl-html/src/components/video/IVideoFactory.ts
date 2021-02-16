/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import APLRenderer from '../../APLRenderer';
import {Component, FactoryFunction} from '../Component';
import {AbstractVideoComponent} from './AbstractVideoComponent';

export interface IVideoFactory {
    create(renderer : APLRenderer,
           component : APL.Component,
           factory : FactoryFunction,
           parent? : Component) : AbstractVideoComponent;
}
