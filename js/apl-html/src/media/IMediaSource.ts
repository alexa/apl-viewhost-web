/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * IMediaSource defines the source and playback parameters
 * @ignore
 */
export interface IMediaSource {
    /**
     * The actual URL to load the video from
     */
    url: string;

    /**
     * Duration of the track in milliseconds
     */
    duration: number;

    /**
     * Number of times to repeat. -1 is repeat forever
     */
    repeatCount: number;

    /**
     * Milliseconds from the start of the track to play from
     */
    offset: number;

    /**
     * Text tracks of the media
     */
    textTracks: ITextTrackSource[];
}

/**
 * ITextTrackSource defines the text track attached to a media source
 * @ignore
 */
export interface ITextTrackSource {
    /**
     * The kind of the text track
     */
    kind: string;

    /**
     * The actual URL to load the text track
     */
    url: string;

    /**
     * Optional description of this source
     */
    description: string;
}
