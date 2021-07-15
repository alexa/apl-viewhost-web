/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {createStylesApplier, CssUnitType} from './StylesApplier';

export interface AplRectToStyleArgs {
    domElement: HTMLElement;
    rectangle: APL.Rect;
}

/**
 * Apply bounds to the element's style
 * @param args AplRectToStyleArgs HTMLElement and APL.Rect
 */
export const applyAplRectToStyle = (args: AplRectToStyleArgs) => {
    const {
        domElement,
        rectangle
    } = args;

    const {
        left,
        top,
        width,
        height
    } = rectangle;

    const properties = {
        left,
        top,
        width,
        height
    };

    const stylesApplier = createStylesApplier({
        element: domElement,
        properties,
        cssUnitType: CssUnitType.Pixels
    });

    stylesApplier.applyStyle();
};

export interface PaddingToStyleArgs {
    domElement: HTMLElement;
    bounds: APL.Rect;
    innerBounds: APL.Rect;
}

/**
 * Apply padding to the element's style
 * @param args PaddingToStyleArgs: HTMLElement, APL.Rect bounds, APL.Rect innerBounds
 */
export const applyPaddingToStyle = (args: PaddingToStyleArgs) => {
    const {
        domElement,
        bounds,
        innerBounds
    } = args;

    const {
        width,
        height
    } = bounds;

    const {
        left: innerLeft,
        top: innerTop,
        width: innerWidth,
        height: innerHeight
    } = innerBounds;

    const innerRight = width - innerLeft - innerWidth;
    const innerBottom = height - innerTop - innerHeight;

    const properties = {
        'padding-left': innerLeft,
        'padding-right': innerRight,
        'padding-top': innerTop,
        'padding-bottom': innerBottom
    };

    const stylesApplier = createStylesApplier({
        element: domElement,
        properties,
        cssUnitType: CssUnitType.Pixels
    });

    stylesApplier.applyStyle();
};
