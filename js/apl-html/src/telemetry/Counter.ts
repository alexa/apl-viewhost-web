/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricsEventType } from './MetricsEvent';
import { MetricsRecorder } from './MetricsRecorder';

export interface ICounter {
    // Increments a counter by the specified amount.
    increment(amount: number): void;
}

export class Counter implements ICounter {
    private name: string;
    private value: number = 0;
    private metricsRecorder: MetricsRecorder;

    constructor(metricsRecorder: MetricsRecorder, name: string) {
        this.name = name;
        this.metricsRecorder = metricsRecorder;
    }

    public increment(amount: number): void {
        this.value += amount;
    }

    public publish(): void {
        this.metricsRecorder.publishToAllSinks(
            this.name,
            MetricsEventType.Counter,
            new Map<string, string>(),
            this.value
        );
    }
}
