/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export class Queue<T> {
    private storage: T[] = [];

    constructor(private capacity: number = Infinity) {}

    public enqueue(item: T): void {
      if (this.size() === this.capacity) {
        throw Error('Queue has reached max capacity, you cannot add more items');
      }
      this.storage.push(item);
    }
    public dequeue(): T | undefined {
      return this.storage.shift();
    }
    public size(): number {
      return this.storage.length;
    }
}
