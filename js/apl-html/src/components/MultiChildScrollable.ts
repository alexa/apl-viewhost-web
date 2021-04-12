/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { PropertyKey } from '../enums/PropertyKey';
import { ScrollDirection } from '../enums/ScrollDirection';
import { Component, FactoryFunction, IComponentProperties } from './Component';
import { Scrollable } from './Scrollable';
import { Text } from './text/Text';
import { ChildAction } from '../utils/Constant';

/**
 * @ignore
 */
export interface IMultiChildScrollableProperties extends IComponentProperties {
    [PropertyKey.kPropertyScrollDirection] : ScrollDirection;
    [PropertyKey.kPropertyScrollPosition] : number;
    [PropertyKey.kPropertyNotifyChildrenChanged] : any;
}

export interface IItem {
    index : number;
    component : Component;
    prev? : IItem;
    next? : IItem;
}

/**
 * @ignore
 */
export abstract class MultiChildScrollable extends Scrollable<IMultiChildScrollableProperties> {

    private childCount : number;
    private first : IItem;
    private last : IItem;
    private childCache = new Set();
    protected fullyLoaded = false;

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.container.classList.add('scrollView');
        this.childCount = component.getChildCount();
        // override or add more propExecutors
        this.propExecutor
        (this.updateUponChildrenChange, PropertyKey.kPropertyNotifyChildrenChanged)
        (this.setScrollDirection, PropertyKey.kPropertyScrollDirection);
    }

    public init() {
        const props = this.component.getCalculated() as IMultiChildScrollableProperties;
        this.setProperties(props);
        // Sequence is soo special.
        this.alignSize();

        this.$container.css('overflow', 'hidden');

        if (this.childCount > 0) {
            this.first = this.last = this.createItem(0);
            requestAnimationFrame(this.onUpdate);
        }

        // Override gap size to accomodate for padding
        const endGapWidth : number = parseInt(this.$endGap.css('width'), 10);
        const endGapHeight : number = parseInt(this.$endGap.css('height'), 10);
        this.$endGap.css({
            position: 'absolute',
            width:  endGapWidth ? endGapWidth
                : Math.max(1, this.bounds.width - this.innerBounds.width - this.innerBounds.left),
            height: endGapHeight ? endGapHeight
                : Math.max(1, this.bounds.height - this.innerBounds.height - this.innerBounds.top)
        });
    }

    public async setProperties(props : IMultiChildScrollableProperties) {
        super.setProperties(props);
        // Since we are getting dirty properies from core (ie. updates to the sequence)
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
        this.isDestroyed = true;
    }

    protected allowFocus(requestedDistance : number, moveTo : HTMLDivElement) {
        return !(requestedDistance > this.getPageSize() + parseInt(moveTo.style[this.length], 10)) &&
            (moveTo !== this.endGap || this.fullyLoaded);
    }

    private adjustIndices(target : IItem, insert : boolean) {
        while (target) {
            insert ? target.index++ : target.index--;
            target = target.next;
        }
    }

    // Override the behavior based on NotifyChildrenChanged
    private updateUponChildrenChange = () => {
        // Check if core is sending NotifyChildrenChanged.
        // If so we need to update our index accordingly
        for (const child of this.props[PropertyKey.kPropertyNotifyChildrenChanged]) {
            // Check if the child is before our first element's index in our sequence
            if (child.index <= this.first.index) {
                // remove 1st element
                if (child.action === ChildAction.Remove && this.first.index === child.index) {
                    this.childCache.delete(this.first.component.id);
                    this.container.children[child.uid].remove();
                    this.first.component.destroy();
                    this.first = this.first.next;
                }
                this.adjustIndices(this.first, child.action === ChildAction.Insert);
            // Check if child is inbetween the visible sequence
            } else if (child.index > this.first.index && child.index <= this.last.index) {
                let curr = this.first;
                while (curr && curr.index !== child.index) {
                    curr = curr.next;
                }
                if (child.action === ChildAction.Insert) {
                    const next : IItem = this.createItem(child.index, curr.index);
                    if (next) {
                        curr = curr.prev;
                        const tmp = curr.next;
                        curr!.next = next;
                        next.prev = curr;
                        curr = next as IItem;
                        curr.index = next.index;
                        curr.next = tmp;
                        tmp.prev = curr;
                        this.adjustIndices(curr.next, true);
                    }
                } else if (child.action === ChildAction.Remove) {
                    this.childCache.delete(curr.component.id);
                    this.container.children[child.uid].remove();
                    curr.component.destroy();
                    const index = curr.prev.index;
                    curr.prev.next = curr.next;
                    if (curr.next) { curr.next.prev = curr.prev; }
                    curr = curr.prev;
                    curr.index = index;
                    // Last element got deleted
                    if (!curr.next) { this.last = curr; }
                    this.adjustIndices(curr.next, false);
                } else {
                    this.logger.warn(`Invalid action type ${child.action} for child ${child.uid}`);
                }
            }
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

    private createItem(index : number, insertAt : number = -1) : IItem {
        if (this.childCache.has(this.component.getChildAt(index).getUniqueId())) {
            return null;
        }
        const component = this.factory(this.renderer, this.component.getChildAt(index), this, true, insertAt);
        this.childCache.add(component.id);
        if (component instanceof Text) {
            component.setDimensions();
        }
        return { component, index };
    }

    private onUpdate = () => {
        if (this.isDestroyed) {
            return;
        }
        this.props = this.component.getCalculated() as IMultiChildScrollableProperties;
        this.childCount = this.component.getChildCount();
        if (this.childCount <= 0) {
            return;
        }
        const position = this.props[PropertyKey.kPropertyScrollPosition];

        const buffer = this.bounds[this.length] / 2;
        const topLimit = position - buffer;
        const bottomLimit = position + this.bounds[this.length] + buffer;

        let index = this.first.index;
        let childBounds = this.first.component.component.getBoundsInParent(this.component);

        // remove elements from the top
        // we need make sure index is in scope && child bound under top limit
        while (index < this.childCount - 1 &&
            (childBounds[this.side] + childBounds[this.length]) < topLimit &&
            childBounds[this.side] > childBounds[this.length]) {
            this.childCache.delete(this.first.component.id);
            this.first.component.destroy();
            const next = this.first.next;
            this.first.next = undefined;
            next!.prev = undefined;
            this.first = next as IItem;
            index = this.first.index;
            childBounds = this.first.component.component.getBoundsInParent(this.component);
        }

        // add elements to the top
        // We check if first got any space before it and add previous if yes
        while (index > 0 &&
        (childBounds[this.side]) > topLimit) {
            const prev : IItem = this.createItem(index - 1);
            if (prev) {
                this.first!.prev = prev;
                prev.next = this.first;
                this.first = prev as IItem;
                index = this.first.index;
                childBounds = this.first.component.component.getBoundsInParent(this.component);
                const cssProp = {};
                cssProp[this.side] = Math.min(childBounds[this.side], parseInt(this.$startGap.css(this.side), 10));
                this.$startGap.css(cssProp);
            } else {
                break;
            }
        }

        // remove elements from the bottom
        index = this.last.index;
        childBounds = this.last.component.component.getBoundsInParent(this.component);
        while (index > 0 &&
        childBounds[this.side] > bottomLimit + childBounds[this.length]) {
            this.childCache.delete(this.last.component.id);
            this.last.component.destroy();
            const prev = this.last.prev;
            this.last!.prev = undefined;
            prev!.next = undefined;
            this.last = prev as IItem;
            index = this.last.index;
            childBounds = this.last.component.component.getBoundsInParent(this.component);
        }

        // add elements to the bottom
        // We want to check if there are some space after current element and add next one if true.
        while (index < this.childCount - 1 &&
        (childBounds[this.side]) <= bottomLimit) {
            if (this.container[this.scrollSide] !== position) {
                setTimeout(() => { this.container[this.scrollSide] = position; }, 0);
            }
            const next : IItem = this.createItem(index + 1, this.container.children.length - 1);
            if (next) {
                this.last!.next = next;
                next.prev = this.last;
                this.last = next as IItem;
                index = this.last.index;
                childBounds = this.last.component.component.getBoundsInParent(this.component);
                const cssProp = {};
                cssProp[this.side] = Math.max(childBounds[this.side] + childBounds[this.length],
                    parseInt(this.$startGap.css(this.side), 10));
                this.$endGap.css(cssProp);
                if (index === this.childCount - 1) {
                    this.fullyLoaded = true;
                }
            } else {
                break;
            }
        }

        requestAnimationFrame(this.onUpdate);
    }
}
