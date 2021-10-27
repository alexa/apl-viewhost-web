/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Filter } from '../../utils/FilterUtils';
import { Component, SVG_NS, uuidv4 } from '../Component';
import { IBaseFilter, IImageFilterElement } from './ImageFilter';

/**
 * @ignore
 */
export interface IColor extends IBaseFilter {
    color: number;
}

/*
 * The Color filter appends a new zero-size color to the image array.
 * Specs: https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-filters.html#color
 * Utilize svg <feFlood> filter
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood
 */
export function getColorFilter(filter: Filter): IImageFilterElement {
    const colorId: string = uuidv4().toString();
    const color: SVGElement = document.createElementNS(SVG_NS, 'feFlood');
    color.setAttributeNS('', 'flood-color', Component.numberToColor((filter as IColor).color));
    color.setAttributeNS('', 'result', colorId);
    return { filterId : colorId, filterElement : color, filterImageArray : [] };
}
