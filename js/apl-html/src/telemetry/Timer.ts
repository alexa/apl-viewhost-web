/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricsEventType } from './MetricsEvent';
import { MetricsRecorder, Segment } from './MetricsRecorder';

export interface ITimer {
    // Stops the timer and emits a EndSegment event. After stopping, the timer cannot be restarted.
    stop(): void;

    // Stops the timer and emits a FailSegment event. After failing, the timer cannot be restarted.
    fail(): void;
}

export class Timer implements ITimer {
    private name: Segment;
    private metadata: Map<string, string>;
    private metricsRecorder: MetricsRecorder;
    private startTime: number;

    constructor(
        metricsRecorder: MetricsRecorder,
        name: Segment,
        metadata: Map<string, string>
    ) {
        this.name = name;
        this.metadata = metadata;
        this.metricsRecorder = metricsRecorder;
        this.startTime = this.metricsRecorder.generateTimestamp();
    }

    public stop(): void {
        const endTime = this.metricsRecorder.generateTimestamp();
        this.metricsRecorder.publishToAllSinks(
            this.name,
            MetricsEventType.SegmentEnd,
            this.metadata,
            endTime - this.startTime
        );
    }

    public fail(): void {
        const endTime = this.metricsRecorder.generateTimestamp();
        this.metricsRecorder.publishToAllSinks(
            this.name,
            MetricsEventType.SegmentFailed,
            this.metadata,
            endTime - this.startTime
        );
    }
}
