/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import APLRenderer from '../APLRenderer';
import { UpdateType } from '../enums/UpdateType';
import { Component, FactoryFunction, IGenericPropType } from './Component';
import { SpatialNavigation } from '../utils/SpatialNavigation';

/**
 * @ignore
 */
export class ActionableComponent<PropsType = IGenericPropType> extends Component<PropsType> {
    private focused : boolean = false;

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        if (SpatialNavigation.enabled()) {
            this.container.tabIndex = -1;
        }
    }

    protected focus = () => {
        if (!this.focused && SpatialNavigation.enabled()) {
            this.focused = true;
            this.update(UpdateType.kUpdateTakeFocus, 1);
        }
    }

    protected blur = () => {
        if (this.focused && SpatialNavigation.enabled()) {
            this.focused = false;
            this.update(UpdateType.kUpdateTakeFocus, 0);
        }
    }
}
