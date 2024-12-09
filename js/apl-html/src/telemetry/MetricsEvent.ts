/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IMetricsEvent {
    // The name of this metric.
    metricName: string;

    // The type of metric event this is.
    type: MetricsEventType;

    // The snapshot of metadata at the time of recording this metric.
    metadata: Map<string, string>;

    // Value depends on what the type is. See enum comments.
    value: number;
}

export enum MetricsEventType {
    // Counters have a value that is the current increment of a counter.
    Counter,
    // The end of some measurable operation. The value is the elapsed time in milliseconds.
    SegmentEnd,
    // The end of some measurable operation that failed. The value is the elapsed time in milliseconds.
    SegmentFailed,
    // A significant event in the document lifecycle. The value is a platform timestamp in milliseconds.
    Milestone
}
