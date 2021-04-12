/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { GraphicElementType } from '../../enums/GraphicElementType';
import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { ILogger } from '../../logging/ILogger';
import { Component, IValueWithReference, SVG_NS } from '../Component';
import { AVGFilter, createAndGetFilterElement } from './Filter';
import { FontUtils } from '../..';

export abstract class AVG {
    /**  The svg element rendered */
    public element : Element;
    /** Elements that properties on this element require. */
    private referencedElements : Map<GraphicPropertyKey, Element> = new Map();
    /** Functions to set each graphic property */
    protected graphicKeysToSetters : Map<GraphicPropertyKey, (key : GraphicPropertyKey) => void>;

    protected constructor(public graphic : APL.GraphicElement,
                          protected parent : Element, protected logger : ILogger) {
        let tag : string;
        if (graphic.getType() === GraphicElementType.kGraphicElementTypeGroup) {
            tag = 'g';
        } else if (graphic.getType() === GraphicElementType.kGraphicElementTypePath) {
            tag = 'path';
        } else if (graphic.getType() === GraphicElementType.kGraphicElementTypeText) {
            tag = 'text';
        } else {
            this.logger.debug(`GraphicElement type ${graphic.getType()} is not supported`);
            return;
        }
        this.element = document.createElementNS(SVG_NS, tag);
        parent.appendChild(this.element);
    }

    public setAllProperties() {
        const allProps = new Set(this.graphicKeysToSetters.keys());
        this.updateProperties(this.graphicKeysToSetters, allProps);
    }

    public updateDirty() {
        const dirtyProps = new Set(this.graphic.getDirtyProperties());
        this.updateProperties(this.graphicKeysToSetters, dirtyProps);
    }

    protected updateProperties(
        graphicSetters : Map<GraphicPropertyKey, (graphicPropertyKey : GraphicPropertyKey) => void>,
        keysToUpdate : Set<GraphicPropertyKey>) {
        keysToUpdate.forEach((graphicPropertyKey) => {
            const updateProperty = graphicSetters.get(graphicPropertyKey);
            if (updateProperty) {
                updateProperty(graphicPropertyKey);
            } else {
                this.logger.error(`Could not update graphic property key: ${graphicPropertyKey}`);
            }
        });
    }

    protected setAttribute(attributeName : string) : (key : GraphicPropertyKey) => void {
        return (key : GraphicPropertyKey) => {
            const graphicPropertyValue = this.graphic.getValue(key);
            this.element.setAttributeNS('', attributeName, graphicPropertyValue.toString());
        };
    }

    protected setAttributeFromMap(
        attributeName : string,
        map : Map<number, string>,
        defaultValue : string) {
        return (key : GraphicPropertyKey) => {
            const graphicValue = this.graphic.getValue<number>(key);
            let elementValue = map.get(graphicValue);
            if (!elementValue) {
                elementValue = defaultValue;
            }
            this.element.setAttributeNS('', attributeName, elementValue);
        };
    }

    private setFillAndStroke(transformKey : GraphicPropertyKey,
                             valueKey : GraphicPropertyKey,
                             attributeName : string) : (key : GraphicPropertyKey) => void {
        const create = () => {
            const transform = this.graphic.getValue<string>(transformKey);
            return Component.fillAndStrokeConverter(
                this.graphic.getValue<object>(valueKey),
                transform, this.parent, this.logger);
        };
        return this.createElementForAttribute(attributeName, create);
    }

    protected setFill() {
        return this.setFillAndStroke(
            GraphicPropertyKey.kGraphicPropertyFillTransform,
            GraphicPropertyKey.kGraphicPropertyFill,
            'fill');
    }

    protected setStroke() {
        return this.setFillAndStroke(
            GraphicPropertyKey.kGraphicPropertyStrokeTransform,
            GraphicPropertyKey.kGraphicPropertyStroke,
            'stroke');
    }

    protected setFontStyle(attributeName : string) {
        return (key : GraphicPropertyKey) => {
            const fontStyle = this.graphic.getValue<number>(key);
            const convertedValue = FontUtils.getFontStyle(fontStyle);
            this.element.setAttributeNS('', attributeName, convertedValue.toString());
        };
    }

    protected setFilter() {
        const createFilterElement = () => {
            return () => {
                const filterElement = createAndGetFilterElement(
                    this.graphic.getValue<AVGFilter[]>(GraphicPropertyKey.kGraphicPropertyFilters),
                    this.logger);
                if (filterElement) {
                    return {
                        value: `url(#${filterElement.filterId})`,
                        reference: filterElement.filterElement
                    };
                }
                return undefined;
            };
        };
        return this.createElementForAttribute('filter', createFilterElement());
    }

    protected createElementForAttribute(attributeName : string, createElement : () => IValueWithReference) {
        return (key : GraphicPropertyKey) => {
            if (this.referencedElements.has(key)
                && this.element.parentElement.contains(this.referencedElements.get(key))) {
                this.element.parentElement.removeChild(this.referencedElements.get(key));
            }
            const newElement = createElement();
            if (!newElement) {
                this.referencedElements.delete(key);
            } else {
                this.element.setAttributeNS('', attributeName, newElement.value);
                if (newElement.reference) {
                    this.element.parentElement.appendChild(newElement.reference);
                    this.referencedElements.set(key, newElement.reference);
                }
            }
        };
    }
}
