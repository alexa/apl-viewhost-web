/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts a number to css rgba format
 * @param val Number value to convert
 */
export function numberToColor(val) {
    const a = (0xFF & val) / 0xFF;
    const b = 0xFF & (val >> 8);
    const g = 0xFF & (val >> 16);
    const r = 0xFF & (val >> 24);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}
