/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { AVG } from './AVG';
import { ILogger } from '../../logging/ILogger';
import { Component } from '../Component';
import { GraphicLineCap } from '../../enums/GraphicLineCap';
import { GraphicLineJoin } from '../../enums/GraphicLineJoin';
import { AVGFilter, createAndGetFilterElement, IAVGFilterElement } from './Filter';

export class Path extends AVG {

    constructor(graphic : APL.GraphicElement, parent : Element, logger : ILogger) {
        super(graphic, parent, logger);
    }

    public setAllProperties() {
        const fillTransform = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyFillTransform);
        const fill = Component.fillAndStrokeConverter(
            this.graphic.getValue<object>(GraphicPropertyKey.kGraphicPropertyFill),
            fillTransform, this.parent, this.logger);
        const fillOpacity = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyFillOpacity);
        const strokeTransform = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyStrokeTransform);
        const stroke = Component.fillAndStrokeConverter(
            this.graphic.getValue<object>(GraphicPropertyKey.kGraphicPropertyStroke),
            strokeTransform, this.parent, this.logger);
        const strokeWidth = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeWidth);
        const strokeOpacity = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeOpacity);
        const strokeDashArray = this.graphic.getValue<object>(GraphicPropertyKey.kGraphicPropertyStrokeDashArray);
        const strokeDashOffset = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeDashOffset);
        const strokeLineCap = this.getStrokeLineCap(
            this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeLineCap));
        const strokeLineJoin = this.getStrokeLineJoin(
            this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeLineJoin));
        const strokeMiterLimit = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyStrokeMiterLimit);
        const pathLength = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyPathLength);
        const pathData = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyPathData);
        const filterElement : IAVGFilterElement | undefined = createAndGetFilterElement(
            this.graphic.getValue<AVGFilter[]>(GraphicPropertyKey.kGraphicPropertyFilters), this.logger);

        this.element.setAttributeNS('', 'fill', fill.toString());
        this.element.setAttributeNS('', 'fill-opacity', fillOpacity.toString());
        this.element.setAttributeNS('', 'stroke', stroke.toString());
        this.element.setAttributeNS('', 'stroke-width', strokeWidth.toString());
        this.element.setAttributeNS('', 'stroke-opacity', strokeOpacity.toString());
        this.element.setAttributeNS('', 'stroke-dasharray', strokeDashArray.toString());
        this.element.setAttributeNS('', 'stroke-dashoffset', strokeDashOffset.toString());
        this.element.setAttributeNS('', 'stroke-linecap', strokeLineCap.toString());
        this.element.setAttributeNS('', 'stroke-linejoin', strokeLineJoin.toString());
        this.element.setAttributeNS('', 'stroke-miterlimit', strokeMiterLimit.toString());
        this.element.setAttributeNS('', 'd', pathData);
        if (this.shouldAssignPathLength(pathLength)) {
            this.element.setAttributeNS('', 'pathLength', pathLength.toString());
        }
        if (filterElement) {
            this.parent.appendChild(filterElement.filterElement);
            this.element.setAttributeNS('', 'filter', `url(#${filterElement.filterId})`);
        }
    }

    public shouldAssignPathLength(pathLength : number) : boolean {
        return pathLength && typeof pathLength === 'number' && pathLength > 0;
    }

    public updateDirty() {
        this.logger.debug('Path: update dirty');
    }

    private getStrokeLineCap(graphicLineCap : GraphicLineCap) : string {
        switch (graphicLineCap) {
            case GraphicLineCap.kGraphicLineCapButt:
                return 'butt';
            case GraphicLineCap.kGraphicLineCapRound:
                return 'round';
            case GraphicLineCap.kGraphicLineCapSquare:
                return 'square';
            default:
                this.logger.warn(`Incorrect GraphicLineCap type: ${graphicLineCap}`);
                return 'butt';
        }
    }

    private getStrokeLineJoin(graphicLineJoin : GraphicLineJoin) : string {
        switch (graphicLineJoin) {
            case GraphicLineJoin.kGraphicLineJoinBevel:
                return 'bevel';
            case GraphicLineJoin.kGraphicLineJoinMiter:
                return 'miter';
            case GraphicLineJoin.kGraphicLineJoinRound:
                return 'round';
            default:
                this.logger.warn(`Incorrect GraphicLineJoin type: ${graphicLineJoin}`);
                return 'miter';
        }
    }
}
