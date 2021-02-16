/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

// TODO -> When upgrading to TS 3.x.x make HLSPlayer conditionally compiled
// https://issues.labcollab.net/browse/ARC-867
import {VideoPlayer as Player} from './VideoPlayer';
declare const HLS_SUPPORT : boolean;

export let VideoPlayer : typeof Player = Player;

if (HLS_SUPPORT) {
    VideoPlayer = require('./HLSVideoPlayer').HLSVideoPlayer;
}
