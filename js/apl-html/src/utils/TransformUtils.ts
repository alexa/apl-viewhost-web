/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

/**
 * Modify the TranslateX and TranslateY according to ScaleFactor.
 */
export const getScaledTransform = (originalTransform : string, scaleFactor : number) : string => {
    if (scaleFactor === 1) {
        return originalTransform;
    }
    const numberPattern = /-?\d+\.?\d*/g;
    const values = originalTransform.match(numberPattern);
    return `matrix(${values[0]}, ${values[1]}, ${values[2]}, ${values[3]},
        ${parseFloat(values[4]) * scaleFactor}, ${parseFloat(values[5]) * scaleFactor})`;
};
