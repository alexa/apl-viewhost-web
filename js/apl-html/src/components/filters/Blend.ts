/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Filter, generateSVGFeImage, isIndexOutOfBound } from '../../utils/FilterUtils';
import { SVG_NS, uuidv4 } from '../Component';
import { BlendMode } from '../../enums/BlendMode';
import { IBaseFilter, IImageFilterElement, BITMAP_IMAGE_REGEX_CHECK } from './ImageFilter';

/**
 * @ignore
 */
export interface IBlend extends IBaseFilter {
    mode: BlendMode;
    source: number;
    destination: number;
}

/*
 * The Blend filter merges two images from the image array and appends the new image to the end of the array.
 * Specs: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-filters.html#blend
 * Utilize svg <feBlend> filter
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend
 */

export function getBlendFilter(filter: Filter, imageSrcArray: string[]): IImageFilterElement | undefined {
    const blendId: string = uuidv4().toString();
    let filterImageArray: SVGFEImageElement[] = [];
    const blend: SVGElement = document.createElementNS(SVG_NS, 'feBlend');
    blend.setAttributeNS('', 'mode', getBlendMode((filter as IBlend).mode));
    blend.setAttributeNS('', 'result', blendId);

    /*
     * At least one of the source or destination images must be a bitmap image;
     * If none of the images are bitmaps then no blending is performed;
     * the result is just the destination image.
     */
    let sourceIndex: number = (filter as IBlend).source;

    // Negative case : index outside source array bounds. return undefined
    if (isIndexOutOfBound(sourceIndex, imageSrcArray.length)) {
        return undefined;
    }
    if (sourceIndex < 0) {
        sourceIndex += imageSrcArray.length;
    }

    let destinationIndex: number = (filter as IBlend).destination;

    if (isIndexOutOfBound(destinationIndex, imageSrcArray.length)) {
        return undefined;
    }
    if (destinationIndex < 0) {
        destinationIndex += imageSrcArray.length;
    }

    const sourceImageId: string = imageSrcArray[sourceIndex];
    const destinationImageId: string = imageSrcArray[destinationIndex];

    if (sourceImageId.match(BITMAP_IMAGE_REGEX_CHECK)) {
        filterImageArray = generateSVGFeImage(sourceImageId, blend);
    } else {
        blend.setAttributeNS('', 'in', sourceImageId);
    }

    if (destinationImageId.match(BITMAP_IMAGE_REGEX_CHECK)) {
        filterImageArray = filterImageArray.concat(generateSVGFeImage(destinationImageId, blend, true));
    } else {
        blend.setAttributeNS('', 'in2', destinationImageId);
    }
    return { filterId: blendId, filterElement: blend, filterImageArray };
}

/**
 * Return Blend Mode
 * https://codepen.io/yoksel/pen/BiExv
 */
export function getBlendMode(mode: BlendMode): string {
    switch (mode) {
        case BlendMode.kBlendModeNormal:
            return 'normal';
        case BlendMode.kBlendModeMultiply:
            return 'multiply';
        case BlendMode.kBlendModeScreen:
            return 'screen';
        case BlendMode.kBlendModeOverlay:
            return 'overlay';
        case BlendMode.kBlendModeDarken:
            return 'darken';
        case BlendMode.kBlendModeLighten:
            return 'lighten';
        case BlendMode.kBlendModeColorDodge:
            return 'color-dodge';
        case BlendMode.kBlendModeColorBurn:
            return 'color-burn';
        case BlendMode.kBlendModeHardLight:
            return 'hard-light';
        case BlendMode.kBlendModeSoftLight:
            return 'soft-light';
        case BlendMode.kBlendModeDifference:
            return 'difference';
        case BlendMode.kBlendModeExclusion:
            return 'exclusion';
        case BlendMode.kBlendModeHue:
            return 'hue';
        case BlendMode.kBlendModeSaturation:
            return 'saturation';
        case BlendMode.kBlendModeColor:
            return 'color';
        case BlendMode.kBlendModeLuminosity:
            return 'luminosity';
        default:
            return 'normal';
    }
}
