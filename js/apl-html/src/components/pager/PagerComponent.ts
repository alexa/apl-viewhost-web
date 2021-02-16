/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import { Navigation } from '../../enums/Navigation';
import { PropertyKey } from '../../enums/PropertyKey';
import { UpdateType } from '../../enums/UpdateType';
import { Component, FactoryFunction, IComponentProperties } from '../Component';
import { ActionableComponent } from '../ActionableComponent';
import { FOCUSABLE_ELEMENT, DEFAULT_SECTION, SpatialNavigation,
    SectionType, Direction } from '../../utils/SpatialNavigation';

type CallbackFunction = () => void;

/**
 * @ignore
 */
export interface IPagerProperties extends IComponentProperties {
    [PropertyKey.kPropertyInitialPage] : number;
    [PropertyKey.kPropertyNavigation] : Navigation;
    [PropertyKey.kPropertyCurrentPage] : number;
}

interface IItem {
    id : string;
    component : Component;
}

/**
 * @ignore
 */
export class PagerComponent extends ActionableComponent<IPagerProperties> {

    /**
     * The delay (in ms) used between transitions of the pager
     * @type {number}
     */
    public static readonly ANIMATION_DELAY : number = 600;

    /**
     * Whether forwards navigation (controlled by the user) is permitted
     */
    private allowForwardsNav : boolean;

    /**
     * Whether backwards navigation (controlled by the user) is permitted
     */
    private allowBackwardsNav : boolean;

    private currentPage : number;
    private navigation : Navigation;
    private bufferSize : number;
    private childCache : IItem[];
    private memArraySize : number;
    private setPagePromise : Promise<void>;
    private setPageCallback : undefined | CallbackFunction;
    private lastExitAttemptDirection : Direction;
    private wrap : boolean = true;
    private xAxis = null;

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.bufferSize = 1;
        this.memArraySize = (this.bufferSize * 2) + 1;
        this.childCache = new Array(this.memArraySize);

