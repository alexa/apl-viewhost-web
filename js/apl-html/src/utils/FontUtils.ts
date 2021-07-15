/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import {LoggerFactory} from '../logging/LoggerFactory';
import {ILogger} from '../logging/ILogger';
import {FontStyle} from '../enums/FontStyle';
import * as WebFont from 'webfontloader';
import {createStylesApplier, ElementType, ElementTypes} from '../components/helpers/StylesApplier';

/**
 * Adjust exports to only export used interfaces
 * when codebase upgrades to TypeScript version that supports
 * exported variables with private names
 */
export interface SetArgs {
    element: Element;
    lang: string;
}

export interface SetFontOptions {
    elementType?: ElementTypes;
}

export interface SetFontFamilyArgs extends SetArgs {
    fontFamily: string;
}

export interface SetFontStyleArgs extends SetArgs {
    fontStyle: FontStyle;
}

export interface SetFontWeightArgs extends SetArgs {
    fontWeight: FontWeight;
}

export type FontWeight = 'normal' | 'bold' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
const FontWeights: { [key: string]: FontWeight } = {
    Thin: 100,
    ExtraLight: 200,
    Light: 300,
    NormalString: 'normal',
    Regular: 400,
    Medium: 500,
    SemiBold: 600,
    BoldString: 'bold',
    Bold: 700,
    ExtraBold: 800,
    Black: 900,
    UltraBlack: 950
};
const AMAZON_EMBER = 'amazon-ember';
const AMAZON_EMBER_DISPLAY = 'amazon-ember-display';
const BOOKERLY = 'Bookerly';
const SANS_SERIF = 'sans-serif';
const SERIF = 'serif';

const FONT_ALIAS_MAPPING: { [alias: string]: string } = {
    'amazon ember display': AMAZON_EMBER_DISPLAY,
    'amazon ember': AMAZON_EMBER,
    'bookerly': BOOKERLY,
    'sans serif': SANS_SERIF,
    'serif': SERIF
};
const FONT_STYLE_MAPPING: { [alias: number]: string } = {
    [FontStyle.kFontStyleNormal]: 'normal',
    [FontStyle.kFontStyleItalic]: 'italic'
};
const DEFAULT_FONT_STYLE: string = FONT_STYLE_MAPPING[FontStyle.kFontStyleNormal];
const ARABIC_ENABLED_FONTS: string[] = [
    'amazon ember'
];
const ARABIC_SUPPORTED_FONT_STYLES: FontStyle[] = [
    FontStyle.kFontStyleNormal
];

const ARABIC_SUPPORTED_FONT_WEIGHTS: FontWeight[] = [
    FontWeights.NormalString,
    FontWeights.Regular,
    FontWeights.Medium,
    FontWeights.Bold,
    FontWeights.BoldString
];

export class FontUtils {
    private static initialized = false;
    private static initializationCallback: () => void;
    private static logger: ILogger = LoggerFactory.getLogger('FontUtils');

    /**
     * Load the fonts using webfontloader
     * @see {@link https://github.com/typekit/webfontloader#custom|webfontloader}
     * @see {@link https://github.com/typekit/fvd|font variation description} for syntax on webfonts
     */
    public static async initialize() {
        if (!this.initialized) {
            const initializePromise = new Promise((res) => {
                this.initializationCallback = res;
            });
            const customLoader: WebFont.Custom = {
                families: [
                    'amazon-ember:n1,n2,n3,n4,n5,n6,n7,n8,n9,i1,i2,i3,i4,i5,i6,i7,i8,i9',
                    'amazon-ember-display:n1,n2,n3,n4,n5,n6,n7,n8,n9,i1,i2,i3,i4,i5,i6,i7,i8,i9',
                    'Bookerly:n1,n2,n5,i1,i4,i5'
                ]
            };
            const config: WebFont.Config = {
                custom: customLoader,
                active: (() => {
                    this.logger.debug('Fonts active');
                    this.initializationCallback();
                }),
                inactive: (() => {
                    this.logger.warn('Fonts inactive');
                    this.initializationCallback();
                }),
                fontinactive: ((fn, fvd) => {
                    this.logger.warn(`Failed to load: ${fn} : ${fvd}`);
                })
            };
            WebFont.load(config);
            this.initialized = true;
            await initializePromise;
        }
    }

    public static getFont(fontFamily: string): string {
        return findFontFamily(fontFamily);
    }

    public static getFontStyle(fontStyle: number): string {
        return findFontStyle(fontStyle);
    }

    public static setFontFamily({element, fontFamily, lang}: SetFontFamilyArgs, options: SetFontOptions = {}): void {
        options = setFontOptions(options);
        const {
            elementType
        } = options;

        if (isArabicLang(lang) && !fontFamilySupportsArabic(fontFamily)) {
            this.logger.warn(`Font Family: "${fontFamily}" does not support "${lang}"`);
        }

        createStylesApplier({
            element,
            properties: {
                'font-family': findFontFamily(fontFamily)
            },
            elementType
        }).applyStyle();
    }

