/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { FilterType } from '../enums/FilterType';
import { IColor } from '../components/filters/Color';
import { IBlur } from '../components/filters/Blur';
import { INoise } from '../components/filters/Noise';
import { IGradientFilter } from '../components/filters/Gradient';
import { IBlend } from '../components/filters/Blend';
import { IGrayscale } from '../components/filters/Grayscale';
import { ISaturate } from '../components/filters/Saturate';
import { ImageFilter } from '../components/filters/ImageFilter';
import { SVG_NS, uuidv4 } from '..';

/**
 * @ignore
 */
export type Filter = IBlur | INoise | IColor | IGradientFilter |
                     IBlend | IGrayscale | ISaturate ;

/**
 * The APL filters needs to be handled by SVG filter.
 */
export const SVGFilters : Set<FilterType> = new Set<FilterType>([
    FilterType.kFilterTypeBlur,
    FilterType.kFilterTypeBlend,
    FilterType.kFilterTypeColor,
    FilterType.kFilterTypeGradient,
    FilterType.kFilterTypeGrayscale,
    FilterType.kFilterTypeSaturate
]);

/**
 * Generate SVG definition based on the provided APL filter array.
 * @param filters APL Filters
 * @param imageSrcArray image source array
 * @param filterId filter id
 * @return SVGDefsAndUseElement, if there is no SVGFilter requested in APLFilter, return undefined.
 */
export const generateSVGDefsAndUseElement = (filters : Filter[],
                                             imageSrcArray : string[],
                                             filterId : string) => {
    const filtersForSvg = filters.filter((f : Filter) => SVGFilters.has(f.type));
    if (filtersForSvg.length <= 0) {
        // no SVG filter in APL filter.
        return undefined;
    }
    const svgDefs : SVGDefsElement = document.createElementNS(SVG_NS, 'defs');
    const svgUse = document.createElementNS(SVG_NS, 'use');
    const imageFilter : ImageFilter = new ImageFilter(filters, imageSrcArray, svgDefs, svgUse);
    const svgFilterElement : SVGFilterElement = imageFilter.getSvgFilterElement();
    if (svgFilterElement === undefined) {
        // no valid SVG filter returned
        return undefined;
    }
    svgFilterElement.id = filterId;
    svgDefs.appendChild(svgFilterElement);

    return { svgDefsElement : svgDefs, svgUseElement : svgUse };
};

/**
 * Generate SVG filter primitive fetches image data from an external source and provides the pixel data as output.
 * @param sourceImageId the src URL from image source array
 * @param filterElement filter element primitive
 * @param isDestinationIn used by blend filter, if true, set as destination in
 * @returns filterImageArray feImage array, store all the SVG feImage
 */
export const generateSVGFeImage = (sourceImageId : string,
                                   filterElement : SVGElement,
                                   isDestinationIn? : boolean) : SVGFEImageElement[] => {
        const fImage = document.createElementNS(SVG_NS, 'feImage');
        const filterImageArray : SVGFEImageElement[] = [];
        const feImageId : string = uuidv4().toString();
        fImage.setAttributeNS('', 'href', sourceImageId);
        fImage.setAttributeNS('', 'result', feImageId);
        fImage.setAttributeNS('', 'x', '0');
        fImage.setAttributeNS('', 'y', '0');
        fImage.setAttributeNS('', 'height', '100%');
        fImage.setAttributeNS('', 'width', '100%');
        fImage.setAttributeNS('', 'preserveAspectRatio', 'none');
        filterImageArray.push(fImage);
        if (isDestinationIn) {
            filterElement.setAttributeNS('', 'in2', feImageId);
        } else {
            filterElement.setAttributeNS('', 'in', feImageId);
        }
        return filterImageArray;
};

/**
 * Util function to check whether image source/destination index are out of bound.
 * @param index source or destination image index
 * @param imageArrayLength length of image source array
 * @returns boolean, if true, ignore this filter stage and continue.
 */
export const isIndexOutOfBound = (index : number, imageArrayLength : number) : boolean => {
    if (index >= 0 && index > imageArrayLength - 1) {
        return true;
    }
    if (index < 0 && (index + imageArrayLength) < 0) {
        return true;
    }
    return false;
};
