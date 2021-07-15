/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import {PropertyKey} from '../enums/PropertyKey';
import {ScrollDirection} from '../enums/ScrollDirection';
import {Component, FactoryFunction, IComponentProperties} from './Component';
import {Scrollable} from './Scrollable';
import {processNextTick} from '../utils/EventUtils';

/**
 * @ignore
 */
export interface IMultiChildScrollableProperties extends IComponentProperties {
    [PropertyKey.kPropertyScrollDirection]: ScrollDirection;
    [PropertyKey.kPropertyScrollPosition]: number;
    [PropertyKey.kPropertyNotifyChildrenChanged]: any;
}

/**
 * @ignore
 */
export abstract class MultiChildScrollable extends Scrollable<IMultiChildScrollableProperties> {
    protected fullyLoaded = false;

    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
        this.container.classList.add('scrollView');
        // override or add more propExecutors
        this.propExecutor
        (this.setScrollDirection, PropertyKey.kPropertyScrollDirection)
        (this.setScrollPosition, PropertyKey.kPropertyScrollPosition);
    }

    public init() {
        super.init();
        this.$container.css('overflow', 'hidden');
    }

    protected allowFocus(requestedDistance: number, moveTo: HTMLDivElement) {
        return !(requestedDistance > this.getPageSize() + parseInt(moveTo.style[this.length], 10)) && this.fullyLoaded;
    }

    private setScrollPosition = () => {
        this.container[this.scrollSide] = this.props[PropertyKey.kPropertyScrollPosition];

        // Sometimes the scroll can only be applied through processNextTick.
        if (this.container[this.scrollSide] !== this.props[PropertyKey.kPropertyScrollPosition]) {
            processNextTick(() => {
                this.container[this.scrollSide] = this.props[PropertyKey.kPropertyScrollPosition];
            });
        }
    }

    private setScrollDirection = () => {
        switch (this.props[PropertyKey.kPropertyScrollDirection]) {
            case ScrollDirection.kScrollDirectionHorizontal:
                this.direction = ScrollDirection.kScrollDirectionHorizontal;
                this.length = 'width';
                this.scrollSide = 'scrollLeft';
                this.scrollSize = 'scrollWidth';
                this.side = 'left';
                break;
            case ScrollDirection.kScrollDirectionVertical:
                this.direction = ScrollDirection.kScrollDirectionVertical;
                this.length = 'height';
                this.scrollSide = 'scrollTop';
                this.scrollSize = 'scrollHeight';
                this.side = 'top';
                break;
            default:
                this.logger.warn('Incorrect ScrollDirection type');
                break;
        }
    }
}