        this.propExecutor
            (this.ensurePages, PropertyKey.kPropertyNotifyChildrenChanged);
    }

    protected isLayout() : boolean {
        return true;
    }

    /**
     * To figure out where the user's starting point is to find out if to slide LEFT or RIGHT
     * @param e User's binding event
     */
    private initialPoint(e) {
        const val = e.changedTouches ? e.changedTouches[0] : e;
        this.xAxis = val.clientX;
    }

    /**
     * This will animate the page slide from previous to next
     * @param pageFrom The div's index of which page it's transition from
     * @param pageTo The div's index of which page it's transition to
     * @param shiftToLeft To proceed to the next page
     */
    private animate(pageFrom : number, pageTo : number, shiftToLeft : boolean) {
        const nextSection = SpatialNavigation.getSectionName(this.id,
                                                this.container.children[pageTo].children[0].id);
        this.getAffectedSections(this.container.children[pageFrom]).forEach((section) => {
            SpatialNavigation.disable(section);
        });
        $(this.container.children[pageFrom])
            .css({ left: 0, opacity: 1 })
            .animate({ left: shiftToLeft ? '-10%' : '+10%', opacity: 0 },
                {
                    duration: PagerComponent.ANIMATION_DELAY,
                    complete() {
                        $(this).hide();
                    }
                });
        this.getAffectedSections(this.container.children[pageTo]).forEach((section) => {
            SpatialNavigation.enable(section);
        });
        SpatialNavigation.focus(nextSection);
        $(this.container.children[pageTo])
            .css({left: shiftToLeft ? '+10%' : '-10%', opacity: 0})
            .show()
            .animate({left: 0, opacity: 1},
                {
                    duration: PagerComponent.ANIMATION_DELAY,
                    complete() {
                        $(this).show();
                    }
                });
    }

    /**
     * This will create the item from core and insert at a particular position in the child of pager div
     * @param index Index of the element to create
     * @param insertAt Position of the new div
     * @param initialPage Is it called by the init()? - If so make the div visible
     * @param updatePage Is it called by updatePage()? - If so createItem regradless if it's in the list
     */
    private createItem(index : number, insertAt : number,
                       initialPage : boolean = false, updatePage : boolean = false) : IItem {
        if (!this.component.getChildAt(index)) {
            return null;
        }
        const id = this.component.getChildAt(index).getUniqueId();
        if (updatePage || !this.childCache.some((iter) => iter ? iter.id === id : false)) {
            const component = this.factory(this.renderer, this.component.getChildAt(index), this, true);
            const wrapper : HTMLDivElement = document.createElement('div');
            const child = component.container;
            const section = SpatialNavigation.getSectionName(this.id, child.id);
            $(child).css({
                left: 0, right: 0
            });

            // When we don't know how to exit section, so "simulate" it
            child.addEventListener('sn:navigatefailed', (event : CustomEvent) => {
                const pageCount = this.component.getChildCount();
                event.stopPropagation();
                // If pager configuration allows it, use attempted focus navigation
                // direction to change pager page
                if (event.detail.direction === 'left' && this.allowBackwardsNav &&
                        (this.currentPage !== 0 || this.wrap)) {
                    this.swipePage(false);
                } else if (event.detail.direction === 'right' && this.allowForwardsNav &&
                        (this.currentPage !== pageCount || this.wrap)) {
                    this.swipePage(true);
                } else if (this.lastExitAttemptDirection !== event.detail.direction) {
                    this.lastExitAttemptDirection = event.detail.direction;
                    // Pager inside of a pager is not supported.
                    // Release page section focus navigation restriction to allow
                    // focus to move to component outside pager in the specified direction
                    SpatialNavigation.set(section, {restrict: SectionType.NONE});
                    SpatialNavigation.move(event.detail.direction);
                    SpatialNavigation.set(section, {restrict: SectionType.SELF_ONLY});
                }
            });

            const focusableElements = child.getElementsByClassName(FOCUSABLE_ELEMENT);

            if (focusableElements.length === 0) {
                SpatialNavigation.makeNavigable(child, section, (child as any).navFocus, (child as any).navBlur);

                // When the page item will lose focus, reset last exit direction
                child.addEventListener('sn:willunfocus', (event : CustomEvent) => {
                    event.stopPropagation();
                    this.lastExitAttemptDirection = null;
                });
            } else {
                // Override default section for children
                Array.from(focusableElements).forEach((element : HTMLElement) => {
                    element.classList.remove(DEFAULT_SECTION);
                    element.classList.add(section);

                    // When a page child will lose focus, reset last exit direction
                    element.addEventListener('sn:willunfocus', (event : CustomEvent) => {
                        event.stopPropagation();
                        this.lastExitAttemptDirection = null;
                    });
                });
            }

            if (insertAt >= this.container.children.length - 1) {
                this.container.appendChild(wrapper);
            } else {
                this.container.insertBefore(wrapper, this.container.children[insertAt]);
            }
            wrapper.appendChild(child);

            $(wrapper).css({
                opacity: initialPage ? 1 : 0,
                pointerEvents: 'none',
                position: 'absolute'
            });

            // Init by restricting focus navigation to page section
            SpatialNavigation.addSection(section, SectionType.SELF_ONLY);
            if (!initialPage) {
                this.getAffectedSections(child).forEach((sc) => {
                    SpatialNavigation.disable(sc);
                });
            }

            return { component, id };
        }
        return null;
    }

    /**
     * ensurePage will create and layout the pager component (and it's children) for pages
     * one above and one below the current page.
     */
    private async ensurePages() {
        if (this === undefined) {
            // sometimes component is build after this is called.
            return;
        }
        this.currentPage = this.getCurrentPage();
        const childCount = this.component.getChildCount();
        // Check if the anchor page has been modified by dirty property
        // This happens when current page you are on is removed
        const anchorId = this.component.getChildAt(this.currentPage).getUniqueId();
        if (this.childCache[this.bufferSize] && anchorId !== this.childCache[this.bufferSize].id) {
            this.cleanCache();
            this.childCache = new Array(this.memArraySize);
            this.container.innerHTML = '';
            const item = this.createItem(this.currentPage, this.bufferSize, true);
            this.childCache[this.bufferSize] = item;
        }
        for (let i = 0; i < this.bufferSize; i++) {
            const lowerBound = this.currentPage - this.bufferSize + i;
            const upperBound = this.currentPage + 1 + i;
            if (lowerBound === -1 && childCount > 2) {
                const item = this.createItem(childCount - 1, i);
                if (item) { this.updateCacheDiv(0, item); }
            } else if (lowerBound >= 0) {
                const item = this.createItem(lowerBound, i);
                if (item) { this.updateCacheDiv(this.bufferSize - i - 1, item); }
            }
            if (upperBound <= childCount) {
                const item = this.createItem(upperBound === childCount ? 0 : upperBound, this.bufferSize + i + 1);
                if (item) { this.updateCacheDiv(this.bufferSize + i + 1, item); }
            }
        }
    }

    /**
     * Add to childCache, however before adding we need to remove exiisting
     * pages that might be store on cache
     * @param index Index of the item to be replaced
     * @param item Item to be replaced
     */
    private updateCacheDiv(index : number, item : IItem) {
        this.removePage(index, true);
        this.childCache[index] = item;
    }

    /**
     * Clean the child cache when the current page is removed.
     */
    private cleanCache() {
        for (let i = 0; i < this.memArraySize; i++) {
            this.removePage(i);
        }
    }

    /**
     * Remove page/div/section from
     *  - childCache
     *  - div container
     *  - SpatialNavigation
     * @param index index to be removed
     * @param nextDiv this is required for ensurePage since we will be creating
     * a new item initially, so we need to remove the next item in place.
     */
    private removePage(index : number, nextDiv : boolean = false) {
        if (this.childCache[index] != null) {
            const section = SpatialNavigation.getSectionName(this.id, this.childCache[index].id);
            this.childCache[index].component.destroy();
            const sectionToRemove = this.container.children[nextDiv ? index + 1 : index];
            if (sectionToRemove) {
                sectionToRemove.remove();
            }
            SpatialNavigation.removeSection(section);
        }
    }

    /**
     * Once user has transitioned to another page we will need to update the buffer list
     * This will ensureLayout on the page above and below + wrap
     * @param index The new page that needs to be injected
     * @param shiftToLeft To proceed to the next page
     */
    public injectPages(index : number, shiftToLeft : boolean) {
        this.currentPage =  this.getCurrentPage();
        if (shiftToLeft) {
            // Add page to the end
            this.removePage(0);
            this.childCache.shift();
            this.childCache[this.childCache.length] = this.createItem(index, this.bufferSize + 1, false, true);
        } else {
            // Add page to the beginning
            this.removePage(this.childCache.length - 1);
            this.childCache.unshift(this.createItem(index, 0, false, true));
            this.childCache.pop();
        }
    }

    /**
     * User's touch swiping binding
     * @param e User's binding event
     */
    public touchSwipe(e) {
        if (this.xAxis || this.xAxis === 0) {
            const val = e.changedTouches ? e.changedTouches[0] : e;
            const shiftToLeft = Math.sign(val.clientX - this.xAxis) <= 0;
            this.currentPage =  this.getCurrentPage();
            const pageCount = this.component.getChildCount();

            if ((shiftToLeft && this.allowForwardsNav && (this.currentPage !== pageCount - 1 || this.wrap)) ||
                    (!shiftToLeft && this.allowBackwardsNav && (this.currentPage !== 0 || this.wrap))) {
                this.swipePage(shiftToLeft);
                this.xAxis = null;
            }
        }
    }

    /**
     * Once user has swiped this will be called and will animate accordingly along with updating the page
     * @param shiftToLeft To proceed to the next page
     */
    private swipePage(shiftToLeft : boolean) {
        this.currentPage =  this.getCurrentPage();
        const childCount = this.component.getChildCount();
        let newIndex = this.currentPage;
        let updatePage = newIndex;
        const elementsinArray = (this.childCache as any).filter((value) => value != null).length;
        // Single page will not swipe
        if (elementsinArray === 1) {
            return;
        // 2 Page elements
        } else if (elementsinArray === 2) {
            this.animate(this.currentPage, +!this.currentPage, shiftToLeft);
        // Full array used
        } else {
            this.animate(this.bufferSize, shiftToLeft ? 2 : 0, shiftToLeft);
        }
        if (shiftToLeft) {
            newIndex = (newIndex + 1 === childCount) ? 0 : newIndex + 1;
            updatePage = (newIndex + 1 === childCount) ? 0 : newIndex + 1;
        } else {
            newIndex = (newIndex - 1 < 0) ? childCount - 1 : newIndex - 1;
            updatePage = (newIndex - 1 < 0) ? childCount - 1 : newIndex - 1;
        }

        if (this.setPagePromise) {
            this.component.update(UpdateType.kUpdatePagerByEvent, newIndex);
            this.setPageCallback();
            this.setPagePromise = undefined;
        } else {
            // User inflicted with swipe.
            this.component.update(UpdateType.kUpdatePagerPosition, newIndex);
        }
        // We already know to wrap or else this method will never be called
        if (updatePage === -1) {
            updatePage = childCount - 1;
        }

        if (elementsinArray !== 2) {
            this.injectPages(updatePage, shiftToLeft);
        }
        // for testing
        this.emit('onPageEnded', this.getCurrentPage());
    }

    public async init() {
        const props = this.component.getCalculated() as IPagerProperties;
        // Check to see if there are only two (or less) pages if so we want the anchor point to be at position 0.
        // Otherwise anchor point will always be in the middle (position 1)
        const index = this.component.getChildCount() > 2 ? 1 : 0;
        this.currentPage = this.getCurrentPage();
        this.childCache[this.bufferSize] = this.createItem(this.currentPage, index, true);
        this.setProperties(props);

        this.container.addEventListener('focus', this.focusCurrentPage);
        this.container.addEventListener('mousedown', this.initialPoint.bind(this), true);
        this.container.addEventListener('touchstart', this.initialPoint.bind(this), {passive: true});
        this.container.addEventListener('mouseup', this.touchSwipe.bind(this), true);
        this.container.addEventListener('touchend', this.touchSwipe.bind(this), {passive: true});
    }

    /**
     * This will be called whenever the page index has changed or any properies so we need to ensure pages again
     * @param props New properties from the CORE
     */
    public async setProperties(props : IPagerProperties) {
        super.setProperties(props);
        if (PropertyKey.kPropertyInitialPage in props) {
            this.currentPage = props[PropertyKey.kPropertyInitialPage];
        }

        if (PropertyKey.kPropertyNavigation in props) {
            this.navigation = props[PropertyKey.kPropertyNavigation] as Navigation;
            this.wrap = this.navigation === Navigation.kNavigationWrap;
            this.allowForwardsNav = this.navigation !== Navigation.kNavigationNone;
            this.allowBackwardsNav = this.navigation !== Navigation.kNavigationNone &&
                this.navigation !== Navigation.kNavigationForwardOnly;
        }
        await this.ensurePages();
    }

    /**
     * Return an array of all the focusable element within the component
     * @param parent parent element to start from
     */
    private getAffectedSections(parent : Element) : string[] {
        const affectedSections = new Set<string>();
        const elements = Array.from(parent.getElementsByClassName(FOCUSABLE_ELEMENT));
        elements.push(parent);
        elements.forEach((element : HTMLElement) => {
            element.classList.remove(DEFAULT_SECTION);
            Array.from(element.classList).forEach((elClass) => {
                if (elClass.startsWith('section-')) {
                    affectedSections.add(elClass);
                }
            });
        });
        return Array.from(affectedSections);
    }

    /**
     * Sets the page which is currently displayed by the pager
     * @param {number} value The distance to move
     */
    public async setPage(value : number) {
        // for testing
        this.emit('onPageStarted', this.getCurrentPage(), value);
        this.setPagePromise = new Promise<void>((res) => {
            this.setPageCallback = res;
        });

        const shiftToLeft = value > this.getCurrentPage() || value === 0;
        const id = this.component.getChildAt(value).getUniqueId();

        // Check to see if the id has been already ensured
        if (!this.childCache.some((i) => i.id === id)) {
            // Remove existing pages
            for (let index = this.childCache.length - 1; index >= 0; index--) {
                this.removePage(index);
            }
            this.childCache = new Array(this.memArraySize);
            this.container.innerHTML = '';

            // Update the Page & ensure new page
            this.component.update(UpdateType.kUpdatePagerPosition, value);
            this.currentPage = value;
            this.childCache[this.bufferSize] = this.createItem(this.currentPage, 0, true);
            await this.ensurePages();
            shiftToLeft ? this.animate(0, 1, shiftToLeft) : this.animate(2, 1, shiftToLeft);
        } else {
            this.swipePage(shiftToLeft);
        }

        await this.setPageCallback();
    }

    /**
     * Returns the page currently being displayed by this component
     * @returns {number} The currently displayed page
     */
    public getCurrentPage() : number {
        const props = this.component.getCalculated() as IPagerProperties;
        return props[PropertyKey.kPropertyCurrentPage];
    }

    /**
     * @override
     * @returns The value of the component, as defined by the APL specification
     * @return {any}
     */
    public getValue() : any {
        return this.getCurrentPage();
    }

    public focusCurrentPage(event : Event) {
        event.stopPropagation();
        let section : string;
        if (this.children[1]) {
            section = SpatialNavigation.getSectionName(this.id, this.children[1].children[0].id);
        } else {
            section = SpatialNavigation.getSectionName(this.id, this.children[0].children[0].id);
        }
        SpatialNavigation.focus(section);
    }
}
