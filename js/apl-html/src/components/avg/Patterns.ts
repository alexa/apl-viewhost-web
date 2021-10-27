/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {GraphicElementType} from '../../enums/GraphicElementType';
import {ILogger} from '../../logging/ILogger';
import {IDENTITY_TRANSFORM, IValueWithReference, SVG_NS} from '../Component';
import {AVG} from './AVG';
import {AVGText} from './AVGText';
import {Group} from './Group';
import {Path} from './Path';

export interface PatternElementArgs {
    graphicPattern: APL.GraphicPattern;
    transform: string;
    logger: ILogger;
    lang: string;
}

function getOrCreateSVGElementById(id: string): SVGElement {
    const element = document.getElementById(id);
    if (element && element instanceof SVGElement) {
        return element;
    }
    return document.createElementNS(SVG_NS, 'pattern');
}

/**
 * @deprecated use getOrCreatePatternElementWithArgs
 */
export function createPatternElementWithArgs(args: PatternElementArgs) {
    return getOrCreatePatternElementWithArgs(args);
}

export function getOrCreatePatternElementWithArgs(args: PatternElementArgs) {
    const {
        graphicPattern,
        transform,
        logger,
        lang
    } = args;

    const avgElements: AVG[] = [];
    const defs = document.createElementNS(SVG_NS, 'defs');

    const id = graphicPattern.getId();
    // Pattern creation
    const patternElement: Element = getOrCreateSVGElementById(id);

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
            const group = new Group({
                graphic: item,
                parent: patternElement,
                logger,
                lang
            });
            avgElements.push(group);
            group.bootStrapChildren(item, logger);
        } else if (item.getType() === GraphicElementType.kGraphicElementTypePath) {
            const path = new Path(item, patternElement, logger);
            avgElements.push(path);
        } else if (item.getType() === GraphicElementType.kGraphicElementTypeText) {
            const text = new AVGText({
                graphic: item,
                parent: patternElement,
                logger,
                lang
            });
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

/**
 * @Deprecated use createPatternElementWithArgs
 */
export function createPatternElement(graphicPattern: APL.GraphicPattern, transform: string,
                                     parent: Element, logger: ILogger): IValueWithReference | undefined {
    return getOrCreatePatternElementWithArgs({
        graphicPattern,
        transform,
        logger,
        lang: ''
    });
}
