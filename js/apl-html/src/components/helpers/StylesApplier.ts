/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import {LoggerFactory} from '../../logging/LoggerFactory';

/**
 * Adjust exports to only export used interfaces
 */
export interface StylesApplier {
    applyStyle(): void;
}

export interface CssAttributeValues {
    [key: string]: string | number;
}

export type CssUnitTypes = 'px' | 'em' | '%' | '';

export type ElementTypes = 'HTML' | 'SVG';

export interface SupportedElementTypes {
    [key: string]: ElementTypes;
}

export const ElementType: SupportedElementTypes = {
    HTML: 'HTML',
    SVG: 'SVG'
};

export interface StylesApplierArgs {
    element: Element;
    properties: CssAttributeValues;
    cssUnitType?: CssUnitTypes;
    elementType?: ElementTypes;
}

export interface SupportedCSSUnitTypes {
    [key: string]: CssUnitTypes;
}

export const CssUnitType: SupportedCSSUnitTypes = {
    Pixels: 'px',
    Ems: 'em',
    Percentage: '%',
    None: ''
};

type TransformFunction = (...args: any[]) => any;

interface FunctionMap {
    [key: string]: TransformFunction;
}

const CssUnitToTemplate: FunctionMap = {
    [CssUnitType.None]: identifyFunction,
    [CssUnitType.Pixels]: appendCssAttributeType,
    [CssUnitType.Ems]: appendCssAttributeType,
    [CssUnitType.Percentage]: appendCssAttributeType
};

export function createStylesApplier(args: StylesApplierArgs): StylesApplier {
    const defaultArgs = {
        cssUnitType: CssUnitType.None,
        elementType: ElementType.HTML
    };
    const styleApplierArgs = Object.assign(defaultArgs, args);

    const {
        element: htmlElement,
        properties,
        cssUnitType,
        elementType
    } = styleApplierArgs;

    const logger = LoggerFactory.getLogger('StylesApplier');

    const ElementStyleApplier: FunctionMap = {
        [ElementType.HTML]: applyStyleToHTMLElement,
        [ElementType.SVG]: applyStyleToSVGElement
    };

    interface ApplyStyleElementArgs {
        propertyName: string;
        propertyValue: string | number;
        propertyTransform: TransformFunction;
    }

    interface ApplyStyleToHTMLElementArgs extends ApplyStyleElementArgs {
        element: HTMLElement;
    }

    function applyStyleToHTMLElement({
                                         element,
                                         propertyName,
                                         propertyValue,
                                         propertyTransform
                                     }: ApplyStyleToHTMLElementArgs) {
        element.style[propertyName] = propertyTransform(propertyValue, cssUnitType);
    }

    interface ApplyStyleToSVGElementArgs extends ApplyStyleElementArgs {
        element: SVGElement;
    }

    function applyStyleToSVGElement({
                                        element,
                                        propertyName,
                                        propertyValue,
                                        propertyTransform
                                    }: ApplyStyleToSVGElementArgs) {
        element.setAttributeNS('', propertyName, propertyTransform(propertyValue, cssUnitType));
    }

    return {
        applyStyle(): void {
            let attributeTemplate = CssUnitToTemplate[cssUnitType];
            if (!isSupportedCSSAttributeType(cssUnitType)) {
                logger.warn(`Css attribute ${cssUnitType} is not supported. No adjustments made.`);
                attributeTemplate = identifyFunction;
            }
            Object.keys(properties).map((propertyName) => {
                ElementStyleApplier[elementType]({
                    element: htmlElement,
                    propertyValue: properties[propertyName],
                    propertyTransform: attributeTemplate,
                    propertyName
                });
            });
        }
    };
}

// Helper Functions
function identifyFunction(value) {
    return value;
}

function appendCssAttributeType(value, attributeType) {
    return `${value}${attributeType}`;
}

function isSupportedCSSAttributeType(type: string): type is CssUnitTypes {
    return CssUnitToTemplate.hasOwnProperty(type);
}
