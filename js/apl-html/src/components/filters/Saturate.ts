/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import { Filter, generateSVGFeImage, isIndexOutOfBound } from '../../utils/FilterUtils';
import { SVG_NS, uuidv4 } from '../Component';
import { IBaseFilter, IImageFilterElement, BITMAP_IMAGE_REGEX_CHECK } from './ImageFilter';

/**
 * @ignore
 */
export interface ISaturate extends IBaseFilter {
    amount : number;
    source? : number;
}

/*
 * Change the color saturation of the image and appends the new image to the end of the array.
 * Specs: https://aplspec.aka.corp.amazon.com/release-1.5/html/filters.html#saturate
 * Utilize svg <feColorMatrix> filter
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
 */

export function getSaturateFilter(filter : Filter, imageSrcArray : string[]) : IImageFilterElement | undefined {
    const saturateId : string = uuidv4().toString();
    let filterImageArray : SVGFEImageElement[] = [];
    const saturate : SVGElement = document.createElementNS(SVG_NS, 'feColorMatrix');
    saturate.setAttribute('type', 'saturate');
    saturate.setAttribute('values', (filter as ISaturate).amount.toString());
    saturate.setAttributeNS('', 'result', saturateId);

    /*
     * An amount of 0% completed unsaturates the image.
     * An amount of 100% leaves the image the same.
     * Values greater than 100% produce super-saturation.
     * The source image must be a bitmap
     */
    let index : number = (filter as ISaturate).source;

    // Negative case : index outside source array bounds. return undefined
    if (isIndexOutOfBound(index, imageSrcArray.length)) {
        return undefined;
    }
    if (index < 0) {
        index += imageSrcArray.length;
    }
    const imageId : string = imageSrcArray[index];
    if (imageId.match(BITMAP_IMAGE_REGEX_CHECK)) {
        filterImageArray = generateSVGFeImage(imageId, saturate);
    } else {
        saturate.setAttributeNS('', 'in', imageId);
    }
    return { filterId : saturateId, filterElement : saturate, filterImageArray };
}
