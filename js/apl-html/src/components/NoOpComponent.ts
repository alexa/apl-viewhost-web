/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import {UpdateType} from '../enums/UpdateType';
import {Component, FactoryFunction, IGenericPropType} from './Component';

/**
 * @ignore
 */
export class NoOpComponent extends Component {
    constructor(renderer: APLRenderer,
                component: APL.Component,
                factory: FactoryFunction,
                parent?: Component) {
        super(renderer, component, factory, parent);

        this.$container.css({
            display: 'none'
        });
    }
    public setProperties(props: IGenericPropType) {
        // noop
    }

    public updateDirtyProps() {
        // noop
    }
    public update(stateProp: UpdateType, value: number | string) {
        // noop
    }
}
