/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {GraphicTextAnchor} from '../../enums/GraphicTextAnchor';
import {GraphicPropertyKey} from '../../enums/GraphicPropertyKey';
import {AVG} from './AVG';
import {ILogger} from '../../logging/ILogger';
import {FontUtils} from '../../utils/FontUtils';
import {ElementType} from '../helpers/StylesApplier';

export interface AVGTextArgs {
    graphic: APL.GraphicElement;
    parent: Element;
    logger: ILogger;
    lang: string;
}

export class AVGText extends AVG {
    private textAnchors = new Map([
        [GraphicTextAnchor.kGraphicTextAnchorStart, 'start'],
        [GraphicTextAnchor.kGraphicTextAnchorMiddle, 'middle'],
        [GraphicTextAnchor.kGraphicTextAnchorEnd, 'end']
    ]);

    constructor({graphic, parent, logger, lang}: AVGTextArgs) {
        super({graphic, parent, logger, lang});
        this.graphicKeysToSetters = new Map([
            [GraphicPropertyKey.kGraphicPropertyFill, this.setFill()],
            [GraphicPropertyKey.kGraphicPropertyFillOpacity, this.setAttribute('fill-opacity')],
            [GraphicPropertyKey.kGraphicPropertyFillTransform, this.setFillTransform()],
            [GraphicPropertyKey.kGraphicPropertyFontFamily, this.setFontFamily()],
            [GraphicPropertyKey.kGraphicPropertyFontSize, this.setAttribute('font-size')],
            [GraphicPropertyKey.kGraphicPropertyFontStyle, this.setFontStyle()],
            [GraphicPropertyKey.kGraphicPropertyFontWeight, this.setFontWeight()],
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

    protected setFontStyle() {
        return (key: GraphicPropertyKey) => {
            FontUtils.setFontStyle({
                element: this.element,
                fontStyle: this.graphic.getValue(key),
                lang: this.lang
            }, {
                elementType: ElementType.SVG
            });
        };
    }

    protected setFontWeight() {
        return (key: GraphicPropertyKey) => {
            FontUtils.setFontWeight({
                element: this.element,
                fontWeight: this.graphic.getValue(key),
                lang: this.lang
            }, {
                elementType: ElementType.SVG
            });
        };
    }

    protected setFontFamily() {
        return (key: GraphicPropertyKey) => {
            FontUtils.setFontFamily({
                element: this.element,
                fontFamily: this.graphic.getValue(key),
                lang: this.lang
            }, {
                elementType: ElementType.SVG
            });
        };
    }

    private setInnerHtml() {
        return (key: GraphicPropertyKey) => {
            const text = this.graphic.getValue<string>(key);
            this.element.innerHTML = text;
        };
    }
}
