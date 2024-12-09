/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { Component, FactoryFunction, IGenericPropType } from './Component';

/**
 * @ignore
 */
export class ActionableComponent<PropsType extends object = IGenericPropType> extends Component<PropsType> {
    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
        if (component.isFocusable()) {
            this.container.tabIndex = 0;
            this.focus = () => this.container.focus();
        } else {
            this.container.tabIndex = -1;
        }
    }

    public focus = () => {
        //
    }

    protected blur = () => {};
}
