/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlaybackState } from './Resource';

/**
 * @ignore
 */
export interface IMediaEventListener {
    onPlayerReady(): void;
    onEvent(event: PlaybackState): void;
}
