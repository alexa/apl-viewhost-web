/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { Component, FactoryFunction, IComponentProperties } from './Component';
import { ActionableComponent } from './ActionableComponent';
import { PropertyKey } from '../enums/PropertyKey';
import { ChildAction } from '../utils/Constant';

/**
 * @ignore
 */
export interface ITouchWrapperProperties extends IComponentProperties {
    [PropertyKey.kPropertyNotifyChildrenChanged]: any;
}

/**
 * @ignore
 */
export class TouchWrapper extends ActionableComponent<ITouchWrapperProperties> {
    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);

        // override or add more propExecutors
        this.propExecutor
            (this.updateUponChildrenChange, PropertyKey.kPropertyNotifyChildrenChanged);
    }

    protected isLayout(): boolean {
        return true;
    }

    // Override the behavior based on NotifyChildrenChanged
    private updateUponChildrenChange = () => {
        this.handleComponentChildrenChange();
        for (const child of this.props[PropertyKey.kPropertyNotifyChildrenChanged]) {
            if (child.action === ChildAction.Insert) {
                // hide the overflow caused by insert.
                // It will even temporary hide eg.shadow which renders out of box during the insert.
                this.$container.css('overflow', 'hidden');
            } else {
                // make sure the wrapper renders child element as expected.
                this.$container.css('overflow', 'visible');
            }
        }
    }
}
