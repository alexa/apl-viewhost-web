/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

/**
 * Checks for equality within a given epsilon value
 *
 * @param a
 * @param b
 * @param epsilon
 */
export const isEqual = (a : number, b : number, epsilon : number) : boolean => {
    return Math.abs(a - b) < epsilon;
};

/**
 * GTE inequality between a, b, otherwise use epsilon to compare for equality
 *
 * @param a
 * @param b
 * @param epsilon
 */
export const nearlyGreaterOrEqual = (a : number, b : number, epsilon : number) : boolean => {
    return (a > b) || isEqual(a, b, epsilon);
};

/**
 * LTE inequality between a, b, otherwise use epsilon to compare for equality
 *
 * @param a
 * @param b
 * @param epsilon
 */
export const nearlyLessOrEqual = (a : number, b : number, epsilon : number) : boolean => {
    return (a < b) || isEqual(a, b, epsilon);
};
