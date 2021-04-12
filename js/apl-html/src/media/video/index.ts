/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {VideoPlayer as Player} from './VideoPlayer';
declare const HLS_SUPPORT : boolean;

export let VideoPlayer : typeof Player = Player;

if (HLS_SUPPORT) {
    VideoPlayer = require('./HLSVideoPlayer').HLSVideoPlayer;
}
