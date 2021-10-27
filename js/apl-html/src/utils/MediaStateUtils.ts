/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrackState } from '../enums/TrackState';

/**
 * Validate trackState parameter. Passed in from WASM/WS.
 * @param trackState the trackState parameter.
 * @returns trackState the matching TrackState.
 */
export function isTrackState(trackState: any): trackState is TrackState {
    return trackState in TrackState;
}
