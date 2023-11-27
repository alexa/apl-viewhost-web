/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

export interface IAudioPlayer {
    prepare(url: string, decodeMarkers: boolean): string;
    play(id: string): void;
    releaseAudioContext(): void;
    flush(): void;
}
