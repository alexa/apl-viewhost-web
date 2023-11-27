/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// We don't want to block the main thread too long. So subtitle format conversion we do by chunks
// This number is small enough that we don't block the main thread too long to miss a frame
// This number is large enough that we don't get too many segments
const DEFAULT_CHUNK_SZIE = 50;

import { cueControl } from './CueControl';

declare var VTTCue: {
    prototype: TextTrackCue;
    new(startTime: number, endTime: number, text: string): TextTrackCue;
};

export type TextTrackKind = 'captions' | 'chapters' | 'descriptions' | 'metadata' | 'subtitles';

export function clearAllTextTracks(video: HTMLVideoElement) {
    const tracks = video.querySelectorAll('track');
    for (let i = 0; i < tracks.length; i++) {
        video.textTracks[i].mode = 'disabled';
        video.removeChild(tracks[i]);
    }
}

export function loadDynamicTextTrack(video: HTMLVideoElement, url: string, kind: TextTrackKind,
                                     chunkSize: number = DEFAULT_CHUNK_SZIE) {
    const track = document.createElement('track');
    track.kind = kind;
    video.appendChild(track);
    const textTrack = video.textTracks[0];

    fetch(url, {mode: 'cors'})
        .then((response) => response.text())
        .then((data) => {
            if (cueControl.isShowing()) {
                textTrack.mode = 'showing';
            } else {
                textTrack.mode = 'hidden';
            }

            if (getType(data) === 'vtt') {
                // HTML text track component doesn't like cors, so we need to create a blob inside the memory
                const blob = new Blob([data], {
                    type: 'text/plain'
                });
                track.src = URL.createObjectURL(blob);
            } else {
                setTimeout(() => {
                    addDynamicSRTTrack(data, 0, textTrack, chunkSize);
                }, 0);
            }
    });
}

function getType(data: string): string {
    // VTT has text WEBVTT as the first line
    if (data.split('\n', 1)[0].toLowerCase() === 'webvtt') {
        return 'vtt';
    }

    // SRT has no indicator in its file, so we try to match the timestamp line in the first 100 chars
    const findLineNumber = /\d+(?:\r\n|\r|\n)(?=(?:\d\d:\d\d:\d\d,\d\d\d)\s-->\s(?:\d\d:\d\d:\d\d,\d\d\d))/g;
    if (data.substring(0, 100).match(findLineNumber)) {
        return 'srt';
    }

    return 'unsupported';
}

// SRT to VTT

function toTime(timeString: string) {
    const t = timeString.match(/(\d+):(\d+):(\d+)(?:,(\d+))/);
    // the same regex is used to find the string, so 't' won't be null in any case
    const time = Number(t![1]) * 3600 + Number(t![2]) * 60 + Number(t![3]) + Number(t![4]) / 1000;
    return time;
}

function toVTTCue(srtCue: string) {
    // match timestamp and the rest of text
    // webVtt doesn't support pixel based positioning anyway. So we just ingore the X1,X2,Y1,Y2 in the timestamp line
    const matchTimestamp = /(\d\d:\d\d:\d\d,\d\d\d)/g;
    const matches = srtCue.match(matchTimestamp);
    if (!matches) {
        return null;
    }
    const start = matches[0];
    const end = matches[1];
    let text = srtCue.slice(srtCue.indexOf('\n')).trim();
    // remove the ASS tags.
    text = text.replace(/\{\\.*?\}/g, '');

    const vtt = new VTTCue(toTime(start), toTime(end), text);
    return vtt;
}

function addDynamicSRTTrack(srt: string, cursor: number, textTrack: TextTrack, chunkSize: number) {
    if (textTrack.mode === 'disabled') {
        return;
    }
    // find digits followed by a single line break and timestamps
    const findLineNumber = /\d+(?:\r\n|\r|\n)(?=(?:\d\d:\d\d:\d\d,\d\d\d)\s-->\s(?:\d\d:\d\d:\d\d,\d\d\d))/g;
    const srtSeg = srt.substring(cursor);

    // we don't want to block the main thread too long. So only process chunkSize lines once
    const srtArray = srtSeg.split(findLineNumber, chunkSize);

    // remember the parser position for the next iteration
    const endSeg = cursor + srtSeg.indexOf(srtArray[srtArray.length - 1]) + srtArray[srtArray.length - 1].length;
    if (endSeg === cursor) {
        return;
    }

    // parser one line of subtitle and convert to vtt
    srtArray.forEach((srtCue) => {
        const vtt = toVTTCue(srtCue);
        if (vtt) {
            textTrack.addCue(vtt);
        }
    });

    setTimeout(() => {
        addDynamicSRTTrack(srt, endSeg, textTrack, chunkSize);
    }, 0);
}
