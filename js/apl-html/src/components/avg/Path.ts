/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {GraphicLineCap} from '../../enums/GraphicLineCap';
import {GraphicLineJoin} from '../../enums/GraphicLineJoin';
import {GraphicPropertyKey} from '../../enums/GraphicPropertyKey';
import {ILogger} from '../../logging/ILogger';
import {AVG} from './AVG';

const lineCaps = new Map([
    [GraphicLineCap.kGraphicLineCapButt, 'butt'],
    [GraphicLineCap.kGraphicLineCapRound, 'round'],
    [GraphicLineCap.kGraphicLineCapSquare, 'square']
]);
const lineJoins: Map<number, string> = new Map([
    [GraphicLineJoin.kGraphicLineJoinBevel, 'bevel'],
    [GraphicLineJoin.kGraphicLineJoinMiter, 'miter'],
    [GraphicLineJoin.kGraphicLineJoinRound, 'round']
]);

export class Path extends AVG {
    constructor(graphic: APL.GraphicElement, parent: Element, logger: ILogger) {
        super({
            graphic,
            parent,
            logger
        });
        this.graphicKeysToSetters = new Map([
            [GraphicPropertyKey.kGraphicPropertyFillOpacity, this.setAttribute('fill-opacity')],
            [GraphicPropertyKey.kGraphicPropertyStrokeWidth, this.setAttribute('stroke-width')],
            [GraphicPropertyKey.kGraphicPropertyStrokeOpacity, this.setAttribute('stroke-opacity')],
            [GraphicPropertyKey.kGraphicPropertyStrokeDashArray, this.setAttribute('stroke-dasharray')],
            [GraphicPropertyKey.kGraphicPropertyStrokeDashOffset, this.setAttribute('stroke-dashoffset')],
            [GraphicPropertyKey.kGraphicPropertyStrokeMiterLimit, this.setAttribute('stroke-miterlimit')],
            [GraphicPropertyKey.kGraphicPropertyPathData, this.setAttribute('d')],
            [GraphicPropertyKey.kGraphicPropertyStrokeLineCap, this.setAttributeFromMap('stroke-linecap', lineCaps, 'butt')],
            [GraphicPropertyKey.kGraphicPropertyStrokeLineJoin, this.setAttributeFromMap('stroke-linejoin', lineJoins, 'miter')],
            [GraphicPropertyKey.kGraphicPropertyFillTransform, this.setFill()],
            [GraphicPropertyKey.kGraphicPropertyFill, this.setFill()],
            [GraphicPropertyKey.kGraphicPropertyStrokeTransform, this.setStroke()],
            [GraphicPropertyKey.kGraphicPropertyStroke, this.setStroke()],
            [GraphicPropertyKey.kGraphicPropertyFilters, this.setFilter()],
            [GraphicPropertyKey.kGraphicPropertyPathLength, this.setPathLength()]
        ]);
    }

    private setPathLength() {
        return (key: GraphicPropertyKey) => {
            const pathLength = this.graphic.getValue<number>(key);
            if (pathLength && typeof pathLength === 'number' && pathLength > 0) {
                this.element.setAttributeNS('', 'pathLength', pathLength.toString());
            }
        };
    }
}
