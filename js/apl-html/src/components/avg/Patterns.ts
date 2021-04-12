/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { AVG } from './AVG';
import { Path } from './Path';
import { Group } from './Group';
import { AVGText } from './AVGText';
import { ILogger } from '../../logging/ILogger';
import { GraphicElementType } from '../../enums/GraphicElementType';
import { IDENTITY_TRANSFORM, IValueWithReference, SVG_NS } from '../Component';

export function createPatternElement(graphicPattern : APL.GraphicPattern, transform : string,
                                     parent : Element, logger : ILogger) : IValueWithReference | undefined {

    const avgElements : AVG[] = [];
    const defs = document.createElementNS(SVG_NS, 'defs');

    // Pattern creation
    const patternElement : SVGPatternElement = document.createElementNS(SVG_NS, 'pattern');

    // Pattern height and width
    patternElement.setAttributeNS('', 'id', graphicPattern.getId());
    patternElement.setAttributeNS('', 'height', graphicPattern.getHeight().toString());
    patternElement.setAttributeNS('', 'width', graphicPattern.getWidth().toString());
    patternElement.setAttributeNS('', 'patternUnits', 'userSpaceOnUse');

    // Pattern Transform
    if (transform && transform !== IDENTITY_TRANSFORM) {
        patternElement.setAttributeNS('', 'patternTransform', transform);
    }

    // Pattern Items
    const size = graphicPattern.getItemCount();
    for (let i = 0; i < size; i++) {
        const item = (graphicPattern.getItemAt(i)) as APL.GraphicElement;
        if (item.getType() === GraphicElementType.kGraphicElementTypeGroup) {
            const group = new Group(item, patternElement, logger);
            avgElements.push(group);
            group.bootStrapChildren(item, logger);
        } else if (item.getType() === GraphicElementType.kGraphicElementTypePath) {
            const path = new Path(item, patternElement, logger);
            avgElements.push(path);
        } else if (item.getType() === GraphicElementType.kGraphicElementTypeText) {
            const text = new AVGText(item, patternElement, logger);
            avgElements.push(text);
        }
    }
    defs.appendChild(patternElement);
    for (const element of avgElements) {
        element.setAllProperties();
    }
    return {
        value: `url('#${graphicPattern.getId()}')`,
        reference: defs
    };
}
