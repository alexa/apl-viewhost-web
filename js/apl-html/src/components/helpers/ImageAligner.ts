/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ImageAlign} from '../../enums/ImageAlign';
import {LayoutDirection} from '../../enums/LayoutDirection';
import {ILogger} from '../../logging/ILogger';
import {LoggerFactory} from '../../logging/LoggerFactory';
import {CssAttributeValues} from './StylesApplier';

export interface Dimensions {
    width;
    height;
}

export interface Bounds {
    maxTop: number;
    maxLeft: number;
    minLeft: number;
}

export interface AlignerArgs {
    parentBounds: Dimensions;
    element: Dimensions;
    layoutDirection: LayoutDirection;
    alignerType?: AlignerType;
    imageAlign: ImageAlign;
    boundLimits?: Bounds;
}

export enum AlignerType {
    Image
}

export interface Aligner {
    getAlignment(): CssAttributeValues;
}

interface AlignerTypePositionerMap {
    [key: number]: (args: PositionerArgs) => Positioner;
}

const alignFunctionMap: AlignerTypePositionerMap = {
    [AlignerType.Image]: createImagePositioner
};

export function createAligner(args: AlignerArgs): Aligner {
    const defaultArgs = {
        alignerType: AlignerType.Image,
        boundLimits: {
            maxTop: 0,
            maxLeft: 0,
            minLeft: 0
        }
    };
    const alignerArgs = Object.assign(defaultArgs, args);

    const {
        parentBounds,
        element,
        layoutDirection,
        alignerType,
        imageAlign,
        boundLimits
    } = alignerArgs;

    const logger = LoggerFactory.getLogger('ImageAligner');

    function alignBottom(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToHorizontalCenter(),
            top: positioner.setToBottom()
        };
    }

    function alignBottomLeft(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToLeft(),
            top: positioner.setToBottom()
        };
    }

    function alignBottomRight(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToRight(),
            top: positioner.setToBottom()
        };
    }

    function alignCenter(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToHorizontalCenter(),
            top: positioner.setToVerticalCenter()
        };
    }

    function alignLeft(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToLeft(),
            top: positioner.setToVerticalCenter()
        };
    }

    function alignRight(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToRight(),
            top: positioner.setToVerticalCenter()
        };
    }

    function alignTop(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToHorizontalCenter(),
            top: positioner.setToTop()
        };
    }

    function alignTopLeft(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToLeft(),
            top: positioner.setToTop()
        };
    }

    function alignTopRight(positioner: Positioner): CssAttributeValues {
        return {
            left: positioner.setToRight(),
            top: positioner.setToTop()
        };
    }

    const imageAlignmentFunctions = {
        [ImageAlign.kImageAlignBottom]: alignBottom,
        [ImageAlign.kImageAlignBottomLeft]: alignBottomLeft,
        [ImageAlign.kImageAlignBottomRight]: alignBottomRight,
        [ImageAlign.kImageAlignCenter]: alignCenter,
        [ImageAlign.kImageAlignLeft]: alignLeft,
        [ImageAlign.kImageAlignRight]: alignRight,
        [ImageAlign.kImageAlignTop]: alignTop,
        [ImageAlign.kImageAlignTopLeft]: alignTopLeft,
        [ImageAlign.kImageAlignTopRight]: alignTopRight
    };

    return {
        getAlignment(): CssAttributeValues {
            const positioner = alignFunctionMap[alignerType]({
                parentBounds,
                element,
                layoutDirection,
                logger,
                boundLimits
            });

            if (!imageAlignmentFunctions.hasOwnProperty(imageAlign)) {
                logger.warn(`Bad image alignment property key: ${imageAlign}. Defaulting to center alignment.`);
                return {
                    left: positioner.setToHorizontalCenter(),
                    top: positioner.setToVerticalCenter()
                };
            }
            return imageAlignmentFunctions[imageAlign](positioner);
        }
    };
}

