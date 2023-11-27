/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// APL versions
export const APL_1_0 = 0;
export const APL_1_1 = 1;
export const APL_1_2 = 2;
export const APL_1_3 = 3;
export const APL_1_4 = 4;
export const APL_1_5 = 5;
export const APL_1_6 = 6;
export const APL_1_7 = 7;
export const APL_1_8 = 8;
export const APL_1_9 = 9;
export const APL_2022_1 = 10;
export const APL_2022_2 = 11;
export const APL_2023_1 = 12;
export const APL_2023_2 = 13;
export const APL_2023_3 = 14;
export const APL_LATEST = Number.MAX_VALUE;

export interface AplVersionUtils {
    getVersionCode(code: string): number;
}

export function createAplVersionUtils(): AplVersionUtils {

    const aplVersionCodes: Map<string, number> = new Map([
        ['1.0', APL_1_0],
        ['1.1', APL_1_1],
        ['1.2', APL_1_2],
        ['1.3', APL_1_3],
        ['1.4', APL_1_4],
        ['1.5', APL_1_5],
        ['1.6', APL_1_6],
        ['1.7', APL_1_7],
        ['1.8', APL_1_8],
        ['1.9', APL_1_9],
        ['2022.1', APL_2022_1],
        ['2022.2', APL_2022_2],
        ['2023.1', APL_2023_1],
        ['2023.2', APL_2023_2],
        ['2023.3', APL_2023_3]
    ]);

    return {
        getVersionCode(code: string): number {
            const versionCode = aplVersionCodes.get(code);
            return versionCode !== undefined ? versionCode : APL_LATEST;
        }
    };
}
