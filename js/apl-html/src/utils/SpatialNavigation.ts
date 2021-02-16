/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

const SpatialNavigationJS = require('spatial-navigation-js');

export const FOCUSABLE_ELEMENT = 'focusable-element';
export const DEFAULT_SECTION = 'section-default';
export const SCROLL_INTO_VIEW = 'scrollIntoView';

export type MoveAllowedFuction = ((parent : any, id : string) => boolean);

export enum SectionType {
    NONE = 'none',
    SELF_FIRST = 'self-first',
    SELF_ONLY = 'self-only'
}

export type Direction  = 'left' | 'right' | 'up' | 'down';

export class SpatialNavigation {
    private static navigationEnabled = false;

    public static init() {
        if (!this.navigationEnabled) {
            SpatialNavigationJS.init();
            this.navigationEnabled = true;
        }
    }

    public static uninit() {
        if (this.navigationEnabled) {
            SpatialNavigationJS.clear();
            SpatialNavigationJS.uninit();
            this.navigationEnabled = false;
        }
    }

    public static enabled() : boolean {
        return this.navigationEnabled;
    }

    public static getSectionName(id : string, subid : string = 'x') : string {
        return `section-${id.replace(/\W/g, '')}-${subid.replace(/\W/g, '')}`;
    }

    public static addSection(sectionId : string, type : SectionType = SectionType.NONE, straight : boolean = false) {
        if (!this.navigationEnabled) {
            return;
        }

        const selector = `.${FOCUSABLE_ELEMENT}.${sectionId}`;
        SpatialNavigationJS.add(sectionId, {
            selector,
            restrict: type,
            straightOnly: straight
        });
        SpatialNavigationJS.makeFocusable(sectionId);
    }

    public static removeSection(sectionId : string) {
        SpatialNavigationJS.remove(sectionId);
    }

    public static makeNavigable(element : HTMLElement, sectionId : string = DEFAULT_SECTION,
                                focusFunction = (() => {}), blurFunction = (() => {}),
                                allowedFunction : MoveAllowedFuction = (() => true),
                                parent : any = undefined) {
        if (!this.navigationEnabled) {
            return;
        }

        element.classList.add(FOCUSABLE_ELEMENT);
        element.classList.add(sectionId);

        element.addEventListener('sn:willfocus', (event : CustomEvent) => {
            if (parent && !allowedFunction(parent, element.id)) {
                event.preventDefault();
                return;
            }
            const sivEvent = new CustomEvent(SCROLL_INTO_VIEW, { bubbles: true, detail: {id: element.id} });
            element.dispatchEvent(sivEvent);
        });

        element.addEventListener('sn:focused', (event : CustomEvent) => {
            event.stopPropagation();
            if (focusFunction) {
                focusFunction();
            }
        });

        // For now just propagate blur
        element.addEventListener('sn:unfocused', (event : CustomEvent) => {
            event.stopPropagation();
            if (blurFunction) {
                blurFunction();
            }
        });

        // Ensure elements added after initialization is focusable after click.
        element.tabIndex = -1;
    }

    /**
     * Add touchWrapper and scrollView as focusable elements and focus the first navigable element
     */
    public static setFocusableComponents() {
        if (!this.navigationEnabled) {
            return;
        }

        // Define navigable elements (elements with "focusable-element" class).
        SpatialNavigation.addSection(DEFAULT_SECTION);
        SpatialNavigationJS.setDefaultSection(DEFAULT_SECTION);

        // Make the *currently existing* navigable elements focusable.
        SpatialNavigationJS.makeFocusable();
    }

    /**
     * Set/update config for specified section with the given sectionId
     * @param sectionId
     * @param config
     */
    public static set(sectionId : string, config : any) {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.set(sectionId, config);
    }

    /**
     * Enable navigation for the specified section with the given sectionId
     * @param {string} sectionId
     */
    public static enable(sectionId) {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.enable(sectionId);
    }

    /**
     * Disable navigation for the specified section with the given sectionId
     * @param {string} sectionId
     */
    public static disable(sectionId) {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.disable(sectionId);
    }

    /**
     * Pause SpatialNavigation and stop reacting to key events
     */
    public static pause() {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.pause();
    }

    /**
     * Resume SpatialNavigation and start reacting to key events
     */
    public static resume() {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.resume();
    }

    /**
     * Resume SpatialNavigation and start reacting to key events
     */
    public static focus(sectionId : string = DEFAULT_SECTION) {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.focus(sectionId);
    }

    /**
     * Moves the focus to the specified direction, based on current
     * SpatialNavigation rules
     * @param direction
     */
    public static move(direction : Direction) {
        if (!this.navigationEnabled) {
            return;
        }

        SpatialNavigationJS.move(direction);
    }
}
