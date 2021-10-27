/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {Maybe} from './Maybe';

/**
 * Compare two arrays
 * @param array1
 * @param array2
 * @return boolean true if arrays are equal
 */
export const arrayEquals = (array1: any[], array2: any[]): boolean => {
    return JSON.stringify(array1) === JSON.stringify(array2);
};

export function last<T>(array: T[]): Maybe<T> {
    return array[array.length - 1];
}

export function isEmptyArray(array: any[]): boolean {
    return array === undefined || array.length === 0;
}
