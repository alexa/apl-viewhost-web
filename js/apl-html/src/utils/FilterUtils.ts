/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {SVG_NS, uuidv4} from '../components/Component';
import {IBlend} from '../components/filters/Blend';
import {IBlur} from '../components/filters/Blur';
import {IColor} from '../components/filters/Color';
import {IGradientFilter} from '../components/filters/Gradient';
import {IGrayscale} from '../components/filters/Grayscale';
import {ImageFilter} from '../components/filters/ImageFilter';
import {INoise} from '../components/filters/Noise';
import {ISaturate} from '../components/filters/Saturate';
import {FilterType} from '../enums/FilterType';
import {ILogger} from '../logging/ILogger';
import {LoggerFactory} from '../logging/LoggerFactory';
import {isSomething} from './Maybe';

/**
 * @ignore
 */
export type Filter = IBlur | INoise | IColor | IGradientFilter |
    IBlend | IGrayscale | ISaturate;

/**
 * The APL filters needs to be handled by SVG filter.
 */
export const SVGFilters: Set<FilterType> = new Set<FilterType>([
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
export const generateSVGDefsAndUseElement = (filters: Filter[],
                                             imageSrcArray: string[],
                                             filterId: string) => {
    const filtersForSvg = filters.filter((f: Filter) => SVGFilters.has(f.type));
    if (filtersForSvg.length <= 0) {
        // no SVG filter in APL filter.
        return undefined;
    }
    const svgDefs: SVGDefsElement = document.createElementNS(SVG_NS, 'defs');
    const svgUse = document.createElementNS(SVG_NS, 'use');
    const imageFilter: ImageFilter = new ImageFilter(filters, imageSrcArray, svgDefs, svgUse);
    const svgFilterElement: SVGFilterElement = imageFilter.getSvgFilterElement();
    if (svgFilterElement === undefined) {
        // no valid SVG filter returned
        return undefined;
    }
    svgFilterElement.id = filterId;
    svgDefs.appendChild(svgFilterElement);

    return {svgDefsElement: svgDefs, svgUseElement: svgUse};
};

/**
 * Generate SVG filter primitive fetches image data from an external source and provides the pixel data as output.
 * @param sourceImageId the src URL from image source array
 * @param filterElement filter element primitive
 * @param isDestinationIn used by blend filter, if true, set as destination in
 * @returns filterImageArray feImage array, store all the SVG feImage
 */
export const generateSVGFeImage = (sourceImageId: string,
                                   filterElement: SVGElement,
                                   isDestinationIn?: boolean): SVGFEImageElement[] => {
    const fImage = document.createElementNS(SVG_NS, 'feImage');
    const filterImageArray: SVGFEImageElement[] = [];
    const feImageId: string = uuidv4().toString();
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
export const isIndexOutOfBound = (index: number, imageArrayLength: number): boolean => {
    if (index >= 0 && index > imageArrayLength - 1) {
        return true;
    }
    if (index < 0 && (index + imageArrayLength) < 0) {
        return true;
    }
    return false;
};

export interface SVGImageFiltersApplierArgs {
    uuid: string;
    svgElement: SVGElement;
    imageElement: SVGElement;
    filters: Filter[];
    imageSources: string[];
    logger?: ILogger;
}

export interface SVGImageFiltersApplier {
    applyFiltersToSVGImage: () => void;
}

export function createSVGImageFiltersApplier(args: SVGImageFiltersApplierArgs): SVGImageFiltersApplier {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('SVGImageFiltersApplier')
    };
    args = Object.assign(defaultArgs, args);

    const {
        uuid,
        svgElement,
        imageElement,
        filters,
        imageSources
    } = args;

    return {
        applyFiltersToSVGImage(): void {
            const filterId = `filter-${uuid}`;
            const svgFilters = generateSVGDefsAndUseElement(filters, imageSources, filterId);
            if (!isSomething(svgFilters)) {
                return;
            }
            const {
                svgDefsElement: svgFilterDefinitions,
                svgUseElement: svgFilterUses
            } = svgFilters;

            const existingSVGFilterDefinitions = svgElement.getElementsByTagName('defs');
            // Note: HTMLCollectionOf type has limited support for/of; use basic for loop for now
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < existingSVGFilterDefinitions.length; i++) {
                const svgFilterDefinition = existingSVGFilterDefinitions[i];
                svgElement.removeChild(svgFilterDefinition);
            }

            const existingSVGFilterUses = svgElement.getElementsByTagName('use');
            // Note: HTMLCollectionOf type has limited support for/of; use basic for loop for now
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < existingSVGFilterUses.length; i++) {
                const svgFilterUse = existingSVGFilterUses[i];
                svgElement.removeChild(svgFilterUse);
            }

            svgElement.appendChild(svgFilterUses);
            svgElement.appendChild(svgFilterDefinitions);
            imageElement.setAttribute('filter', `url('#${filterId}')`);
        }
    };
}
