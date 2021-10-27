/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DisplayState } from '../enums/DisplayState';

/**
 * Validate displayState parameter. Passed in from WASM/WS.
 * @param displayState the displayState parameter.
 * @returns displayState the matching DisplayState.
 */
export function isDisplayState(displayState: any): displayState is DisplayState {
    return displayState in DisplayState;
}