interface PositionerArgs {
    parentBounds: Dimensions;
    element: Dimensions;
    layoutDirection: LayoutDirection;
    logger: ILogger;
    boundLimits: Bounds;
}

export interface Positioner {
    /**
     * Gets top position when setting child to bottom of parent
     */
    setToBottom(): number;

    /**
     * Gets top position when setting child to top of parent
     */
    setToTop(): number;

    /**
     * Gets left position when setting child to left of parent
     */
    setToLeft(): number;

    /**
     * Gets left position when setting child to right of parent
     */
    setToRight(): number;

    /**
     * Gets left position when setting child to center of parent
     */
    setToHorizontalCenter(): number;

    /**
     * Gets top position when setting child to center of parent
     */
    setToVerticalCenter(): number;
}

const imagePositioners = {
    [LayoutDirection.kLayoutDirectionLTR]: createImagePositionerLTR,
    [LayoutDirection.kLayoutDirectionRTL]: createImagePositionerRTL
};

/**
 * Positions a child rectangle inside a parent rectangle
 * @param args PositionerArgs
 */
function createImagePositioner(args: PositionerArgs): Positioner {
    const {
        parentBounds: parentDimensions,
        element: elementDimensions,
        logger,
        boundLimits
    } = args;

    let {
        layoutDirection
    } = args;

    if (!imagePositioners.hasOwnProperty(layoutDirection)) {
        logger.warn(`LayoutDirection is not supported: ${layoutDirection}. Defaulting to LTR`);
        layoutDirection = LayoutDirection.kLayoutDirectionLTR;
    }
    return imagePositioners[layoutDirection](parentDimensions, elementDimensions, boundLimits);
}

function createImagePositionerLTR(
    parentDimensions: Dimensions,
    elementDimensions: Dimensions,
    boundLimits: Bounds
): Positioner {
    const {
        width: parentWidth,
        height: parentHeight
    } = parentDimensions;

    const {
        width: imageWidth,
        height: imageHeight
    } = elementDimensions;

    const {
        maxLeft: MAX_LEFT_BOUND,
        maxTop: MAX_TOP_BOUND
    } = boundLimits;

    return {
        setToBottom() {
            const top = parentHeight - imageHeight;
            return Math.max(top, MAX_TOP_BOUND);
        },

        setToTop() {
            return 0;
        },

        setToLeft() {
            return 0;
        },

        setToRight() {
            const left = parentWidth - imageWidth;
            return Math.max(left, MAX_LEFT_BOUND);
        },

        setToHorizontalCenter() {
            const left = (parentWidth - imageWidth) / 2;
            return Math.max(left, MAX_LEFT_BOUND);
        },

        setToVerticalCenter() {
            const top = (parentHeight - imageHeight) / 2;
            return Math.max(top, MAX_TOP_BOUND);
        }
    };
}

function createImagePositionerRTL(
    parentDimensions: Dimensions,
    elementDimensions: Dimensions,
    boundLimits: Bounds
): Positioner {
    const {
        width: parentWidth,
        height: parentHeight
    } = parentDimensions;

    const {
        width: imageWidth,
        height: imageHeight
    } = elementDimensions;

    const {
        minLeft: MIN_LEFT_BOUND,
        maxTop: MAX_TOP_BOUND
    } = boundLimits;

    return {
        setToBottom() {
            const top = parentHeight - imageHeight;
            return Math.max(top, MAX_TOP_BOUND);
        },

        setToTop() {
            return 0;
        },

        setToLeft() {
            const left = imageWidth - parentWidth;
            return Math.min(left, MIN_LEFT_BOUND);
        },

        setToRight() {
            return 0;
        },

        setToHorizontalCenter() {
            const left = (imageWidth - parentWidth) / 2;
            return Math.min(left, MIN_LEFT_BOUND);
        },

        setToVerticalCenter() {
            const top = (parentHeight - imageHeight) / 2;
            return Math.max(top, MAX_TOP_BOUND);
        }
    };
}
