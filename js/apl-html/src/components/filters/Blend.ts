/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { BlendMode } from '../../enums/BlendMode';
import { Filter, generateSVGFeImage, isIndexOutOfBound } from '../../utils/FilterUtils';
import { SVG_NS, uuidv4 } from '../Component';
import { BITMAP_IMAGE_REGEX_CHECK, IBaseFilter, IImageFilterElement } from './ImageFilter';

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

enum BlendType {
    Blend = 'feBlend',
    Composite = 'feComposite'
}

export function getBlendFilter(filter: Filter, imageSrcArray: string[]): IImageFilterElement | undefined {
    const blendId: string = uuidv4().toString();
    let filterImageArray: SVGFEImageElement[] = [];
    const [elementType, operator] = getBlendMode((filter as IBlend).mode);
    const blend: SVGElement = document.createElementNS(SVG_NS, elementType);
    if (elementType === BlendType.Composite) {
        blend.setAttributeNS('', 'operator', operator);
    } else {
        blend.setAttributeNS('', 'mode', operator);
    }
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
function getBlendMode(mode: BlendMode): [BlendType, string] {
    switch (mode) {
        case BlendMode.kBlendModeNormal:
            return [BlendType.Blend, 'normal'];
        case BlendMode.kBlendModeMultiply:
            return [BlendType.Blend, 'multiply'];
        case BlendMode.kBlendModeScreen:
            return [BlendType.Blend, 'screen'];
        case BlendMode.kBlendModeOverlay:
            return [BlendType.Blend, 'overlay'];
        case BlendMode.kBlendModeDarken:
            return [BlendType.Blend, 'darken'];
        case BlendMode.kBlendModeLighten:
            return [BlendType.Blend, 'lighten'];
        case BlendMode.kBlendModeColorDodge:
            return [BlendType.Blend, 'color-dodge'];
        case BlendMode.kBlendModeColorBurn:
            return [BlendType.Blend, 'color-burn'];
        case BlendMode.kBlendModeHardLight:
            return [BlendType.Blend, 'hard-light'];
        case BlendMode.kBlendModeSoftLight:
            return [BlendType.Blend, 'soft-light'];
        case BlendMode.kBlendModeDifference:
            return [BlendType.Blend, 'difference'];
        case BlendMode.kBlendModeExclusion:
            return [BlendType.Blend, 'exclusion'];
        case BlendMode.kBlendModeHue:
            return [BlendType.Blend, 'hue'];
        case BlendMode.kBlendModeSaturation:
            return [BlendType.Blend, 'saturation'];
        case BlendMode.kBlendModeColor:
            return [BlendType.Blend, 'color'];
        case BlendMode.kBlendModeLuminosity:
            return [BlendType.Blend, 'luminosity'];
        case BlendMode.kBlendModeSourceIn:
            return [BlendType.Composite, 'in'];
        case BlendMode.kBlendModeSourceAtop:
            return [BlendType.Composite, 'atop'];
        case BlendMode.kBlendModeSourceOut:
            return [BlendType.Composite, 'out'];
        default:
            return [BlendType.Blend, 'normal'];
    }
}
