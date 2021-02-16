/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

/**
 * Defines Lyric type
 */
export interface Lyric {
    text: string;
    startTime: number;
    endTime: number;
}

/**
 * Defines observer to be notified of changes in the AudioPlayerExtension
 */
export interface AudioPlayerExtensionObserverInterface {
    /**
     * Used to notify the observer when the extension has issued a Play event.
     * The observer should change AudioPlayer state to PLAYING.
     */
     onAudioPlayerPlay();

    /**
     * Used to notify the observer when the extension has issued a Pause event.
     * The observer should change AudioPlayer state to PAUSED.
     */
     onAudioPlayerPause();

    /**
     * Used to notify the observer when the extension has issued a Next event.
     * The observer should advance AudioPlayer to the NEXT item in the queue.
     */
     onAudioPlayerNext();

    /**
     * Used to notify the observer when the extension has issued a Previous event.
     * The observer should set AudioPlayer to the PREVIOUS item in the queue.
     */
     onAudioPlayerPrevious();

    /**
     * Used to notify the observer when the extension has issued a SkipToPosition event.
     * The observer should seek the AudioPlayer offset to the provided value.
     * @param offsetInMilliseconds Offset to skip to.
     */
     onAudioPlayerSeekToPosition(offsetInMilliseconds : number);

     /**
     * Used to notify the observer when the extension has issued a Toggle event.
     * The observer should report the provided TOGGLE control state for the @c AudioPlayer.
     * https://developer.amazon.com/en-US/docs/alexa/alexa-voice-service/playbackcontroller.html#togglecommandissued
     * @param name The name of the toggle.
     * @param checked The checked state of the toggle.
     */
     onAudioPlayerToggle(name: string, checked: boolean);

     /**
     * Used to notify the observer when the extension has issued a AddLyricsViewed event.
     * The observer should store the provided Lyrics data. Details can be found at:
     * https://aplspec.aka.corp.amazon.com/apl-extensions-release/html/extensions/audioplayer/audioplayer_extension_10.html#understanding-lyrics-in-apl
     * @param token The instance of the song in which lyrics are being viewed
     * @param lines An array of @Lyric objects
     */
     onAddLyricsViewed(lines: Lyric[], token: string);

     /**
     * Used to notify the observer when the extension has issued a AddLyricsViewed event.
     * The observer should store the provided Lyrics data. Details can be found at:
     * https://aplspec.aka.corp.amazon.com/apl-extensions-release/html/extensions/audioplayer/audioplayer_extension_10.html#understanding-lyrics-in-apl
     * @param lines An array of @Lyric objects
     * @param token The instance of the song in which lyrics are being viewed
     */
     onAddLyricsDurationInMilliseconds(durationInMilliseconds: number, token: string);

     /**
     * Used to notify the observer when the extension has issued a AddLyricsDurationInMilliseconds event.
     * The observer should store the provided Lyrics usgae data. Details can be found at:
     * https://aplspec.aka.corp.amazon.com/apl-extensions-release/html/extensions/audioplayer/audioplayer_extension_10.html#understanding-lyrics-in-apl
     * @param durationInMilliseconds A long number representing how long the document displayed lyrics in milliseconds for a given track
     * @param token The instance of the song in which lyrics are being viewed
     */
     onFlushLyricData();
}
