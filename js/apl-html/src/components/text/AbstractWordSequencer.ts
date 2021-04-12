/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoggerFactory } from '../../logging/LoggerFactory';
import { ILogger } from '../../logging/ILogger';

export interface ISpeakableCommand {
    onSpeechFinished();
    onMarkWord(word : string);
}

export interface ISpeakItemRequestData {
    /** Speech property of text component */
    speech : string;
}

/**
 * Base class for a TTS player.
 */
export abstract class AbstractWordSequencer {
    private static logger : ILogger = LoggerFactory.getLogger('AbstractWordSequencer');

    /**
     * @internal
     * @ignore
     */
    protected destroyed : boolean = false;

    /**
     * Maps Sequencer id to command
     * @ignore
     * @internal
     */
    private commands : {[key : string] : ISpeakableCommand} = {};

    /**
     * Called by the renderer when a speak item command needs to be executed
     * @param item
     * @returns The id of the audio playback
     */
    public abstract onSpeakItem(item : ISpeakItemRequestData) : Promise<void>;

    /**
     * Called by the renderer if the SpeakItem command gets interrupted or terminated
     * @param id ID of the audio playback
     */
    public abstract onStopSpeech(id : string);

    public abstract getSourceId() : string;

    public abstract play(id : string) : void ;

    /**
     * Call this method as each work is spoken. Used to calculate
     * karaoke highlighting
     * @param id
     * @param timings
     */
    public markWord(id : string, word : string) {
        if (this.destroyed) {
            return;
        }
        const command = this.commands[id];
        if (!command) {
            return AbstractWordSequencer.logger.warn(`Cannot mark word because there is no speak command active`);
        }
        command.onMarkWord(word);
    }

    /**
     * Called by client when TTS is finished.
     */
    public speechFinished(id : string) {
        if (this.destroyed) {
            return;
        }
        const command = this.commands[id];
        if (!command) {
            return AbstractWordSequencer.logger.warn(`Cannot mark word because there is no speak command active`);
        }
        command.onSpeechFinished();
        delete this.commands[id];
    }

    /**
     * Called by client when TTS is finished.
     */
    public speechStarted(id : string) {
        if (this.destroyed) {
            return;
        }
        const command = this.commands[id];
        if (!command) {
            return AbstractWordSequencer.logger.warn(`Cannot mark word because there is no speak command active`);
        }
    }

    /**
     * @internal
     * @ignore
     * @param command
     */
    public setCommand(id : string, command : ISpeakableCommand) {
        this.commands[id] = command;
    }

    /**
     * Destroys this component
     */
    public destroy() {
        this.destroyed = true;
    }
}
