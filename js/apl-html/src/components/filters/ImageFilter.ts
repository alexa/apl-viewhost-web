/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Filter } from '../../utils/FilterUtils';
import { FilterType } from '../../enums/FilterType';
import { SVG_NS } from '../Component';
import { getBlurFilter } from './Blur';
import { getColorFilter } from './Color';
import { ILogger } from '../../logging/ILogger';
import { LoggerFactory } from '../../logging/LoggerFactory';
import { getGradientFilter } from './Gradient';
import { getBlendFilter } from './Blend';
import { getGrayscaleFilter } from './Grayscale';
import { getSaturateFilter } from './Saturate';

/**
 * @ignore
 */
export interface IBaseFilter {
    type: FilterType;
}

/**
 * IImageFilterElement contains:
 * @param filterId component id assigned by core, eg: 1009. Use it to set as the unique filter id
 * @param filterElement svg filter element. feGaussianBlur/feBlend etc ...
 * @param filterImageArray feImage array, store all the SVG filter primitive,
 * fetches image data from an external source and provides the pixel data as output
 */
export interface IImageFilterElement {
    filterId: string;
    filterElement: SVGElement;
    filterImageArray: SVGFEImageElement[];
}

/**
 * Check if the image url match standard bitmap format or from http/s resource
 */
export const BITMAP_IMAGE_REGEX_CHECK: string = '(jpeg|jpg|gif|png|http)';

/*
 */
export class ImageFilter {
    private imageArray: string[];
    private filters: Filter[];
    private svgFilter: SVGFilterElement;
    private svgDefsElement: SVGElement;
    private logger: ILogger;
    private svgUseElement: SVGUseElement;

    /**
     * ImageFilter Constructor
     * @param filters filters get from kPropertyFilters
     * @param imageSrcArray image urls get from kPropertySource
     */
    constructor(filters: Filter[], imageSrcArray: string[], svgDefsElement: SVGElement,
                svgUseElement: SVGUseElement) {
        this.logger = LoggerFactory.getLogger('ImageFilter');
        this.filters = filters;
        this.imageArray = imageSrcArray;
        this.svgDefsElement = svgDefsElement;
        this.svgUseElement = svgUseElement;
        this.applyFilters();
    }

    private applyFilters() {
        this.svgFilter = document.createElementNS(SVG_NS, 'filter');
        this.svgFilter.setAttributeNS('', 'filterUnits', 'userSpaceOnUse');
        this.filters.forEach((filter: Filter) => {
            if (filter) {
                switch (filter.type) {
                    case FilterType.kFilterTypeBlur: {
                        const filterElement: IImageFilterElement = getBlurFilter(filter, this.imageArray);
                        if (filterElement) {
                            this.appendFilterElement(filterElement);
                        }
                        break;
                    }
                    case FilterType.kFilterTypeColor: {
                        const filterElement: IImageFilterElement = getColorFilter(filter);
                        this.appendFilterElement(filterElement);
                        break;
                    }
                    case FilterType.kFilterTypeBlend: {
                        const filterElement: IImageFilterElement = getBlendFilter(filter, this.imageArray);
                        if (filterElement) {
                            this.appendFilterElement(filterElement);
                        }
                        break;
                    }
                    case FilterType.kFilterTypeGradient: {
                        const filterElement: IImageFilterElement = getGradientFilter(filter,
                                                                                      this.svgDefsElement,
                                                                                      this.svgUseElement);
                        this.appendFilterElement(filterElement);
                        break;
                    }
                    case FilterType.kFilterTypeGrayscale: {
                        const filterElement: IImageFilterElement = getGrayscaleFilter(filter, this.imageArray);
                        if (filterElement) {
                            this.appendFilterElement(filterElement);
                        }
                        break;
                    }
                    case FilterType.kFilterTypeSaturate: {
                        const filterElement: IImageFilterElement = getSaturateFilter(filter, this.imageArray);
                        if (filterElement) {
                            this.appendFilterElement(filterElement);
                        }
                        break;
                    }
                    case FilterType.kFilterTypeExtension: {
                        // Custom Filter extension to be implemented by domain team
                        break;
                    }
                    case FilterType.kFilterTypeNoise: {
                        // Noise will be handled by Canvas
                        break;
                    }
                    default: {
                        this.logger.warn('incorrect image filter type.');
                    }
                }
            }
        });
    }

    /**
     * Append SVG filter primitive
     * Order is important: need append filterImageArray first.
     */
    private appendFilterElement(filterElement: IImageFilterElement) {
        filterElement.filterImageArray.forEach((filterImage) => {
             this.svgFilter.appendChild(filterImage); });
        this.svgFilter.appendChild(filterElement.filterElement);
        this.imageArray.push(filterElement.filterId);
    }

    /**
     * Return SVG Filter Element
     * @return {SVGFilterElement}
     */
    public getSvgFilterElement(): SVGFilterElement | undefined {
        if (!this.svgFilter.hasChildNodes()) {
            return undefined;
        }
        return this.svgFilter;
    }
}
