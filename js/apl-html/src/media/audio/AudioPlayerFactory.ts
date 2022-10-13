/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { IAudioEventListener } from './IAudioEventListener';
import { IAudioPlayer } from './IAudioPlayer';

export abstract class IAudioPlayerFactory {
    public abstract tick(): void;
}

export type AudioPlayerFactory = (eventListener: IAudioEventListener) => IAudioPlayer;
