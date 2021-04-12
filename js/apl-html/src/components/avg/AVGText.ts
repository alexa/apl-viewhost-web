/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {GraphicTextAnchor} from '../../enums/GraphicTextAnchor';
import {GraphicPropertyKey} from '../../enums/GraphicPropertyKey';
import {AVG} from './AVG';
import {ILogger} from '../../logging/ILogger';

export class AVGText extends AVG {
    private textAnchors = new Map([
        [GraphicTextAnchor.kGraphicTextAnchorStart, 'start'],
        [GraphicTextAnchor.kGraphicTextAnchorMiddle, 'middle'],
        [GraphicTextAnchor.kGraphicTextAnchorEnd, 'end']
    ]);

    constructor(graphic : APL.GraphicElement, parent : Element, logger : ILogger) {
        super(graphic, parent, logger);
        this.graphicKeysToSetters = new Map([
            [GraphicPropertyKey.kGraphicPropertyFill, this.setFill()],
            [GraphicPropertyKey.kGraphicPropertyFillOpacity, this.setAttribute('fill-opacity')],
            [GraphicPropertyKey.kGraphicPropertyFontFamily, this.setAttribute('font-family')],
            [GraphicPropertyKey.kGraphicPropertyFontSize, this.setAttribute('font-size')],
            [GraphicPropertyKey.kGraphicPropertyFontStyle, this.setFontStyle('font-style')],
            [GraphicPropertyKey.kGraphicPropertyFontWeight, this.setAttribute('font-weight')],
            [GraphicPropertyKey.kGraphicPropertyLetterSpacing, this.setAttribute('letter-spacing')],
            [GraphicPropertyKey.kGraphicPropertyStrokeTransform, this.setStroke()],
            [GraphicPropertyKey.kGraphicPropertyStroke, this.setStroke()],
            [GraphicPropertyKey.kGraphicPropertyStrokeWidth, this.setAttribute('stroke-width')],
            [GraphicPropertyKey.kGraphicPropertyStrokeOpacity, this.setAttribute('stroke-opacity')],
            [GraphicPropertyKey.kGraphicPropertyText, this.setInnerHtml()],
            [
                GraphicPropertyKey.kGraphicPropertyTextAnchor, this.setAttributeFromMap(
                'text-anchor',
                this.textAnchors,
                'start')
            ],
            [GraphicPropertyKey.kGraphicPropertyCoordinateX, this.setAttribute('x')],
            [GraphicPropertyKey.kGraphicPropertyCoordinateY, this.setAttribute('y')],
            [GraphicPropertyKey.kGraphicPropertyFilters, this.setFilter()]
        ]);
    }

    private setInnerHtml() {
        return (key : GraphicPropertyKey) => {
            const text = this.graphic.getValue<string>(key);
            this.element.innerHTML = text;
        };
    }
}
