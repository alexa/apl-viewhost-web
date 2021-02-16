/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import * as $ from 'jquery';
import { ILogger } from '../../logging/ILogger';
import { Component, SVG_NS, uuidv4 } from '../Component';
import { GraphicFilterType } from '../../enums/GraphicFilterType';

export interface IAVGFilterElement {
    filterId : string;
    filterElement : SVGFilterElement;
}

export interface IAVGFilter {
    type : GraphicFilterType;
}

export interface IDropShadowFilter extends IAVGFilter {
    color : number;
    radius : number;
    horizontalOffset : number;
    verticalOffset : number;
}

export type AVGFilter = IDropShadowFilter;

export function createAndGetFilterElement(filters : AVGFilter[],
                                          logger : ILogger) : IAVGFilterElement | undefined {
    if (!filters || filters.length === 0) {
        return undefined;
    }
    const filterElement = document.createElementNS(SVG_NS, 'filter');
    const filterId = uuidv4().toString();
    filterElement.setAttributeNS('', 'id', filterId);
    filterElement.setAttributeNS('', 'filterUnits', 'userSpaceOnUse');

    filters.map(convertAVGFilter).forEach((svgElement : SVGElement[]) => {
        if (svgElement && svgElement.length > 0) {
            svgElement.forEach( (element : SVGElement) => filterElement.appendChild(element));
        } else {
            logger.warn('incorrect avg filter type.');
        }
    });
    return { filterId, filterElement };
}

function convertAVGFilter(filter : AVGFilter) : SVGElement[] {
    const isEdge : boolean = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    switch (filter.type) {
        case GraphicFilterType.kGraphicFilterTypeDropShadow: {
            if (isEdge) {
                // TODO: remove once Legacy Edage is deprecated by using Chromium Edge.
                const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
                blur.setAttributeNS('', 'stdDeviation', filter.radius.toString());
                const offset = document.createElementNS(SVG_NS, 'feOffset');
                offset.setAttributeNS('', 'result', 'offOut');
                offset.setAttributeNS('', 'dx', filter.horizontalOffset.toString());
                offset.setAttributeNS('', 'dy', filter.verticalOffset.toString());
                const flood = document.createElementNS(SVG_NS, 'feFlood');
                flood.setAttributeNS('', 'flood-color', Component.numberToColor(filter.color));
                const composite = document.createElementNS(SVG_NS, 'feComposite');
                composite.setAttributeNS('', 'operator', 'in');
                composite.setAttributeNS('', 'in2', 'offOut');
                const merge = document.createElementNS(SVG_NS, 'feMerge');
                const shadowNode = document.createElementNS(SVG_NS, 'feMergeNode');
                const imageNode = document.createElementNS(SVG_NS, 'feMergeNode');
                imageNode.setAttributeNS('', 'in', 'SourceGraphic');
                merge.appendChild(shadowNode);
                merge.appendChild(imageNode);
                return [blur, offset, flood, composite, merge];
            }
            const dropShadow = document.createElementNS(SVG_NS, 'feDropShadow');
            dropShadow.setAttributeNS('', 'stdDeviation', filter.radius.toString());
            dropShadow.setAttributeNS('', 'dx', filter.horizontalOffset.toString());
            dropShadow.setAttributeNS('', 'dy', filter.verticalOffset.toString());
            $(dropShadow).css('flood-color', Component.numberToColor(filter.color));
            return [dropShadow];
        }
        default: {
            return [];
        }
    }
}
