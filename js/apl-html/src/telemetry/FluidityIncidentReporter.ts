/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Counter } from './Counter';
import { MetricsRecorder } from './MetricsRecorder';
import { TDigest } from './TDigest';

export class FrameStat {
    public begin: number;
    public end: number;

    constructor(begin: number, end: number) {
        this.begin = begin;
        this.end = end;
    }
}

export interface IFluidityIncidentReporter {
    addFrameStat(frameStat: FrameStat): void;
}

export class FluidityIncidentReporter {
    private lastFrameStat: FrameStat | null = null;
    private readonly frameTimes: number[];
    private readonly windowSize: number;
    private readonly displayRefreshTimeMs: number;
    private readonly thresholdUPS: number;
    private readonly minimumDurationMs: number;
    private rollingSum: number = 0;
    private rollingSquaredSum: number = 0;
    private activeIncident: boolean = false;
    private tm95UPS: number = 0;
    private timeWhenUpsRoseAboveThreshold: number = 0;
    private incidentReportedFrameStats: FrameStat[] = [];
    private incidentReportedUpsValues: number[] = [];
    private currentIncidentId: number = 0;

    private metricsRecorder: MetricsRecorder;
    private reportFluidityEvent: (incidentId: number, frameStats: FrameStat[], upsValues: number[]) => void;
    private fluidityIncidentCounter: Counter;
    private tm95Counter: Counter;
    private fluiditySuccessCounter: Counter;
    private rollingUpsList: number[];
    private upsDigest: TDigest;

    constructor(
        windowSize: number,
        thresholdUPS: number,
        displayRefreshTimeMs: number,
        minimumDurationMs: number,
        metricsRecorder: MetricsRecorder,
        reportFluidityEvent: (incidentId: number, frameStats: FrameStat[], upsValues: number[]) => void
    ) {
        this.windowSize = windowSize;
        this.thresholdUPS = thresholdUPS < 1 ? 1 : thresholdUPS;
        this.displayRefreshTimeMs = displayRefreshTimeMs;
        this.minimumDurationMs = minimumDurationMs;
        this.frameTimes = [];
        this.upsDigest = new TDigest();
        this.rollingUpsList = [];

        this.metricsRecorder = metricsRecorder;
        this.reportFluidityEvent = reportFluidityEvent;
        this.fluidityIncidentCounter = new Counter(this.metricsRecorder, 'fluidityIncidentCounter');
        this.tm95Counter = new Counter(this.metricsRecorder, 'tm95UPS');
        this.fluiditySuccessCounter = new Counter(this.metricsRecorder, 'fluiditySuccessCounter');
    }

    public addFrameStat(frameStat: FrameStat): void {
        if (this.lastFrameStat === null) {
            this.lastFrameStat = frameStat;
            return;
        }

        let incomingFrameTime = frameStat.begin - this.lastFrameStat.begin;
        this.lastFrameStat = frameStat;

        if (incomingFrameTime < this.displayRefreshTimeMs) {
            incomingFrameTime = this.displayRefreshTimeMs;
        }

        let outgoingFrameTime = 0.0;
        if (this.frameTimes.length === this.windowSize) {
            outgoingFrameTime = this.frameTimes.shift() || 0;
        }

        this.frameTimes.push(incomingFrameTime);
        this.rollingSum += incomingFrameTime - outgoingFrameTime;
        this.rollingSquaredSum += (incomingFrameTime * incomingFrameTime) - (outgoingFrameTime * outgoingFrameTime);

        const rollingMean = this.rollingSum / this.frameTimes.length;
        let rollingVariance = (this.rollingSquaredSum / this.frameTimes.length)
            + ((this.frameTimes.length * rollingMean * rollingMean) / this.frameTimes.length)
            - (2 * rollingMean * this.rollingSum) / this.frameTimes.length;

        if (rollingVariance < 0.0) {
            rollingVariance = 0.0;
        }

        const rollingStandardDeviation = Math.sqrt(rollingVariance);
        const rollingUpfd = rollingMean + 2 * rollingStandardDeviation;
        const rollingUps = rollingUpfd / this.displayRefreshTimeMs;
        this.rollingUpsList.push(rollingUps);
        this.upsDigest.add(rollingUps);

        if (rollingUps > this.thresholdUPS && this.timeWhenUpsRoseAboveThreshold === 0 && !this.activeIncident) {
            this.timeWhenUpsRoseAboveThreshold = frameStat.begin;
        }

        if (rollingUps > this.thresholdUPS && !this.activeIncident) {
            this.incidentReportedFrameStats.push(frameStat);
            this.incidentReportedUpsValues.push(rollingUps);
        }

        if (rollingUps > this.thresholdUPS
            && !this.activeIncident
            && this.timeWhenUpsRoseAboveThreshold !== 0
            && (frameStat.begin - this.timeWhenUpsRoseAboveThreshold) > this.minimumDurationMs) {
            this.currentIncidentId++;
            this.fluidityIncidentCounter.increment(1);
            this.fluidityIncidentCounter.publish();
            this.activeIncident = true;
            this.reportFluidityEvent(
                this.currentIncidentId,
                this.getAndResetFrameIncidentReportedFrameStats(),
                this.getAndResetFrameIncidentReportedUpsValue());
        } else if (rollingUps <= this.thresholdUPS) {
            this.timeWhenUpsRoseAboveThreshold = 0;
            this.activeIncident = false;
        }
    }

    // TODO: Methods below are to support integration with DevTools FrameMetrics domain

    public emitFluidityMetrics(): void {
        this.tm95UPS = this.upsDigest.trimmedMean(0.0, 0.96);
        this.tm95Counter.increment(this.tm95UPS);
        this.tm95Counter.publish();

        this.fluiditySuccessCounter.increment(1);
        this.fluiditySuccessCounter.publish();
    }

    private getAndResetFrameIncidentReportedFrameStats(): FrameStat[] {
        const frameStats = this.incidentReportedFrameStats;
        this.incidentReportedFrameStats = [];
        return frameStats;
    }

    private getAndResetFrameIncidentReportedUpsValue(): number[] {
        const upsValues = this.incidentReportedUpsValues;
        this.incidentReportedUpsValues = [];
        return upsValues;
    }
}
