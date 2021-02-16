/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */



import {VideoPlayer as Player} from './VideoPlayer';
declare const HLS_SUPPORT : boolean;

export let VideoPlayer : typeof Player = Player;

if (HLS_SUPPORT) {
    VideoPlayer = require('./HLSVideoPlayer').HLSVideoPlayer;
}
