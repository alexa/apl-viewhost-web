/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { Component, FactoryFunction, IComponentProperties } from './Component';
import { ActionableComponent } from './ActionableComponent';
import APLRenderer from '../APLRenderer';
import { DEFAULT_SECTION, SpatialNavigation } from '../utils/SpatialNavigation';
import { PropertyKey } from '../enums/PropertyKey';

/**
 * Touchable components are components that can receive input from touch
 * or pointer events invoke handlers to support custom touch interaction behavior.
 */
export abstract class TouchableComponent<TouchableProps = IComponentProperties>
    extends ActionableComponent<TouchableProps> {

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);

        // Avoid touchswipe lib from taking control.
        // Side effect - no way to swipe pager with touch when it's only TW taking whole thing inside.
        this.container.classList.add('noSwipe');

        if (SpatialNavigation.enabled() && this.component.getCalculatedByKey<boolean>(PropertyKey.kPropertyFocusable)) {
            // Will override focus/blur handlers with spatial variants if enabled
            SpatialNavigation.makeNavigable(this.container, DEFAULT_SECTION, this.focus, this.blur);
        }
    }
}
