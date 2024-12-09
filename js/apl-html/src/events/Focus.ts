/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventProperty} from '..';
import {ActionableComponent} from '../components/ActionableComponent';
import {FocusDirection} from '../enums/FocusDirection';
import {Event} from './Event';

const FOCUSABLE_ELEMENTS_SELECTOR = 'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';

/**
 * @ignore
 */
export class Focus extends Event {
    public async execute() {
        const component = this.event.getComponent();
        if (component) {
            const viewhostComponent = this.renderer.componentMap[component.getUniqueId()] as ActionableComponent;
            if (viewhostComponent && viewhostComponent.focus) {
                viewhostComponent.focus();
            }
            this.event.resolve();
        } else {
            const direction = this.event.getValue<FocusDirection>(EventProperty.kEventPropertyDirection);
            if (direction !== FocusDirection.kFocusDirectionNone) {
                if (!this.renderer.focusTrapped()) {
                    this.focusOnNextElement(direction);
                    this.event.resolve();
                }
            } else {
                (document.activeElement as HTMLElement).blur();
                this.event.resolveWithArg(1);
            }
        }
    }

    private focusOnNextElement(direction: FocusDirection) {
        const focusableElements = Array.prototype.slice.call(document.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR));
        const initialIndex = focusableElements.indexOf(document.activeElement);
        let currentIndex = initialIndex;
        let indexStep = 0;
        if (direction === FocusDirection.kFocusDirectionForward ||
            direction === FocusDirection.kFocusDirectionDown ||
            direction === FocusDirection.kFocusDirectionRight) {
            indexStep = 1;
        } else {
            indexStep = -1;
        }

        // We want the next element on the page that doesn't have the renderer's bound view as a parent
        let nextElementIsChildOfRendererView = true;
        let breakIfValidElementNotFound = false;
        while (nextElementIsChildOfRendererView) {
            currentIndex = (currentIndex + indexStep) % focusableElements.length;
            if (currentIndex === initialIndex) {
                breakIfValidElementNotFound = true;
                currentIndex = (currentIndex + indexStep) % focusableElements.length;
            }
            const nextElement = focusableElements[currentIndex];

            if (breakIfValidElementNotFound || !this.isChildOfRendererView(nextElement)) {
                nextElement.focus();
                nextElementIsChildOfRendererView = false;
            }
        }
    }

    private isChildOfRendererView(element: (Element | null)): boolean {
        let htmlElement = element;
        while (htmlElement !== null) {
            if (htmlElement === this.renderer.getView()) {
                return true;
            } else {
                htmlElement = htmlElement.parentElement;
            }
        }
        return false;
    }
}
