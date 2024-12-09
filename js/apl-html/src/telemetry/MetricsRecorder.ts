/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Counter } from './Counter';
import { IMetricsEvent, MetricsEventType } from './MetricsEvent';
import { Timer } from './Timer';

export interface IMetricsRecorder {
    // Create a counter object.
    createCounter(counterName: string): Counter;

    // Records a milestone.
    recordMilestone(milestoneName: string): void;

    // Starts and records a timer object. When finished, the timer should be stopped.
    // Metadata may include values specific to what is being measured. For example, asset urls, or extension names.
    startTimer(timerName: string, metadata: Map<string, string>): Timer;

    // Adds a new sink to this recorder. The recorder can have multiple sinks.
    // Metrics are published in no particular order to the sinks.
    addSink(sink: IMetricsSink): void;

    // Add metadata that will be included with all metrics.
    // Will replace value if key already exists.
    addMetadata(key: string, value: string): void;

    // Merges the MetricsRecorder's metadata dictionary with this one.
    // Will overwrite values if keys exist.
    mergeMetadata(metadata: Map<string, string>): void;
}

export interface IMetricsSink {
    metricPublished(event: IMetricsEvent): void;
}

/**
 * Defines rendering milestones for APL documents. Milestones are single points in time.
 */
export enum Milestone {
    kDocumentReceived = 'M.DocumentReceived',
    kDocumentPrepared = 'M.DocumentPrepared',
    kDocumentRendered = 'M.DocumentRendered'
}

/**
 * Defines rendering segments for APL documents. Segments have a defined start/end.
 */
export enum Segment {
    kCreateContent = 'S.CreateContent',
    kPrepareContent = 'S.PrepareContent',
    kRegisterExtensions = 'S.RegisterExtensions',
    kInflateRootContext = 'S.InflateRootContext',
    kInflateViews = 'S.InflateViews',
    kLayoutViews = 'S.LayoutViews',
    kMeasureText = 'S.MeasureText',
    kRenderDocument = 'S.RenderDocument'
}

/**
 *
 */
export enum CounterName {
    kMeasureText = 'C.MeasureText'
}

// -------- INTERFACE IMPLEMENTATION --------

export class MetricsRecorder implements IMetricsRecorder {
    private sinks: IMetricsSink[] = [];
    private metadata: Map<string, string>;
    private counterList: Map<CounterName, Counter>;

    constructor() {
        this.metadata = new Map<string, string>();
        this.counterList = new Map<CounterName, Counter>();
        Object.keys(CounterName).map((key) => {
            this.counterList.set(CounterName[key], this.createCounter(CounterName[key]));
        });
    }

    public createCounter(counterName: CounterName): Counter {
        return new Counter(this, counterName);
    }

    public recordMilestone(milestoneName: Milestone): void {
        this.publishToAllSinks(
            milestoneName,
            MetricsEventType.Milestone,
            this.metadata,
            this.generateTimestamp()
        );
    }

    public startTimer(timerName: Segment, metadata: Map<string, string>): Timer {
        if (timerName === Segment.kMeasureText) {
            this.incrementCounter(CounterName.kMeasureText);
        }
        return new Timer(this, timerName, metadata);
    }

    public addSink(sink: IMetricsSink): void {
        this.sinks.push(sink);
    }

    public addMetadata(key: string, value: string): void {
        this.metadata.set(key, value);
    }

    public mergeMetadata(metadata: Map<string, string>): void {
        this.metadata = new Map([...this.metadata, ...metadata]);
    }

    public incrementCounter(name: CounterName, amount: number = 1): void {
        this.counterList.get(name)?.increment(amount);
    }

    public dumpCounters(): void {
        this.counterList.forEach((counter) => counter.publish());
    }

    // -------- HELPER METHODS --------

    public generateTimestamp(): number {
        return performance.now();
    }

    public publishToAllSinks(metricName: string, type: MetricsEventType, metadata: Map<string, string>, value: number) {
        if (this.sinks.length === 0) {
            console.log('No sinks added.');
            return;
        }

        this.sinks.forEach((sink) => {
            sink.metricPublished({
                metricName,
                type,
                metadata: new Map([...this.metadata, ...metadata]),
                value
            } as IMetricsEvent);
        });
    }
}
