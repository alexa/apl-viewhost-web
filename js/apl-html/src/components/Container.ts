/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { Component, FactoryFunction } from './Component';

/**
 * @ignore
 */
export class Container extends Component {
    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
    }

    protected isLayout(): boolean {
        return true;
    }
}
