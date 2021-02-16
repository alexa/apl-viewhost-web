/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import * as $ from 'jquery';
import PerfectScrollbar from 'perfect-scrollbar';
import APLRenderer from '../APLRenderer';
import { Component, FactoryFunction, IComponentProperties } from './Component';
import { IScollOptions, Scrollable } from './Scrollable';
import { PropertyKey } from '../enums/PropertyKey';

/**
 * @ignore
 */
export interface IScrollViewProperties extends IComponentProperties {
    [PropertyKey.kPropertyScrollPosition] : number;
}

/**
 * @ignore
 */
export class ScrollView extends Scrollable<IScrollViewProperties> {

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.container.classList.add('scrollView');
    }

    public init() {
        super.init();
        const options : IScollOptions = {
            handlers: ['drag-thumb', 'touch', 'wheel'],
            suppressScrollX: true
        };
        this.scrollbar = new PerfectScrollbar(this.container, options);
        this.$container.css('overflow', 'hidden');
        this.registerScrollHandler((relativePosition) => {
            if (this.component) {
                this.component.updateScrollPosition(relativePosition);
            }
        });
        super.configureNavigation();

        // Override gap size to accomodate for padding
        if (this.children && this.children.length > 0) {
            const child = this.children[0];
            this.$startGap.css({
                top: child.bounds.top
            });
            this.$endGap.css({
                height: this.bounds.height - this.innerBounds.height - this.innerBounds.top,
                top: child.bounds.top + child.bounds.height
            });
        }
    }

    /**
     * @param component child component
     * @returns [offset,size on direction]
     * @memberof ScrollViewComponent
     */
    public getChildTopOffset(component : Component) : number {
        if (this.children.length === 0) {
            // no children
            return 0;
        }
        const topContainer = this.container;
        let element = component.container as HTMLElement;
        let top = 0;
        // use this instead of getClientBoundingRect to account for
        // scaling of the APLRenderer
        do {
            top += element.offsetTop  || 0;
            element = element.offsetParent as HTMLElement;
        } while (element && element !== topContainer);

        return top;
    }

    public async setProperties(props : IScrollViewProperties) {
        super.setProperties(props);
        // Since we are getting dirty properies from core
        // We will need to adjust our scroll position to match core's position
        if (PropertyKey.kPropertyScrollPosition in props) {
            this.container[this.scrollSide] = this.props[PropertyKey.kPropertyScrollPosition];
            // Sometimes the scroll does not get applied to Perfect Scroll and can be only applied through setTimeout()
            if (this.container[this.scrollSide] !== this.props[PropertyKey.kPropertyScrollPosition]) {
                setTimeout(() => {
                    this.container[this.scrollSide] = this.props[PropertyKey.kPropertyScrollPosition];
                }, 0);
            }
        }
    }

    public destroy() {
        super.destroy();
        $(this.container).off('scroll');
        this.scrollbar.destroy();
        (this.scrollbar as any) = undefined;
    }
}
