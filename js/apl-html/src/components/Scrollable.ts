/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import * as $ from 'jquery';
import throttle = require('lodash.throttle');
import { ScrollDirection } from '../enums/ScrollDirection';
import { Component, IComponentProperties } from './Component';
import { SCROLL_INTO_VIEW, FOCUSABLE_ELEMENT, DEFAULT_SECTION,
    SpatialNavigation, SectionType } from '../utils/SpatialNavigation';
import { ActionableComponent } from './ActionableComponent';

/**
 * @ignore
 */
export type ScrollHandler = (pos : number) => void;

/**
 * @ignore
 */
export interface IScollOptions {
    suppressScrollX? : boolean;
    suppressScrollY? : boolean;
    useBothWheelAxes? : boolean;
    scrollXMarginOffset? : number;
    scrollYMarginOffset? : number;
    handlers? : string[];
}

/**
 * @ignore
 */
export abstract class Scrollable<ScrollableProps = IComponentProperties>
    extends ActionableComponent<ScrollableProps> {

    public static FOCUS_SCROLL_VELOCITY : number = 5.0;

    public direction : ScrollDirection = ScrollDirection.kScrollDirectionVertical;
    protected scrollbar;
    protected length : 'width' | 'height' = 'height';
    protected scrollSize : 'scrollHeight' | 'scrollWidth' = 'scrollHeight';
    protected scrollSide : 'scrollTop' | 'scrollLeft' = 'scrollTop';
    protected side : 'left' | 'top' = 'top';
    protected listenerAdded : boolean;
    protected keyUp : boolean;
    protected spatialNavigationSection : string;
    protected hasFocusableChildren : boolean = false;

    // Other gap to allow scrolling in backwards direction
    protected startGap : HTMLDivElement = document.createElement('div');
    protected $startGap = $(this.startGap);

    // Provides a gap so we can scroll through the innerbounds
    protected endGap : HTMLDivElement = document.createElement('div');
    protected $endGap = $(this.endGap);

    private skipNextUpdate : boolean;
    private scrollHandler : ScrollHandler;
    private gapCount : number = 0;

    protected isLayout() : boolean {
        return true;
    }

    public async scrollToPosition(position : number, velocity : number) {
        const currentPosition = this.container[this.scrollSide];
        const pageSize = this.getPageSize();

        // Velocity is in pages per second so transform to duration
        const duration = Math.abs(position - currentPosition) / pageSize / Math.abs(velocity) * 1000;
        await new Promise<void>((res) => {
            const props = {};
            props[this.scrollSide] = position;
            $(this.container).animate(
                props, {
                    duration,
                    complete: () => {
                        this.skipNextUpdate = true;
                        res();
                    }
                }
            );
        });

        // Update with requested one to overcome scrolling precision problems
        this.scrollHandler(position);
    }

    /**
     * Scrolls by the number of pages
     * @param pages Number of pages to scroll
     * @param velocity Velocity in pages per second
     */
    public async scroll(pages : number, velocity : number) : Promise<void> {
        const position = this.container[this.scrollSide];
        const length = this.getPageSize();
        const distance = (pages * length);
        const offset = position + distance;
        await this.scrollToPosition(offset, velocity);
    }

    /**
     * Called by a command to stop scrolling
     */
    public stopScroll() {
        $(this.container).stop();
    }

    protected registerScrollHandler(handler : ScrollHandler) {
        this.scrollHandler = handler;

        // Only permit a single handler
        $(this.container).off('scroll');

        $(this.container).scroll(throttle(
            () => {
                const currentPosition = this.container[this.scrollSide];
                // This handler called after "complete" happen for requested scroll so skip if true
                if (!this.skipNextUpdate) {
                    this.scrollHandler(currentPosition);
                } else {
                    this.skipNextUpdate = false;
                }
            },
            100,
            { trailing: true, leading: true }));
    }

    protected allowFocus(requestedDistance : number, moveTo : HTMLDivElement) {
        return !(requestedDistance > this.getPageSize() + parseInt(moveTo.style[this.length], 10));
    }

    /**
     * Callback to figure out if focusing next target component allowed to SpatialNavigation.
     * Calculates distance to be traveled to get child into focus and decides if any other action should be taken.
     *
     * @param parent Top component controlling focusables.
     * @param id Scroll-to component ID.
     */
    protected moveAllowed(parent : Scrollable, id : string) : boolean {
        const movingTo : HTMLDivElement = parent.container.querySelector(`#${id}`);
        const child = movingTo.style;
        const childPos = parseInt(child[parent.side], 10) - parent.getScrollPosition();
        const childSize = parseInt(child[parent.length], 10);
        let dist = 0;
        if (childPos < 0 && (childPos + childSize) < 0) {
            dist = Math.abs(childPos);
        } else if (childPos + childSize > parent.getPageSize()) {
            dist = childPos - parent.getPageSize() + childSize;
        }

        if (parent.allowFocus(dist, movingTo)) {
            return true;
        }

        // If we can't get component into focus (as there are no focusable component or its too far)
        // just scroll 1 page into requested direction.
        if (childPos < 0) {
            parent.scroll(-1, Scrollable.FOCUS_SCROLL_VELOCITY);
        } else {
            parent.scroll(1, Scrollable.FOCUS_SCROLL_VELOCITY);
        }
        parent.focus();
        return false;
    }

    protected initScrollGap(gap : HTMLElement, sectionId : string) : void {
        const $gap = $(gap);
        gap.id = `gap-${this.id.replace(/\W/g, '')}-${this.gapCount}`;
        this.gapCount++;
        const size = {
            position : 'absolute',
            width : this.scrollSide === 'scrollLeft' ? 0 : this.bounds.width,
            height : this.scrollSide === 'scrollLeft' ? this.bounds.height : 0
        };
        $gap.css(size);
        SpatialNavigation.makeNavigable(gap, sectionId, super.focus, super.blur, this.moveAllowed, this);
    }

    protected overrideSpatialNavigationSection(container : Element) : boolean {
        let changed : boolean = false;
        const focusableElements = Array.from(container.getElementsByClassName(FOCUSABLE_ELEMENT));
        focusableElements.forEach((element : HTMLElement) => {
            element.classList.remove(DEFAULT_SECTION);
            element.classList.add(this.spatialNavigationSection);
            changed = true;
        });
        return changed;
    }

    public configureNavigation() {
        this.spatialNavigationSection = SpatialNavigation.getSectionName(this.id);
        this.container.addEventListener(SCROLL_INTO_VIEW, (event : CustomEvent) => {
            if (event.detail.id.startsWith('gap')) {
                // Get gap position and scroll to it.
                const child : HTMLElement = this.container.querySelector(`#${event.detail.id}`);
                const pos = parseInt($(child).css(this.side), 10);
                if (pos < this.getScrollPosition()) {
                    this.scrollToPosition(pos, Scrollable.FOCUS_SCROLL_VELOCITY);
                } else if (pos > this.getScrollPosition() + this.getPageSize()) {
                    this.scrollToPosition(pos - this.getPageSize(), Scrollable.FOCUS_SCROLL_VELOCITY);
                }
            } else {
                this.scrollComponentInView(event.detail.id);
            }
        });

        this.initScrollGap(this.startGap, this.spatialNavigationSection);
        this.container.insertBefore(this.startGap, this.container.children[0]);

        this.initScrollGap(this.endGap, this.spatialNavigationSection);
        this.container.appendChild(this.endGap);

        if (!SpatialNavigation.enabled()) {
            return;
        }

        if (!this.overrideSpatialNavigationSection(this.container)) {
            this.hasFocusableChildren = true;
        }

        // Help SpatialNavigation to not jump around when in scrollable.
        SpatialNavigation.addSection(this.spatialNavigationSection, SectionType.SELF_FIRST);
        this.container.addEventListener('focus', (event) => {
            event.stopPropagation();
            SpatialNavigation.focus(this.spatialNavigationSection);
        });
    }

    private scrollComponentInView(id : string) {
        const child = this.renderer.componentMap[id] as Component;
        const childPos = child.component.getBoundsInParent(this.component);
        const target = childPos[this.side];
        const resultingOffset = this.adjustVisible(
            target - this.getScrollPosition(),
            this.getPageSize(),
            childPos[this.length]);
        this.scrollToPosition(this.getScrollPosition() + resultingOffset, Scrollable.FOCUS_SCROLL_VELOCITY);
    }

    public getScrollPosition() : number {
        return this.container[this.scrollSide];
    }

    public getScrollLength() : number {
        return this.container[this.scrollSize];
    }

    public getPageSize() : number {
        return this.bounds[this.length];
    }

    public getDirection() : ScrollDirection {
        return this.direction;
    }

    private adjustVisible(offset : number, pageSize : number, componentSize : number) : number {
        let result = offset;
        if (result <= 0) {
            if (result + componentSize > pageSize) {
                // Component is big and already visible so ignore
                return 0;
            } else {
                if (componentSize < pageSize) {
                    // Adjust visibility as crossing on top
                    return result;
                }
                // FALLTHROUGH: Adjust visibility for big one crossing on top
            }
        } else {
            if (result + componentSize < pageSize) {
                // Component is small and already visible so ignore
                return 0;
            } else {
                if (componentSize > pageSize) {
                    // Adjust visibility for big one crossing on bottom
                    return result;
                }
                // FALLTHROUGH: Adjust visibility for one crossing on bottom
            }
        }
        result -= (pageSize - componentSize);

        return result;
    }
}
