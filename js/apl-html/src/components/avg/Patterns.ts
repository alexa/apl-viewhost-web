/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { AVG } from './AVG';
import { Path } from './Path';
import { Group } from './Group';
import { AVGText } from './AVGText';
import { ILogger } from '../../logging/ILogger';
import { GraphicElementType } from '../../enums/GraphicElementType';
import { IDENTITY_TRANSFORM, SVG_NS } from '../Component';

export class Patterns {

    public avgElements : AVG[] = [];

    constructor(protected graphicPattern : APL.GraphicPattern, protected transform : string,
                protected parent : Element, protected logger : ILogger) {

        // Pattern definition
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
                this.avgElements.push(group);
            } else if (item.getType() === GraphicElementType.kGraphicElementTypePath) {
                const path = new Path(item, patternElement, logger);
                this.avgElements.push(path);
            } else if (item.getType() === GraphicElementType.kGraphicElementTypeText) {
                const text = new AVGText(item, patternElement, logger);
                this.avgElements.push(text);
            }
        }
        defs.appendChild(patternElement);
        parent.appendChild(defs);

        for (const element of this.avgElements) {
            element.setAllProperties();
        }
    }

    public getPatternId() : string {
        return this.graphicPattern.getId();
    }
}
