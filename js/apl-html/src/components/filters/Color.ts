/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Filter } from '../../utils/FilterUtils';
import { SVG_NS, uuidv4, Component } from '../Component';
import { IImageFilterElement, IBaseFilter } from './ImageFilter';

/**
 * @ignore
 */
export interface IColor extends IBaseFilter {
    color : number;
}

/*
 * The Color filter appends a new zero-size color to the image array.
 * Specs: https://aplspec.aka.corp.amazon.com/release-1.5/html/filters.html#filter-type-color
 * Utilize svg <feFlood> filter
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood
 */
export function getColorFilter(filter : Filter) : IImageFilterElement {
    const colorId : string = uuidv4().toString();
    const color : SVGElement = document.createElementNS(SVG_NS, 'feFlood');
    color.setAttributeNS('', 'flood-color', Component.numberToColor((filter as IColor).color));
    color.setAttributeNS('', 'result', colorId);
    return { filterId : colorId, filterElement : color, filterImageArray : [] };
}
