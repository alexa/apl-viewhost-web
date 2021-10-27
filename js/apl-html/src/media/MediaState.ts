/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { TrackState } from '../enums/TrackState';
import { ILogger } from '../logging/ILogger';
import { LoggerFactory } from '../logging/LoggerFactory';
import { isTrackState } from '../utils/MediaStateUtils';
import { MediaErrorCode } from './MediaErrorCode';

const logger: ILogger = LoggerFactory.getLogger('MediaState');

export class MediaState implements APL.IMediaState  {
    public currentTime: number;
    public duration: number;
    public ended: boolean;
    public paused: boolean;
    public trackCount: number;
    public trackIndex: number;
    private errorCode: number;
    private trackState: TrackState;

    constructor() {
        this.currentTime = 0;
        this.duration = 0;
        this.ended = false;
        this.paused = true;
        this.trackCount = 0;
        this.trackIndex = 0;
        this.errorCode = MediaErrorCode.DEFAULT;
        this.trackState = TrackState.kTrackNotReady;
    }

    public getErrorCode() {
        return this.errorCode;
    }

    public getTrackState() {
        return this.trackState;
    }

    public withTrackState(trackState: TrackState) {
       if (isTrackState(trackState)) {
           this.trackState = trackState;
           return;
       }
       logger.error('Invalid track state.');
    }

    public withErrorCode(errorCode: number) {
        this.errorCode = errorCode;
    }
}
