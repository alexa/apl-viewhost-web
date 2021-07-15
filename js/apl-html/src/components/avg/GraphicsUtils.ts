/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ILogger} from '../../logging/ILogger';
import {createGradientElement, IAVGGradient} from './Gradient';
import {getOrCreatePatternElementWithArgs} from './Patterns';
import {IValueWithReference} from '../Component';
import {numberToColor} from '../../utils/ColorUtils';

export interface FillAndStrokeConverterArgs {
    value: object;
    transform: string;
    parent: Element;
    logger: ILogger;
    lang?: string;
}

/*
 * Converts to Color if input is number otherwise create Gradient or Pattern element.
 * @param value Object value which could be either Color, Gradient or Pattern
 * @param parent the parent element
 * @param logger logger for console output
 */

// tslint:disable-next-line:max-line-length
export function fillAndStrokeConverter(args: FillAndStrokeConverterArgs): IValueWithReference | undefined {
    const defaultArgs = {
        lang: ''
    };
    args = Object.assign(defaultArgs, args);
    const {
        value,
        transform,
        parent,
        logger,
        lang
    } = args;

    if (typeof value === 'number') {
        return {
            value: numberToColor(value)
        };
    }

    if ((value as IAVGGradient).type !== undefined) {
        return createGradientElement(value as IAVGGradient, transform, parent, logger);
    } else if ((value as APL.GraphicPattern).getId()) {
        return getOrCreatePatternElementWithArgs({
            graphicPattern: value as APL.GraphicPattern,
            transform,
            logger,
            lang
        });
    }
    // non-supported type
    logger.warn('Type is not supported yet.');
    return undefined;
}
