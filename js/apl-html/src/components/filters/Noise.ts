/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { NoiseFilterKind } from '../../enums/NoiseFilterKind';
import { SoftRandom } from '../../utils/SoftRandom';
import { Filter } from '../../utils/FilterUtils';
import { FilterType } from '../../enums/FilterType';
import { IBaseFilter } from './ImageFilter';

/**
 * @ignore
 */
export interface INoise extends IBaseFilter {
    kind? : NoiseFilterKind;
    useColor? : boolean;
    sigma? : number;
}

/**
 * Type guard for INoise
 * @param filter
 * @ignore
 */
export function isINoise(filter : Filter) : filter is INoise {
    return (filter as INoise).type === FilterType.kFilterTypeNoise;
}

export class Noise {
    private static readonly DEFAULT_USE_COLOR : boolean = false;
    private static readonly DEFAULT_KIND : NoiseFilterKind = NoiseFilterKind.kFilterNoiseKindGaussian;
    private static readonly DEFAULT_SIGMGA : number = 10;
    private static readonly RANDOM_SEED : number = 42;

    private useColor : boolean;
    private kind : NoiseFilterKind;
    private sigma : number;

    private generate : boolean = false;
    private z1 : number = 0.0;

    constructor(useColor? : boolean, kind? : NoiseFilterKind, sigma? : number) {
        this.useColor = useColor === undefined ? Noise.DEFAULT_USE_COLOR : useColor;
        this.kind = kind || Noise.DEFAULT_KIND;
        // honor sigma equal zero case, otherwise if not present, assign default
        this.sigma = sigma === 0 ? 0 : sigma ? sigma : Noise.DEFAULT_SIGMGA;
    }

    // Box-Muller gaussian distribution, standard algorithm, mean=0, std.dev=1
    private gaussianNoise = () => {
        if (this.generate) {
            let u1 = 0;
            let u2 = 0;
            do {
                u1 = SoftRandom.random();
                u2 = SoftRandom.random();
            } while (u1 === 0.0);
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(Math.PI * 2 * u2);
            this.z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(Math.PI * 2 * u2);
            this.generate = false;
            return z0;
        } else {
            this.generate = true;
            return this.z1;
        }
    }

    private uniformNoise = () => {
        return Math.sqrt(3) * (SoftRandom.random() * 2 - 1.0);
    }

    /**
     * Add noise to provided one-dimensional image data.
     * @param imageData
     */
    public addNoise(imageData : ImageData) : ImageData {
        SoftRandom.seed(Noise.RANDOM_SEED);
        const func = this.kind === NoiseFilterKind.kFilterNoiseKindGaussian ? this.gaussianNoise : this.uniformNoise;
        const pix = imageData.data;

        for (let i = 0, n = pix.length; i < n; i += 4) {
            let num = func() * this.sigma;
            pix[i] = pix[i] + num;
            if (this.useColor) {
                num = func() * this.sigma;
            }
            pix[i + 1] = pix[i + 1] + num;
            if (this.useColor) {
                num = func() * this.sigma;
            }
            pix[i + 2] = pix[i + 2] + num;
        }
        return imageData;
    }
}
