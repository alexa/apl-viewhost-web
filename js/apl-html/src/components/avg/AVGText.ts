/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { GraphicTextAnchor } from '../../enums/GraphicTextAnchor';
import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { AVG } from './AVG';
import { ILogger } from '../../logging/ILogger';
import { Component } from '../Component';
import { FontUtils } from '../../utils/FontUtils';
import { AVGFilter, createAndGetFilterElement, IAVGFilterElement } from './Filter';

export class AVGText extends AVG {
    constructor(graphic : APL.GraphicElement, parent : Element, logger : ILogger) {
        super(graphic, parent, logger);
    }

    public setAllProperties() {
        const fillTransform = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyFillTransform);
        const fill = Component.fillAndStrokeConverter(
            this.graphic.getValue<object>(GraphicPropertyKey.kGraphicPropertyFill),
            fillTransform, this.parent, this.logger);
        const fillOpacity = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyFillOpacity);
        const fontFamily = FontUtils.getFont(
            this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyFontFamily));
        const fontSize = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyFontSize);
        const fontStyle = FontUtils.getFontStyle(
            this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyFontStyle));
        const fontWeight = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyFontWeight);
        const letterSpacing = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyLetterSpacing);
        const strokeTransform = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyStrokeTransform);
        const stroke = Component.fillAndStrokeConverter(
            this.graphic.getValue<object>(GraphicPropertyKey.kGraphicPropertyStroke),
            strokeTransform, this.parent, this.logger);
        const strokeWidth = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeWidth);
        const strokeOpacity = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeOpacity);
        const text = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyText);
        const textAnchor = this.getTextAnchor(
            this.graphic.getValue<GraphicTextAnchor>(GraphicPropertyKey.kGraphicPropertyTextAnchor));
        const coordinateX = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyCoordinateX);
        const coordinateY = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyCoordinateY);
        const filterElement : IAVGFilterElement | undefined = createAndGetFilterElement(
            this.graphic.getValue<AVGFilter[]>(GraphicPropertyKey.kGraphicPropertyFilters), this.logger);

        this.element.setAttributeNS('', 'fill', fill.toString());
        this.element.setAttributeNS('', 'fill-opacity', fillOpacity.toString());
        this.element.setAttributeNS('', 'font-family', fontFamily);
        this.element.setAttributeNS('', 'font-size', fontSize.toString());
        this.element.setAttributeNS('', 'font-style', fontStyle);
        this.element.setAttributeNS('', 'font-weight', fontWeight);
        this.element.setAttributeNS('', 'letter-spacing', letterSpacing.toString());
        this.element.setAttributeNS('', 'stroke', stroke.toString());
        this.element.setAttributeNS('', 'stroke-width', strokeWidth.toString());
        this.element.setAttributeNS('', 'stroke-opacity', strokeOpacity.toString());
        this.element.innerHTML = text;
        this.element.setAttributeNS('', 'text-anchor', textAnchor);
        this.element.setAttributeNS('', 'x', coordinateX.toString());
        this.element.setAttributeNS('', 'y', coordinateY.toString());
        if (filterElement) {
            this.parent.appendChild(filterElement.filterElement);
            this.element.setAttributeNS('', 'filter', `url(#${filterElement.filterId})`);
        }
    }

    public updateDirty() {
        this.logger.debug('AVGText: update dirty');
    }

    private getTextAnchor(graphicTextAnchor : GraphicTextAnchor) : string {
        switch (graphicTextAnchor) {
            case GraphicTextAnchor.kGraphicTextAnchorStart:
                return 'start';
            case GraphicTextAnchor.kGraphicTextAnchorMiddle:
                return 'middle';
            case GraphicTextAnchor.kGraphicTextAnchorEnd:
                return 'end';
            default:
                this.logger.warn(`Incorrect TextAnchor type: ${graphicTextAnchor}`);
                return 'start';
        }
    }
}
