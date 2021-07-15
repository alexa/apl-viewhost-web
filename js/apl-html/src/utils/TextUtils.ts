/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import XRegExp = require('xregexp');

/*  Unicode regex to support truncating multiple languages
 * (\P{L}&\P{N})*               not letters and not numbers * all
 * \p{Z}                        single whitespace
 * (\p{L}|\p{N}|\p{S}|\p{P})*   letter or number or symbol or punctuation * all
 * $                            end of line
 */
const LAST_WORD_REGEX = XRegExp('(\\P{L}&\\P{N})*\\p{Z}(\\p{L}|\\p{N}|\\p{S}|\\p{P})*$');
const ELLIPSIS = '…'; // unicode U+2026

/**
 * Replaces last word of a line with ellipsis
 * @param oldText original text line to be modified
 */
export function replaceLastWordWithEllipsis(oldText: string) {
    return XRegExp.replace(oldText, LAST_WORD_REGEX, ELLIPSIS);
}

/**
 * Replaces last 3 characters with ellipsis '...'
 * @param oldText original text line to be modified
 */
export function truncateEndWithEllipsis(oldText: string) {
    const NUM_OF_CHARS = 1;
    const truncatedString = oldText.substring(0, oldText.length - NUM_OF_CHARS);
    return truncatedString + ELLIPSIS;
}
