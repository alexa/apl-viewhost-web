/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { Filter } from '../../utils/FilterUtils';
import { IGradient } from '../Image';
import { SVG_NS, Component, uuidv4 } from '../Component';
import { GradientType } from '../../enums/GradientType';
import { IImageFilterElement, IBaseFilter } from './ImageFilter';

/**
 * @ignore
 */
export interface IGradientFilter extends IBaseFilter {
    gradient : IGradient;
}

/*
 * The Gradient filter appends a new zero-size gradient to the image array.
 * Specs: https://aplspec.aka.corp.amazon.com/release-1.5/html/filters.html#gradient
 */
export function getGradientFilter(filter : Filter,
                                  svgDefsElement : SVGElement,
                                  svgUseElement : SVGUseElement) : IImageFilterElement {
    const gradientId : string = uuidv4().toString();
    const filterImageArray : SVGFEImageElement[] = [];
    const gradient = (filter as IGradientFilter).gradient;
    let gradientFilter : SVGElement;
    switch (gradient.type) {
        case GradientType.LINEAR :
            const angle = gradient.angle || 0;
            gradientFilter = document.createElementNS(SVG_NS, 'linearGradient');
            gradientFilter.setAttributeNS('', 'x1', getAngleCoords(angle).x1);
            gradientFilter.setAttributeNS('', 'x2', getAngleCoords(angle).x2);
            gradientFilter.setAttributeNS('', 'y1', getAngleCoords(angle).y1);
            gradientFilter.setAttributeNS('', 'y2', getAngleCoords(angle).y2);
            break;
        case GradientType.RADIAL :
        default:
            gradientFilter = document.createElementNS(SVG_NS, 'radialGradient');

    }
    gradientFilter.setAttributeNS('', 'id', gradientId);
    const inputRange = gradient.inputRange || [];
    gradient.colorRange.map((color, idx) => {
        // if the color already in css rgba format string, do not need convert.
        const stop = document.createElementNS(SVG_NS, 'stop');
        if (inputRange.length > idx) {
            stop.setAttributeNS('', 'offset', `${inputRange[idx] * 100}%`);
        }
        if (typeof color !== 'number') {
            stop.setAttributeNS('', 'stop-color', `${color}`);
        } else {
            // else color is a number, convert to rgba format.
            stop.setAttributeNS('', 'stop-color', `${Component.numberToColor(color)}`);
        }
        gradientFilter.appendChild(stop);
    });

    // Add gradient to svg defs
    svgDefsElement.appendChild(gradientFilter);

    const rect = document.createElementNS(SVG_NS, 'rect');
    const rectId : string = uuidv4().toString();
    rect.setAttributeNS('', 'height', '100%');
    rect.setAttributeNS('', 'width', '100%');
    rect.setAttributeNS('', 'fill', `url(#${gradientId})`);
    rect.setAttributeNS('', 'id', rectId);

    // Add rectangle to svg defs
    svgDefsElement.appendChild(rect);

    // set rect id to svg use element
    svgUseElement.setAttributeNS('', 'href', `#${rectId}`);

    const fImage = document.createElementNS(SVG_NS, 'feImage');
    const feImageId : string = uuidv4().toString();
    fImage.setAttributeNS('', 'href', `#${rectId}`);
    fImage.setAttributeNS('', 'result', feImageId);
    filterImageArray.push(fImage);
    return { filterId: feImageId, filterElement: fImage, filterImageArray };
}

export function getAngleCoords(angle : number) {
    // angle can be 0 to 360
    const anglePI = (360 - angle) * (Math.PI / 180);
    const angleCoords = {
        x1 : Math.round(50 + Math.sin(anglePI) * 50) + '%',
        y1 : Math.round(50 + Math.cos(anglePI) * 50) + '%',
        x2 : Math.round(50 + Math.sin(anglePI + Math.PI) * 50) + '%',
        y2 : Math.round(50 + Math.cos(anglePI + Math.PI) * 50) + '%'
    };
    return angleCoords;
}