    public static setFontStyle({element, fontStyle, lang}: SetFontStyleArgs, options: SetFontOptions = {}): void {
        options = setFontOptions(options);
        const {
            elementType
        } = options;

        createStylesApplier({
            element,
            properties: {
                'font-style': findFontStyle(fontStyle, lang, this.logger)
            },
            elementType
        }).applyStyle();
    }

    public static setFontWeight({element, fontWeight, lang}: SetFontWeightArgs, options: SetFontOptions = {}): void {
        options = setFontOptions(options);
        const {
            elementType
        } = options;

        const weight = findFontWeight(fontWeight, lang, this.logger);
        createStylesApplier({
            element,
            properties: {
                'font-weight': `${weight}`
            },
            elementType
        }).applyStyle();
    }
}

// Helper Functions
function setFontOptions(options: SetFontOptions) {
    const defaultOptions: SetFontOptions = {
        elementType: ElementType.HTML
    };
    return Object.assign(defaultOptions, options);
}

function findFontFamily(fontFamily: string, defaultFontFamily = undefined): string {
    function findFont(font: string, defaultFont = undefined) {
        const trimmedFontFamily = font.trim();
        let sanitizedFontFamily = trimmedFontFamily.toLowerCase();
        sanitizedFontFamily = replaceAll(sanitizedFontFamily, '-', ' ');

        if (FONT_ALIAS_MAPPING.hasOwnProperty(sanitizedFontFamily)) {
            return FONT_ALIAS_MAPPING[sanitizedFontFamily];
        }

        return defaultFont ? defaultFont : trimmedFontFamily;
    }

    if (isMultiFontFamily(fontFamily)) {
        const fonts = fontFamily.split(',');
        return fonts.map((font) => {
            return findFont(font, defaultFontFamily);
        }).reduce((accumulator, current) => {
            return accumulator ? `${accumulator}, ${current}` : current;
        }, '');
    }
    return findFont(fontFamily, defaultFontFamily);
}

function findFontStyle(fontStyle: FontStyle, lang: string = undefined, logger: ILogger = undefined): string {
    if (FONT_STYLE_MAPPING.hasOwnProperty(fontStyle)) {
        return langSupportedFontStyle(fontStyle, lang, logger);
    }
    return DEFAULT_FONT_STYLE;
}

function findFontWeight(fontWeight: FontWeight, lang: string = undefined, logger: ILogger = undefined): FontWeight {
    if (isArabicLang(lang) && !arrayIncludes(ARABIC_SUPPORTED_FONT_WEIGHTS, fontWeight)) {
        let fontOverride = FontWeights.Regular;
        if (fontWeight >= FontWeights.Medium) {
            fontOverride = FontWeights.Bold;
        }
        logger.warn(`Font Weight: "${fontWeight}" not supported in "${lang}". Default using "${fontOverride}"`);
        return fontOverride;
    }
    return fontWeight;
}

function langSupportedFontStyle(fontStyle: FontStyle, lang: string, logger: ILogger) {
    if (isArabicLang(lang) && !arrayIncludes(ARABIC_SUPPORTED_FONT_STYLES, fontStyle)) {
        const style = FONT_STYLE_MAPPING.hasOwnProperty(fontStyle) ?
            FONT_STYLE_MAPPING[fontStyle] : 'unsupported style';
        const styleOverride = DEFAULT_FONT_STYLE;
        logger.warn(`Font Style: "${style}" not supported in "${lang}". Default using "${styleOverride}"`);
        return styleOverride;
    }
    return FONT_STYLE_MAPPING[fontStyle];
}

function fontFamilySupportsArabic(fontFamily: string): boolean {
    function supportsArabic(font: string) {
        let sanitizedFont = font.trim();
        sanitizedFont = replaceAll(sanitizedFont, '-', ' ');
        return arrayIncludes(ARABIC_ENABLED_FONTS, sanitizedFont);
    }

    const mappedFont = findFontFamily(fontFamily);

    if (isMultiFontFamily(fontFamily)) {
        const fonts = mappedFont.split(',');
        return fonts.map(supportsArabic).reduce((accumulator, current) => {
            return accumulator || current;
        }, false);
    }
    return supportsArabic(fontFamily);
}

function isArabicLang(bcp47: string): boolean {
    // BCP47 String begins with 'ar'
    return bcp47 !== undefined && bcp47.indexOf('ar') === 0;
}

function isMultiFontFamily(fontFamily: string): boolean {
    return fontFamily.includes(',');
}

/**
 * @Polyfill
 */
function arrayIncludes(array: any[], value: any): boolean {
    return array.indexOf(value) !== -1;
}

/**
 * @Polyfill
 */
function replaceAll(baseString: string, substring: string, replacement: string): string {
    return baseString.split(substring).join(replacement);
}
