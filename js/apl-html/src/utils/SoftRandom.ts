/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

 /**
  * Super simple random implementation based on linear interpolation.
  */
export class SoftRandom {
    private static seedValue : number;
    private static DECIMAL_MASK : number = 100000000;

    /**
     * Set random seed. To increased "quality" use of current time is suggested.
     * @param seed Random seed.
     */
    public static seed(seed : number) {
        this.seedValue = Math.round(seed);
    }

    /**
     * Generate random number in sequence.
     * Number is in range from 0 to 1 with "uniform" distribution.
     */
    public static random() : number {
        const val : number = ((SoftRandom.seedValue * 1103515245) + 12345) & 0x7fffffff;
        this.seedValue = val;
        return (val % SoftRandom.DECIMAL_MASK) / SoftRandom.DECIMAL_MASK;
    }
}
