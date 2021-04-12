/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { LoggerFactory } from '../logging/LoggerFactory';
import { ILogger } from '../logging/ILogger';
import { FontStyle } from '../enums/FontStyle';
import * as WebFont from 'webfontloader';

export class FontUtils {
    /// Logger to be used for this component logs.
    private static logger : ILogger = LoggerFactory.getLogger('FontUtils');

    private static readonly AMAZON_EMBER_DISPLAY = 'amazon-ember-display';
    private static readonly BOOKERLY = 'Bookerly';
    private static readonly FONT_ALIAS_MAPPING : { [alias : string] : string } = {
        'amazon ember display': FontUtils.AMAZON_EMBER_DISPLAY,
        'amazon ember': FontUtils.AMAZON_EMBER_DISPLAY,
        'sans-serif': FontUtils.AMAZON_EMBER_DISPLAY,
        'serif': FontUtils.BOOKERLY
    };
    private static readonly FONT_STYLE_MAPPING : { [alias : number] : string } = {
        [FontStyle.kFontStyleNormal] : 'normal',
        [FontStyle.kFontStyleItalic] : 'italic'
    };

    private static initialized = false;
    private static initializationCallback : () => void;

    public static async initialize() {
        if (!this.initialized) {
            const initializePromise = new Promise((res) => {
                this.initializationCallback = res;
            });
            const customLoader : WebFont.Custom = {
                families: [
                    'amazon-ember-display:n1,n2,n3,n4,n5,n6,n7,n8,n9,i1,i2,i3,i4,i5,i6,i7,i8,i9',
                    'Bookerly:n1,n2,n5,i1,i4,i5'
                ]
            };
            const config : WebFont.Config = {
                custom: customLoader,
                active: (() => {
                    this.logger.debug('Fonts active');
                    this.initializationCallback();
                }),
                inactive: (() => {
                    this.logger.warn('Fonts inactive');
                    this.initializationCallback();
                }),
                fontinactive: ((fn, fvd) => { this.logger.warn(`Failed to load: ${fn} : ${fvd}`); })
            };
            WebFont.load(config);
            this.initialized = true;
            await initializePromise;
        }
    }

    public static getFont(fontFamily : string) : string {
        return fontFamily.trim().toLowerCase() in FontUtils.FONT_ALIAS_MAPPING ?
                FontUtils.FONT_ALIAS_MAPPING[fontFamily.trim().toLowerCase()] : fontFamily.trim();
    }

    public static getFontStyle(fontStyle : number) : string {
        return fontStyle in FontUtils.FONT_STYLE_MAPPING ?
                FontUtils.FONT_STYLE_MAPPING[fontStyle] : FontUtils.FONT_STYLE_MAPPING[FontStyle.kFontStyleNormal];
    }
}
