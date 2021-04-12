/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Filter, generateSVGFeImage, isIndexOutOfBound } from '../../utils/FilterUtils';
import { SVG_NS, uuidv4 } from '../Component';
import { IImageFilterElement, IBaseFilter, BITMAP_IMAGE_REGEX_CHECK } from './ImageFilter';

/**
 * @ignore
 */
export interface IGrayscale extends IBaseFilter {
    amount : number;
    source : number;
}

/*
 * The Grayscale filter converts the input image to grayscale and appends it to the end of the image array.
 * Specs: https://aplspec.aka.corp.amazon.com/release-1.5/html/filters.html#grayscale
 * Utilize svg <feColorMatrix> filter
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix
 */
export function getGrayscaleFilter(filter : Filter, imageSrcArray : string[]) : IImageFilterElement | undefined {
    const grayscaleId : string = uuidv4().toString();
    let filterImageArray : SVGFEImageElement[] = [];
    const grayscale : SVGElement = document.createElementNS(SVG_NS, 'feColorMatrix');
    grayscale.setAttribute('type', 'matrix');
    grayscale.setAttribute('values', getGrayscaleMatrix((filter as IGrayscale).amount));
    grayscale.setAttributeNS('', 'result', grayscaleId);

    /*
     * The source image must be a bitmap
     */
    let index : number = (filter as IGrayscale).source;

    // Negative case : index outside source array bounds. return undefined
    if (isIndexOutOfBound(index, imageSrcArray.length)) {
        return undefined;
    }
    if (index < 0) {
        index += imageSrcArray.length;
    }
    const imageId : string = imageSrcArray[index];
    if (imageId.match(BITMAP_IMAGE_REGEX_CHECK)) {
        filterImageArray = generateSVGFeImage(imageId, grayscale);
    } else {
        grayscale.setAttributeNS('', 'in', imageId);
    }
    return { filterId : grayscaleId, filterElement : grayscale, filterImageArray };
}

/**
 * Return grayscale matrix
 * Reference https://www.w3.org/TR/filter-effects-1/#grayscaleEquivalent
 * @return {string} grayscale matrix
 */
export function getGrayscaleMatrix(amount : number) : string {
    const r1 = 0.2126 + 0.7874 * (1 - amount);
    const r2 = 0.7152 - 0.7152 * (1 - amount);
    const r3 = 0.0722 - 0.0722 * (1 - amount);

    const g1 = 0.2126 - 0.2126 * (1 - amount);
    const g2 = 0.7152 + 0.2848 * (1 - amount);
    const g3 = 0.0722 - 0.0722 * (1 - amount);

    const b1 = 0.2126 - 0.2126 * (1 - amount);
    const b2 = 0.7152 - 0.7152 * (1 - amount);
    const b3 = 0.0722 + 0.9278 * (1 - amount);

    return `${r1} ${r2} ${r3} 0 0
            ${g1} ${g2} ${g3} 0 0
            ${b1} ${b2} ${b3} 0 0
            0     0     0     1 0`;
}
