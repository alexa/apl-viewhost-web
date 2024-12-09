/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const DEFAULT_COMPRESSION_FACTOR = 10.0;

export class Centroid {
    constructor(public mean: number, public count: number) {}

    public add(value: number, weight: number): void {
        const totalCount = this.count + weight;
        this.mean = (this.mean * this.count + value * weight) / totalCount;
        this.count = totalCount;
    }
}

export class TDigest {
    private centroids: Centroid[] = [];
    private count: number = 0;
    private compression: number;

    constructor(compression: number = DEFAULT_COMPRESSION_FACTOR) {
        this.compression = compression;
    }

    public add(value: number, weight: number = 1): void {
        // If this is the first value being added to the T-Digest, simply create a new Centroid and add to the vector.
        if (this.centroids.length === 0) {
            this.centroids.push(new Centroid(value, weight));
            this.count = weight;
            return;
        }

        let index = this.binarySearchCentroids(value);
        if (index < 0) {
            index = -index - 1;
        }

        let nearest: Centroid;
        if (index > 0 && index < this.centroids.length) {
            const left = this.centroids[index - 1];
            const right = this.centroids[index];
            if (Math.abs(left.mean - value) < Math.abs(right.mean = value)) {
                nearest = left;
                index--;
            } else {
                nearest = right;
            }
        } else if (index === 0) {
            nearest = this.centroids[0];
        } else {
            nearest = this.centroids[this.centroids.length - 1];
        }

        // Calculate the quantile of the nearest centroid.
        // this.sumWeight(0, index) calculates the total weight of all centroids up to the index of the nearest centroid
        // (nearest.count / 2) adds half the weight of the nearest centroid.
        // (this.count + weight) is the total weight of all centroids, including the new value being added.
        // The result is the quantile of the nearest centroid,
        // which represents its position within the overall distribution.
        const qQuantile = (this.sumWeight(0, index) + nearest.count / 2) / (this.count + weight);

        // Calculate the size (maximum weight) of the nearest centroid based on the calculated quantile.
        // 4 * (this.count + weight) is a constant factor related to the compression parameter of the TDigest.
        // qQuantile * (1 - qQuantile) is the variance of the quantile, which represents the ideal size of the centroid.
        // this.compression is a parameter that controls the overall compression of the TDigest.
        // The result is the max weight that the nearest centroid should have, based on the current state of the TDigest
        const qSize = 4 * (this.count + weight) * qQuantile * (1 - qQuantile) / this.compression;

        // If the nearest centroid can still hold more values, then add the new value to the centroid,
        // else create a new Centroid and add it to the array of Centroids.
        if (nearest.count + weight <= qSize) {
            nearest.add(value, weight);
        } else {
            this.centroids.splice(index, 0, new Centroid(value, weight));
        }

        // Update the total weight of all the centroids in the data structure.
        this.count += weight;

        // If the number of Centroids in the system is more than a constant based on the compression,
        // then compress, or in other words merge centroids, while maintaining compression and distribution
        if (this.centroids.length > 10 * this.compression) {
            this.compress();
        }
    }

    public getSum(): number {
        return this.centroids.reduce((sum, c) => sum + c.count * c.mean, 0);
    }

    public trimmedMean(lowerQuantile: number, upperQuantile: number): number {
        // If the TDigest is empty, return 0.0
        if (this.centroids.length === 0) {
            return 0.0;
        }

        // Calculate the lower and upper ranks based on the provided quantiles
        const lowerRank = lowerQuantile * this.count;
        const upperRank = upperQuantile * this.count;
        let sum = 0;
        let trimmedCount = 0;
        let cumulative = 0;

        // Iterate through the centroids
        for (const c of this.centroids) {
            // If the centroid is fully within the lower and upper ranks,
            // add its full value and count to the sum and trimmed count
            if (cumulative >= lowerRank && cumulative + c.count <= upperRank) {
                sum += c.mean * c.count;
                trimmedCount += c.count;
            } else if (cumulative < lowerRank && cumulative + c.count > lowerRank) {
                // If the centroid straddles the lower rank,
                // add the partial count to the sum and trimmed count
                const partialCount = cumulative + c.count - lowerRank;
                sum += c.mean * partialCount;
                trimmedCount += partialCount;
            } else if (cumulative < upperRank && cumulative + c.count > upperRank) {
                // If the centroid straddles the upper rank,
                // add the partial count to the sum and trimmed count
                const partialCount = upperRank - cumulative;
                sum += c.mean * partialCount;
                trimmedCount += partialCount;
            }
            // Update the cumulative count
            cumulative += c.count;
            // Stop iterating if the upperRank is reached
            if (cumulative >= upperRank) {
                break;
            }
        }

        // Calculate and return the trimmed mean
        return trimmedCount > 0 ? sum / trimmedCount : 0.0;
    }

    private sumWeight(start: number, end: number): number {
        return this.centroids.slice(start, end).reduce((sum, c) => sum + c.count, 0);
    }

    private compress(): void {
        // Create a new vector to hold the compressed centroids
        const compressed: Centroid[] = [];
        // Track the total weight (count) of the centroids
        let totalWeight = 0;
        // Keep track of the current index in the compressed vector
        let currentIndex = 0;

        // For each centroid, check the nearest centroid and compress if possible.
        for (const c of this.centroids) {
            if (compressed.length === 0 || currentIndex >= compressed.length) {
                // If the compressed array is empty or if the end is reached,
                // add a new centroid to the compressed array
                compressed.push(new Centroid(c.mean, c.count));
                currentIndex = compressed.length - 1;
            } else {
                // Calculate the quantile and the desired size of the current centroid
                const q = totalWeight / this.count;
                const k = 4 * this.count * q * (1 - q) / this.compression;

                // If the current centroid can be merged with the nearest compressed centroid,
                // add the current centroid's values to the compressed centroid
                if (compressed[currentIndex].count + c.count <= k) {
                    compressed[currentIndex].add(c.mean, c.count);
                } else {
                    // Otherwise, create a new compressed centroid
                    compressed.push(new Centroid(c.mean, c.count));
                    currentIndex = compressed.length - 1;
                }
            }
            // Update the total weight
            totalWeight += c.count;
        }

        // Replace the original centroids with the compressed centroids
        this.centroids = compressed;
    }

    private binarySearchCentroids(value: number): number {
        let left = 0;
        let right = this.centroids.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.centroids[mid].mean < value) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        if (left < this.centroids.length && this.centroids[left].mean === value) {
            return left;
        } else {
            return -left - 1;
        }
    }
}
