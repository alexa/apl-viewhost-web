/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import { Navigation } from '../../enums/Navigation';
import { PropertyKey } from '../../enums/PropertyKey';
import { Component, FactoryFunction, IComponentProperties } from '../Component';
import { ActionableComponent } from '../ActionableComponent';

/**
 * @ignore
 */
export interface IPagerProperties extends IComponentProperties {
    [PropertyKey.kPropertyInitialPage] : number;
    [PropertyKey.kPropertyCurrentPage] : number;
}

interface IItem {
    index : number;
    id : string;
    component : Component;
}

/**
 * @ignore
 */
export class PagerComponent extends ActionableComponent<IPagerProperties> {

    // set array bufferSize to 3
    public static readonly DIRECTIONAL_CACHE_PAGES : number = 3;

    private currentPage : number;
    private navigation : Navigation;
    private childCache : IItem[];
    private wrap : boolean = true;

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.childCache = new Array(PagerComponent.DIRECTIONAL_CACHE_PAGES);
        this.propExecutor(this.setCurrentPage, PropertyKey.kPropertyNotifyChildrenChanged);
        this.$container.css({
            overflow: 'hidden'
        });
    }

    protected isLayout() : boolean {
        return true;
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
            const child = component.container;
            $(child).css({
                left: 0, right: 0
            });

            if (insertAt >= this.container.children.length - 1) {
                this.container.appendChild(child);
            } else {
                this.container.insertBefore(child, this.container.children[insertAt]);
            }
            return {index, component, id };
        }
        return null;
    }

    /**
     * ensurePage will create and layout the pager component (and it's children) for pages
     * one above and one below the current page.
     */
    private async setCurrentPage() {
        if (this === undefined) {
            // sometimes component is build after this is called.
            return;
        }
        const pagesToCache = new Set<number>();
        pagesToCache.add(this.currentPage);
        pagesToCache.add(this.getCoreCurrentPage());
        this.currentPage = this.getCoreCurrentPage();
        this.updateCache(pagesToCache);
        await this.updateVisibility();
        this.container.focus();
    }

    private async updateVisibility() {
        for (const child of this.childCache) {
            if (child && child.component) {
                const displayed = await this.isDisplayed(child.id);
                child.component.forceInvisible(!displayed);
            }
        }
    }

    private async isDisplayed(id : string) {
        const displayedChildCount = await this.getDisplayedChildCount();
        for (let childIndex = 0; childIndex < displayedChildCount; childIndex++) {
            const displayedId = await this.component.getDisplayedChildId(childIndex);
            if (displayedId === id) {
                return true;
            }
        }
        return false;
    }

    private async setPages(pagesToCache : Set<number>) {
        this.childCache.forEach((item, index, obj) => {
            if (item !== null) {
                if (pagesToCache.has(item.index)) {
                    pagesToCache.delete(item.index);
                } else {
                    item.component.destroy();
                    obj.splice(index, 1);
                }
            }
        });

        for (const pc of pagesToCache) {
            this.childCache.push(this.createItem(pc, pc));
        }
    }

    private async updateCache(pagesToCache : Set<number>) {
        const isWrap : boolean = this.wrap;

        // add left index to the cache
        let leftIdx = this.currentPage - 1;
        if (leftIdx < 0) {
            leftIdx = isWrap ? this.component.getChildCount() - 1 : 0;
        }
        pagesToCache.add(leftIdx);

        // add right index to the cache
        const end = this.component.getChildCount() - 1;
        let rightIdx = this.currentPage + 1;
        if (rightIdx > end) {
            rightIdx = isWrap ? 0 : end;
        }
        pagesToCache.add(rightIdx);
        this.setPages(pagesToCache);
    }

    public async init() {
        const props = this.component.getCalculated() as IPagerProperties;
        this.setProperties(props);
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
        }

        await this.setCurrentPage();
    }

    /**
     * Returns the page currently being displayed by this component
     * @returns {number} The currently displayed page
     */
    public getCoreCurrentPage() : number {
        const props = this.component.getCalculated() as IPagerProperties;
        return props[PropertyKey.kPropertyCurrentPage];
    }

    /**
     * @override
     * @returns The value of the component, as defined by the APL specification
     * @return {any}
     */
    public getValue() : any {
        return this.getCoreCurrentPage();
    }
}
