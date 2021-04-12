/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { Component, FactoryFunction, IGenericPropType } from './Component';

/**
 * @ignore
 */
export class ActionableComponent<PropsType = IGenericPropType> extends Component<PropsType> {
    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.container.tabIndex = -1;
    }

    public focus = () => {
        this.container.focus();
    }
    protected blur = () => {};
}
