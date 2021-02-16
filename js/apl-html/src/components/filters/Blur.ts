/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import { Filter, generateSVGFeImage, isIndexOutOfBound } from '../../utils/FilterUtils';
import { SVG_NS, uuidv4 } from '../Component';
import { IImageFilterElement, IBaseFilter, BITMAP_IMAGE_REGEX_CHECK } from './ImageFilter';

/**
 * @ignore
 */
export interface IBlur extends IBaseFilter {
    radius : number;
    source : number;
}

/*
 * Apply a Gaussian blur with a specified radius. The new image is appended to the end of the array.
 * Specs: https://aplspec.aka.corp.amazon.com/release-1.5/html/filters.html#blur
 * Utilize svg <feGaussianBlur> filter
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur
 */
export function getBlurFilter(filter : Filter, imageSrcArray : string[]) : IImageFilterElement | undefined {
    const blurId : string = uuidv4().toString();
    let filterImageArray : SVGFEImageElement[] = [];
    const blur : SVGElement = document.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttributeNS('', 'stdDeviation', (filter as IBlur).radius.toString());
    blur.setAttributeNS('', 'result', blurId);
    /*
     * All filters that operate on a single image have a default image source property of -1;
     * that is, by default they take as input the last image in the image array.
     */
    let index : number = (filter as IBlur).source;

    // Negative case : index outside source array bounds. return undefined
    if (isIndexOutOfBound(index, imageSrcArray.length)) {
        return undefined;
    }
    if (index < 0) {
        index += imageSrcArray.length;
    }
    const imageId : string = imageSrcArray[index];
    if (imageId.match(BITMAP_IMAGE_REGEX_CHECK)) {
        filterImageArray = generateSVGFeImage(imageId, blur);
    } else {
        blur.setAttributeNS('', 'in', imageId);
    }
    return { filterId: blurId, filterElement: blur, filterImageArray };
}
