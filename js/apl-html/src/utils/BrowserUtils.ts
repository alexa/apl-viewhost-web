/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Determine if user agent contains FireFox (ignoring case)
 * @param userAgent
 * @return true if user agent does
 */
export function browserIsFirefox(userAgent: string): boolean {
    return userAgent.toLowerCase().indexOf('firefox') !== -1;
}

/**
 * Determine if user agent contains msie, trident/, or edge/ (ignoring case)
 * @param userAgent
 * @return true if user agent does
 */
export function browserIsEdge(userAgent: string): boolean {
    return /msie\s|trident\/|edge\//i.test(userAgent);
}
