/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpanAttributeName } from '../../enums/SpanAttributeName';
import { SpanType } from '../../enums/SpanType';
import { ILogger } from '../../logging/ILogger';
import { LoggerFactory } from '../../logging/LoggerFactory';
import { numberToColor } from '../../utils/ColorUtils';
import {createStylesApplier, CssUnitType, StylesApplierArgs} from '../helpers/StylesApplier';
import { IRichTextStyles, ISpannedTextNode } from './RichTextParser';

export class DocumentBuilder {
    private static logger: ILogger = LoggerFactory.getLogger('DocumentBuilder');
    private root: ISpannedTextNode;
    private markStyles: IRichTextStyles;
    constructor(markStyles: IRichTextStyles, end: number) {
        this.root = { type: 'root', start: 0, end, children: [] };
        this.markStyles = markStyles;
    }
    public add(span: ISpannedTextNode) {
        this.addTo(this.root, span);
    }
    public finalize(targetElement: HTMLElement) {
        if (this.root.children) {
            for (const child of this.root.children) {
                this.process(child, targetElement);
            }
        }
    }
    private addTo(to: ISpannedTextNode, what: ISpannedTextNode): boolean {
        let added = false;

        // point features don't have children
        const isTextOrLineBreak = (type: SpanType|string): boolean => {
            switch (type) {
                case 'text':
                case SpanType.kSpanTypeLineBreak:
                    return true;
                default:
                    return false;
            }
        };

        if (what.start >= to.start && what.end <= to.end) {
            if (!to.children) {
                to.children = [];
            }
            for (const child of to.children) {
                if (isTextOrLineBreak(child.type)) {
                    continue;
                }
                added = this.addTo(child, what);
                if (added) {
                    break;
                }
            }
            if (!added) {
                to.children.push(what);
                return true;
            }
        }
        return added;
    }
    /**
     * Convert span tree into rich text equivalent
     * @private
     * @param {ISpannedTextNode} sourceSpan span to be converted
     * @param {HTMLElement} targetElement the target of node conversion
     */
    private process(sourceSpan: ISpannedTextNode, targetElement: HTMLElement): void {
        const transformedElement: HTMLElement = this.transformElement(sourceSpan);
        targetElement.appendChild(transformedElement);
        if (sourceSpan.children && sourceSpan.children.length !== 0) {
            for (const child of sourceSpan.children) {
                this.process(child, transformedElement);
            }
        }
    }
    /**
     * Convert a single span into its rich text equivalents
     * @private
     * @param {ISpannedTextNode} sourceSpan to be converted
     * @returns {HTMLElement}
     */
    private transformElement(sourceSpan: ISpannedTextNode): HTMLElement {
        let convertedElement: HTMLElement = document.createElement('data');
        switch (sourceSpan.type) {
            case SpanType.kSpanTypeItalic:
                convertedElement.style.fontStyle = 'italic';
                break;
            case SpanType.kSpanTypeStrong:
                convertedElement.style.fontWeight = '700';
                break;
            case SpanType.kSpanTypeMonospace:
                convertedElement.style.fontFamily = 'monospace';
                break;
            case SpanType.kSpanTypeSubscript:
                convertedElement.style.fontSize = 'smaller';
                convertedElement.style.verticalAlign = 'sub';
                break;
            case SpanType.kSpanTypeLineBreak:
                convertedElement = document.createElement('br');
                break;
            case SpanType.kSpanTypeSuperscript:
                convertedElement.style.fontSize = 'smaller';
                convertedElement.style.verticalAlign = 'super';
                break;
            case SpanType.kSpanTypeStrike:
                convertedElement.style.textDecoration = 'line-through';
                break;
            case SpanType.kSpanTypeUnderline:
                convertedElement.style.textDecoration = 'underline';
                break;
            case SpanType.kSpanTypeNoBreak:
                convertedElement.style.whiteSpace = 'nowrap';
                break;
            case SpanType.kSpanTypeSpan:
                if (!sourceSpan.attributes) {
                    break;
                }
                for (const attribute of sourceSpan.attributes) {
                    this.addSpanAttribute(attribute, convertedElement);
                }
                break;
            case 'text':
                if (sourceSpan.text) {
                    convertedElement.textContent = sourceSpan.text;
                }
                break;
            case 'mark': {
                if (this.markStyles.markColor) {
                    convertedElement.style.color = this.markStyles.markColor;
                }
                break;
            }
            default: {
                DocumentBuilder.logger.warn('Incorrect span type');
                break;
            }
        }
        return convertedElement;
    }

    /**
     * Add a single span attribute into target html element
     * @private
     * @param {APL.SpanAttribute} attribute to be added
     * @param {HTMLElement} targetElement the target of attribute addition
     */
    private addSpanAttribute(attribute: APL.SpanAttribute, targetElement: HTMLElement): void {
        let stylesApplierArgs: StylesApplierArgs;

        switch (attribute.name) {
            case SpanAttributeName.kSpanAttributeNameColor:
                stylesApplierArgs = {
                    element: targetElement,
                    properties: {
                        color: numberToColor(attribute.value)
                    }
                };
                break;
            case SpanAttributeName.kSpanAttributeNameFontSize:
                stylesApplierArgs = {
                    element: targetElement,
                    properties: {
                        fontSize: attribute.value
                    },
                    cssUnitType: CssUnitType.Pixels
                };
                break;
            default: {
                DocumentBuilder.logger.warn('Non-supported attribute name');
                return;
            }
        }

        createStylesApplier(stylesApplierArgs).applyStyle();
    }
}
