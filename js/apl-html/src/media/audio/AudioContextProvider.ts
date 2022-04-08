/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

/**
 * Interface to provide AudioContext
 */
export interface IAudioContextProvider {
    /**
     * Get audio context on demand
     */
    getAudioContext(): Promise<AudioContext>;

    /**
     * Release an audio context
     *
     * @param audioContext an AudioContext object
     */
    releaseAudioContext(audioContext: AudioContext): Promise<void>;
}

/**
 * A default audio context provider
 */
export class DefaultAudioContextProvider implements IAudioContextProvider {
    private audioContext: AudioContext;

    public getAudioContext(): Promise<AudioContext> {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return Promise.resolve(this.audioContext);
    }

    public releaseAudioContext(audioContext: AudioContext): Promise<void> {
        if (this.audioContext) {
            return this.audioContext.close().then(() => {
                this.audioContext = null;
            });
        }

        return Promise.resolve();
    }
}
