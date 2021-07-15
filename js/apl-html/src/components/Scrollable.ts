/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { ScrollDirection } from '../enums/ScrollDirection';
import { Component, FactoryFunction, IComponentProperties } from './Component';
import { ActionableComponent } from './ActionableComponent';
import { UpdateType } from '../enums/UpdateType';

/**
 * @ignore
 */
export interface IScollOptions {
    suppressScrollX?: boolean;
    suppressScrollY?: boolean;
    useBothWheelAxes?: boolean;
    scrollXMarginOffset?: number;
    scrollYMarginOffset?: number;
    handlers?: string[];
}

/**
 * @ignore
 */
export abstract class Scrollable<ScrollableProps = IComponentProperties>
    extends ActionableComponent<ScrollableProps> {

    public static FOCUS_SCROLL_VELOCITY: number = 5.0;

    public direction: ScrollDirection = ScrollDirection.kScrollDirectionVertical;
    protected scrollbar;
    protected length: 'width' | 'height' = 'height';
    protected scrollSize: 'scrollHeight' | 'scrollWidth' = 'scrollHeight';
    protected scrollSide: 'scrollTop' | 'scrollLeft' = 'scrollTop';
    protected side: 'left' | 'top' = 'top';
    protected hasFocusableChildren: boolean = false;

    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
        const onScroll = async (event: WheelEvent) => {
            const scrollPosition = this.getScrollPosition();
            function getLargerAbsoluteValue(deltaX: number, deltaY: number) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    return deltaX;
                }
                return deltaY;
            }
            const scrollAmount = getLargerAbsoluteValue(event.deltaX, event.deltaY);
            const scaledScrollPos = (scrollPosition + scrollAmount) / this.renderer.context.getScaleFactor();
            this.component.update(UpdateType.kUpdateScrollPosition, scaledScrollPos);
        };
        this.container.addEventListener('wheel', onScroll);
    }

    protected isLayout(): boolean {
        return true;
    }

    protected allowFocus(requestedDistance: number, moveTo: HTMLDivElement) {
        return !(requestedDistance > this.getPageSize() + parseInt(moveTo.style[this.length], 10));
    }

    public getScrollPosition(): number {
        return this.container[this.scrollSide];
    }

    public getScrollLength(): number {
        return this.container[this.scrollSize];
    }

    public getPageSize(): number {
        return this.bounds[this.length];
    }

    public getDirection(): ScrollDirection {
        return this.direction;
    }
}
