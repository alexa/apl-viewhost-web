/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { CssAttributeValues } from './StylesApplier';
import { ImageAlign } from '../../enums/ImageAlign';
import { LayoutDirection } from '../../enums/LayoutDirection';
import { ILogger } from '../../logging/ILogger';
import { LoggerFactory } from '../../logging/LoggerFactory';

export interface AlignerArgs {
    parentBounds: APL.Rect;
    element: HTMLImageElement;
    layoutDirection: LayoutDirection;
    alignerType?: AlignerType;
    imageAlign: ImageAlign;
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
        alignerType: AlignerType.Image
    };
    const alignerArgs = Object.assign(defaultArgs, args);

    const {
        parentBounds,
        element,
        layoutDirection,
        alignerType,
        imageAlign
    } = alignerArgs;

    const logger = LoggerFactory.getLogger('ImageAligner');

    function getAlignment() {
        const positioner = alignFunctionMap[alignerType]({
            parentBounds,
            element,
            layoutDirection,
            logger
        });

        switch (imageAlign) {
            case ImageAlign.kImageAlignBottom: {
                return {
                    left: positioner.setToHorizontalCenter(),
                    top: positioner.setToBottom()
                };
            }
            case ImageAlign.kImageAlignBottomLeft: {
                return {
                    left: positioner.setToLeft(),
                    top: positioner.setToBottom()
                };
            }
            case ImageAlign.kImageAlignBottomRight: {
                return {
                    left: positioner.setToRight(),
                    top: positioner.setToBottom()
                };
            }
            case ImageAlign.kImageAlignCenter: {
                return {
                    left: positioner.setToHorizontalCenter(),
                    top: positioner.setToVerticalCenter()
                };
            }
            case ImageAlign.kImageAlignLeft: {
                return {
                    left: positioner.setToLeft(),
                    top: positioner.setToVerticalCenter()
                };
            }
            case ImageAlign.kImageAlignRight: {
                return {
                    left: positioner.setToRight(),
                    top: positioner.setToVerticalCenter()
                };
            }
            case ImageAlign.kImageAlignTop: {
                return {
                    left: positioner.setToHorizontalCenter(),
                    top: positioner.setToTop()
                };
            }
            case ImageAlign.kImageAlignTopLeft: {
                return {
                    left: positioner.setToLeft(),
                    top: positioner.setToTop()
                };
            }
            case ImageAlign.kImageAlignTopRight: {
                return {
                    left: positioner.setToRight(),
                    top: positioner.setToTop()
                };
            }
            default: {
                logger.warn(`Bad image alignment property key: ${imageAlign}. Defaulting to center alignment.`);
                return {
                    left: positioner.setToHorizontalCenter(),
                    top: positioner.setToVerticalCenter()
                };
            }
        }
    }

    return {
        getAlignment
    };
}

interface PositionerArgs {
    parentBounds: Dimensions;
    element: Dimensions;
    layoutDirection: LayoutDirection;
    logger: ILogger;
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

interface Dimensions {
    width;
    height;
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
        logger
    } = args;

    let {
        layoutDirection
    } = args;

    if (!imagePositioners.hasOwnProperty(layoutDirection)) {
        logger.warn(`LayoutDirection is not supported: ${layoutDirection}. Defaulting to LTR`);
        layoutDirection = LayoutDirection.kLayoutDirectionLTR;
    }
    return imagePositioners[layoutDirection](parentDimensions, elementDimensions);
}

function createImagePositionerLTR(parentDimensions: Dimensions, elementDimensions: Dimensions): Positioner {
    const {
        width: parentWidth,
        height: parentHeight
    } = parentDimensions;

    const {
        width: imageWidth,
        height: imageHeight
    } = elementDimensions;

    const MAX_TOP_BOUND = 0;
    const MAX_LEFT_BOUND = 0;

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

function createImagePositionerRTL(parentDimensions: Dimensions, elementDimensions: Dimensions): Positioner {
    const {
        width: parentWidth,
        height: parentHeight
    } = parentDimensions;

    const {
        width: imageWidth,
        height: imageHeight
    } = elementDimensions;

    const MAX_TOP_BOUND = 0;
    const MIN_LEFT_BOUND = 0;

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
