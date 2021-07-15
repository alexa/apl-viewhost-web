/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

export class Blur {
    private static readonly CHANNEL_MAX = 255;
    private static readonly BOX_BLUR_ITERATIONS = 3;
    private radius: number;

    constructor(r: number) {
        this.radius = r;
    }

    /**
     * Apply blur on provided imageData.
     *
     * @param imageData one-dimensional image data array
     */
    public apply(imageData: ImageData): ImageData {
        const pix = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const helperArray = new Uint8ClampedArray(pix.length);
        this.gaussBlur(pix, helperArray, width, height, this.radius);
        return imageData;
    }

    /**
     * Generate boxRadius for each iteration.
     *
     * @param sigma standard deviation
     * @param nBoxes number of boxes
     */
    private boxesForGauss(sigma: number, nBoxes: number): number[]  {
        let boxWidth = Math.floor(Math.sqrt((12 * sigma * sigma / nBoxes) + 1));
        boxWidth = boxWidth % 2 === 0 ? boxWidth - 1 : boxWidth; // keep it odd
        const mIdeal = (12 * sigma * sigma - nBoxes * boxWidth * boxWidth - 4 * nBoxes * boxWidth - 3 * nBoxes) /
            (-4 * boxWidth - 4);
        const sizes = [];
        for (let i = 0; i < nBoxes; i++) {
            sizes.push( i < Math.round(mIdeal) ? boxWidth : boxWidth + 2);
        }
        return sizes;
    }

    /**
     * Gaussian blur by performing 3 times of box blur on one-dimensional image data arrays.
     *
     * @param src one-dimensional source image data array, will be mutated
     * @param dst one-dimensional destination image data array, will be mutated
     * @param width width of image
     * @param height height of image
     * @param radius blur radius
     */
    private gaussBlur(
        src: Uint8ClampedArray,
        dst: Uint8ClampedArray,
        width: number,
        height: number,
        radius: number) {

        if (radius <= 0) {
            return;
        }
        const boxRadius = this.boxesForGauss(radius / 2.0, Blur.BOX_BLUR_ITERATIONS);
        for (let i = 0; i < Blur.BOX_BLUR_ITERATIONS; i++) {
            this.boxBlur(src, dst, width, height, boxRadius[i]);
            this.boxBlur(dst, src, height, width, boxRadius[i]);
        }
    }

    /**
     * Box blur with accumulators for RGBA channels with time complexity O(n).
     *
     * @param src one-dimensional source image data array, will be mutated
     * @param dst one-dimensional destination image data array, will be mutated
     * @param width width of image
     * @param height height of image
     * @param boxRadius box radius
     */
    private boxBlur(
        src: Uint8ClampedArray,
        dst: Uint8ClampedArray,
        width: number,
        height: number,
        boxRadius: number) {
        const boxDiameter = boxRadius * 2.0 + 1;

        for (let y = 0, srcRow = 0; y < height; y++, srcRow += width) {
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let sumAlpha = 0;

            for (let i = -boxRadius; i <= boxRadius; i++) {
                const ri = srcRow + Math.max(0, Math.min(i, width - 1));
                sumR += src[ri * 4];
                sumG += src[ri * 4 + 1];
                sumB += src[ri * 4 + 2];
                sumAlpha += src[ri * 4 + 3];
            }

            let avgR;
            let avgG;
            let avgB;
            let avgAlpha;

            let nextSrcCol;
            let existingSrcCol;

            for (let x = 0; x < width; x++) {
                avgR = sumR / boxDiameter;
                avgG = sumG / boxDiameter;
                avgB = sumB / boxDiameter;
                avgAlpha = sumAlpha / boxDiameter;

                // Set destination with current average for each channel
                dst[(x * height + y) * 4] = Math.min(avgR, Blur.CHANNEL_MAX);
                dst[(x * height + y) * 4 + 1] = Math.min(avgG, Blur.CHANNEL_MAX);
                dst[(x * height + y) * 4 + 2] = Math.min(avgB, Blur.CHANNEL_MAX);
                dst[(x * height + y) * 4 + 3] = Math.min(avgAlpha, Blur.CHANNEL_MAX);

                // Add the next pixel to the moving-window sum for next iteration
                nextSrcCol = Math.min(x + boxRadius + 1, width - 1);
                const enteringColourI = srcRow + nextSrcCol;
                sumR += src[enteringColourI * 4];
                sumG += src[enteringColourI * 4 + 1];
                sumB += src[enteringColourI * 4 + 2];
                sumAlpha += src[enteringColourI * 4 + 3];

                // Subtract the pixel being removed from the moving sum
                existingSrcCol = Math.max(0, x - boxRadius);
                const exitingColourI = srcRow + existingSrcCol;
                sumR -= src[exitingColourI * 4];
                sumG -= src[exitingColourI * 4 + 1];
                sumB -= src[exitingColourI * 4 + 2];
                sumAlpha -= src[exitingColourI * 4 + 3];
            }
        }
    }
}
