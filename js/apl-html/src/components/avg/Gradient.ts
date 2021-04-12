/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILogger } from '../../logging/ILogger';
import { Component, IDENTITY_TRANSFORM, IValueWithReference, SVG_NS, uuidv4 } from '../Component';
import { GradientType } from '../../enums/GradientType';
import { GradientSpreadMethod } from '../../enums/GradientSpreadMethod';
import { GradientUnits } from '../../enums/GradientUnits';

/**
 * @ignore
 */
export interface IAVGGradient {
    type : GradientType;
    colorRange : number[];
    inputRange : number[];
    spreadMethod : GradientSpreadMethod;
    units : GradientUnits;
    x1 : number;
    x2 : number;
    y1 : number;
    y2 : number;
    centerX : number;
    centerY : number;
    radius : number;
}

export function createGradientElement(gradient : IAVGGradient, transform : string,
                                      parent : Element, logger : ILogger) : IValueWithReference | undefined {
    const defs = document.createElementNS(SVG_NS, 'defs');
    let gradientElement : SVGLinearGradientElement | SVGRadialGradientElement;
    const gradientId = uuidv4().toString();
    switch ( gradient.type ) {
        case GradientType.LINEAR: {
            gradientElement = document.createElementNS(SVG_NS, 'linearGradient');
            gradientElement.setAttributeNS('', 'spreadMethod',
                Component.getGradientSpreadMethod(gradient.spreadMethod));
            gradientElement.setAttributeNS('', 'x1', gradient.x1.toString());
            gradientElement.setAttributeNS('', 'x2', gradient.x2.toString());
            gradientElement.setAttributeNS('', 'y1', gradient.y1.toString());
            gradientElement.setAttributeNS('', 'y2', gradient.y2.toString());
            break;
        }
        case GradientType.RADIAL: {
            gradientElement = document.createElementNS(SVG_NS, 'radialGradient');
            gradientElement.setAttributeNS('', 'cx', gradient.centerX.toString());
            gradientElement.setAttributeNS('', 'cy', gradient.centerY.toString());
            gradientElement.setAttributeNS('', 'r', gradient.radius.toString());
            break;
        }
        default: {
            logger.warn('Incorrect gradient type');
            return undefined;
        }
    }
    if (transform && transform !== IDENTITY_TRANSFORM) {
        // Spec updates: AVG Gradients don't have angle property.
        // The fillTransform and strokeTransform can be used to correct the visual angle.
        gradientElement.setAttributeNS('', 'gradientTransform', transform);
    }
    gradientElement.setAttributeNS('', 'id', gradientId);
    gradientElement.setAttributeNS('', 'gradientUnits', Component.getGradientUnits(gradient.units));
    // All gradients use color stops, colors are mandatory, stop positions are not
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
        gradientElement.appendChild(stop);
    });
    defs.appendChild(gradientElement);
    return {
        value: `url('#${gradientId}')`,
        reference: defs
    };
}
