/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { GraphicElementType } from '../../enums/GraphicElementType';
import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { AVG } from './AVG';
import { Path } from './Path';
import { AVGText } from './AVGText';
import { ILogger } from '../../logging/ILogger';
import { Component } from '../Component';
import { AVGFilter, createAndGetFilterElement, IAVGFilterElement } from './Filter';

export class Group extends AVG {

    public children : AVG[] = [];

    constructor(graphic : APL.GraphicElement, parent : Element, logger : ILogger) {
        super(graphic, parent, logger);
        for (let i = 0; i < graphic.getChildCount(); i++) {
            const child = graphic.getChildAt(i);
            if (child.getType() === GraphicElementType.kGraphicElementTypeGroup) {
                const childAVG = new Group(child, this.element, logger);
                this.children.push(childAVG);
            } else if (child.getType() === GraphicElementType.kGraphicElementTypePath) {
                const childAVG = new Path(child, this.element, logger);
                this.children.push(childAVG);
            } else if (child.getType() === GraphicElementType.kGraphicElementTypeText) {
                const childText = new AVGText(child, this.element, logger);
                this.children.push(childText);
            }
        }
    }

    public setAllProperties() {
        const transform = this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyTransform);
        const opacity = this.graphic.getValue<number>(GraphicPropertyKey.kGraphicPropertyOpacity);
        const clipPath = Component.getClipPathElementId(
            this.graphic.getValue<string>(GraphicPropertyKey.kGraphicPropertyClipPath), this.parent);
        const filterElement : IAVGFilterElement | undefined = createAndGetFilterElement(
            this.graphic.getValue<AVGFilter[]>(GraphicPropertyKey.kGraphicPropertyFilters), this.logger);

        this.element.setAttributeNS('', 'transform', transform);
        this.element.setAttributeNS('', 'opacity', opacity.toString());
        this.element.setAttributeNS('', 'clip-path', clipPath.toString());
        if (filterElement) {
            this.parent.appendChild(filterElement.filterElement);
            this.element.setAttributeNS('', 'filter', `url(#${filterElement.filterId})`);
        }

        for (const child of this.children) {
            child.setAllProperties();
        }
    }

    public updateDirty() {
        this.logger.debug('Group: updateDirty');
    }
}
