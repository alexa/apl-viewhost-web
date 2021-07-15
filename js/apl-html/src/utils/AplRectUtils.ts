/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Return an APL.Rect containing the delta of rect1 - rect2
 * @param rect1
 * @param rect2
 */
export function getRectDifference(rect1: APL.Rect, rect2: APL.Rect) {
    return {
        left: rect1.left - rect2.left,
        top: rect1.top - rect2.top,
        width: rect1.width - rect2.width,
        height: rect1.height - rect2.height
    };
}
