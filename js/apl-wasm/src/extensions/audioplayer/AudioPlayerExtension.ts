/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IExtensionEventCallbackResult } from 'apl-html';
import { IExtension, ILiveDataDefinition } from '../IExtension';
import { AudioPlayerEnvironment } from './AudioPlayerEnvironment';
import { ExtensionCommandDefinition, ExtensionEventHandler } from '../Extension';
import { ILogger, LoggerFactory } from '../..';
import { AudioPlayerExtensionObserverInterface, Lyric } from './AudioPlayerExtensionObserverInterface';
import { LiveMap } from '../../LiveMap';
/**
 * An APL Extension designed for bi-directional communication between an AudioPlayer and APL document
 * to allow for control and command of audio stream and APL UI.
 *
 * https://aplspec.aka.corp.amazon.com/apl-extensions-release/html/extensions/audioplayer/audioplayer_extension_10.html
 */
export class AudioPlayerExtension implements IExtension {
    public static readonly URI : string = 'aplext:audioplayer:10';
    public static readonly COMMAND_PLAY_NAME : string = 'Play';
    public static readonly COMMAND_PAUSE_NAME : string = 'Pause';
    public static readonly COMMAND_PREVIOUS_NAME : string = 'Previous';
    public static readonly COMMAND_NEXT_NAME : string = 'Next';
    public static readonly COMMAND_SEEK_TO_POSITION_NAME : string = 'SeekToPosition';
    public static readonly COMMAND_TOGGLE_NAME : string = 'Toggle';
    public static readonly COMMAND_ADD_LYRICS_VIEWED_NAME : string = 'AddLyricsViewed';
    public static readonly COMMAND_ADD_LYRICS_DURATION_IN_MILLISECONS_NAME : string = 'AddLyricsDurationInMilliseconds';
    public static readonly COMMAND_FLUSH_LYRIC_DATA_NAME : string = 'FlushLyricData';
    public static readonly EVENTHANDLER_ON_PLAYER_ACTIVITY_UPDATED_NAME : string = 'OnPlayerActivityUpdated';
    public static readonly PROPERTY_OFFSET_IN_MILLISECONDS : string = 'offset';
    public static readonly PROPERTY_TOGGLE_NAME : string = 'name';
    public static readonly PROPERTY_TOGGLE_CHECKED : string = 'checked';
    public static readonly PROPERTY_LYRICS_TOKEN : string = 'token';
    public static readonly PROPERTY_LYRICS_VIEWED_LINES : string = 'lines';
    public static readonly PROPERTY_LYRICS_DURATION_IN_MILLISECONDS : string = 'durationInMilliseconds';
    public static readonly SETTINGS_PLAYBACK_STATE_NAME : string = 'playbackStateName';
    public static readonly ACTIVITY_PLAYING : string = 'PLAYING';
    public static readonly ACTIVITY_STOPPED : string = 'STOPPED';
    public static readonly ACTIVITY_PAUSED : string = 'PAUSED';
    public static readonly ACTIVITY_BUFFER_UNDERRUN : string = 'BUFFER_UNDERRUN';

    private static logger : ILogger = LoggerFactory.getLogger('AudioPlayerExtension');
    private observer : AudioPlayerExtensionObserverInterface;
    private context : APL.Context;
    private playbackState : LiveMap;
    private playbackStateName : string | undefined;

    public constructor(observer : AudioPlayerExtensionObserverInterface) {
        this.observer = observer;
        this.playbackState = LiveMap.create({});
        this.playbackStateName = undefined;
    }

    /**
     * Return the URI of this extension
     */
    public getUri() : string {
        return AudioPlayerExtension.URI;
    }

    /**
     * The audioplayer extension doesn't add any environment properties to
     * the assigned namespace of the entension at APL1.4:
     */
    public getEnvironment() : AudioPlayerEnvironment {
        return {};
    }

    /**
     * Getter for playbackStateName. Used for testing
     */
    public getPlaybackStateName() : string | undefined {
        return this.playbackStateName;
    }

    /**
     * Returns all of the commands supported by the AudioPlayer extension.
     */
    public getExtensionCommands() : ExtensionCommandDefinition[] {
        return [
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_PLAY_NAME)
                .allowFastMode(true)
                .requireResolution(false),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_PAUSE_NAME)
                .allowFastMode(true)
                .requireResolution(false),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_PREVIOUS_NAME)
                .allowFastMode(true)
                .requireResolution(false),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_NEXT_NAME)
                .allowFastMode(true)
                .requireResolution(false),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_SEEK_TO_POSITION_NAME)
                .allowFastMode(true)
                .requireResolution(false)
                .property(AudioPlayerExtension.PROPERTY_OFFSET_IN_MILLISECONDS, 0, true),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_TOGGLE_NAME)
                .allowFastMode(true)
                .requireResolution(false)
                .property(AudioPlayerExtension.PROPERTY_TOGGLE_NAME, '', true)
                .property(AudioPlayerExtension.PROPERTY_TOGGLE_CHECKED, false, true),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI,
                AudioPlayerExtension.COMMAND_ADD_LYRICS_VIEWED_NAME)
                .allowFastMode(true)
                .requireResolution(false)
                .property(AudioPlayerExtension.PROPERTY_LYRICS_VIEWED_LINES, [], true)
                .property(AudioPlayerExtension.PROPERTY_LYRICS_TOKEN, '', true),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI,
                AudioPlayerExtension.COMMAND_ADD_LYRICS_DURATION_IN_MILLISECONS_NAME)
                .allowFastMode(true)
                .requireResolution(false)
                .property(AudioPlayerExtension.PROPERTY_LYRICS_DURATION_IN_MILLISECONDS, 0, true)
                .property(AudioPlayerExtension.PROPERTY_LYRICS_TOKEN, '', true),
            new ExtensionCommandDefinition(AudioPlayerExtension.URI, AudioPlayerExtension.COMMAND_FLUSH_LYRIC_DATA_NAME)
                .allowFastMode(true)
                .requireResolution(false)
        ];
    }

    /**
     * Returns all of the event handlers supported by the AudioPlayer extension.
     */
    public getExtensionEventHandlers() : ExtensionEventHandler[] {
        return [
            new ExtensionEventHandler(AudioPlayerExtension.URI,
                AudioPlayerExtension.EVENTHANDLER_ON_PLAYER_ACTIVITY_UPDATED_NAME)
        ];
    }

    /**
     * Returns all of the event Live Data for the current document
     */
    public getLiveData() : ILiveDataDefinition[] {
        const liveData : ILiveDataDefinition[] = [];
        if (this.playbackStateName) {
            liveData.push({
                name: this.playbackStateName,
                data: this.playbackState
            });
        }
        return liveData;
    }

    /**
     * Sets the Context for later use
     * @param context Context for the current document
     */
    public setContext(context : APL.Context) : void {
        this.context = context;
        AudioPlayerExtension.logger.debug(`context is set to ${context}`);
    }

    /**
     * Apply extension settings retrieved from Content.
     * @param settings Backstack settings object.
     */
    public applySettings(settings : object) : void {
        AudioPlayerExtension.logger.debug(`AudioPlayerExtension.applySettings`);
        this.playbackStateName = undefined;
        if (settings && settings.hasOwnProperty(AudioPlayerExtension.SETTINGS_PLAYBACK_STATE_NAME)) {
            this.playbackState = LiveMap.create({offset : 0, playerActivity : AudioPlayerExtension.ACTIVITY_STOPPED });
            this.playbackStateName = settings[AudioPlayerExtension.SETTINGS_PLAYBACK_STATE_NAME];
            AudioPlayerExtension.logger.debug(
                `binding ${this.playbackStateName} to playbackState ${this.playbackState}`);
        }
    }

    /**
     * Handles executing custom commands defined by the extension.
     * @param uri the uri of the extension
     * @param commandName the name of the command to execute
     * @param source the source which raised the event that triggered the command
     * @param params the command parameters specified in the extension command definition
     */
    public onExtensionEvent(uri : string, commandName : string, source : object, params : object,
                            resultCallback : IExtensionEventCallbackResult) : void {
        let succeeded : boolean = true;

        if (uri === AudioPlayerExtension.URI && this.observer) {
            switch (commandName) {
                case AudioPlayerExtension.COMMAND_PLAY_NAME:
                    this.observer.onAudioPlayerPlay();
                    break;

                case AudioPlayerExtension.COMMAND_PAUSE_NAME:
                    this.observer.onAudioPlayerPause();
                    break;

                case AudioPlayerExtension.COMMAND_PREVIOUS_NAME:
                    this.observer.onAudioPlayerPrevious();
                    break;

                case AudioPlayerExtension.COMMAND_NEXT_NAME:
                    this.observer.onAudioPlayerNext();
                    break;

                case AudioPlayerExtension.COMMAND_SEEK_TO_POSITION_NAME:
                    if (this.confirmEventParams(AudioPlayerExtension.COMMAND_SEEK_TO_POSITION_NAME,
                        [AudioPlayerExtension.PROPERTY_OFFSET_IN_MILLISECONDS], params)) {
                        this.observer.onAudioPlayerSeekToPosition(
                            Number(params[AudioPlayerExtension.PROPERTY_OFFSET_IN_MILLISECONDS]));
                    } else {
                        succeeded = false;
                    }
                    break;

                case AudioPlayerExtension.COMMAND_TOGGLE_NAME:
                    if (this.confirmEventParams(AudioPlayerExtension.COMMAND_TOGGLE_NAME,
                        [AudioPlayerExtension.PROPERTY_TOGGLE_NAME,
                         AudioPlayerExtension.PROPERTY_TOGGLE_CHECKED], params)) {
                        this.observer.onAudioPlayerToggle(
                            params[AudioPlayerExtension.PROPERTY_TOGGLE_NAME] as string,
                            params[AudioPlayerExtension.PROPERTY_TOGGLE_CHECKED] as boolean);
                    } else {
                        succeeded = false;
                    }

                case AudioPlayerExtension.COMMAND_ADD_LYRICS_VIEWED_NAME:
                    if (this.confirmEventParams(AudioPlayerExtension.COMMAND_ADD_LYRICS_VIEWED_NAME,
                        [AudioPlayerExtension.PROPERTY_LYRICS_VIEWED_LINES,
                        AudioPlayerExtension.PROPERTY_LYRICS_TOKEN], params)) {
                        this.observer.onAddLyricsViewed(
                            params[AudioPlayerExtension.PROPERTY_LYRICS_VIEWED_LINES] as Lyric[],
                            params[AudioPlayerExtension.PROPERTY_LYRICS_TOKEN] as string);
                    } else {
                        succeeded = false;
                    }
                    break;

                case AudioPlayerExtension.COMMAND_ADD_LYRICS_DURATION_IN_MILLISECONS_NAME:
                    if (this.confirmEventParams(AudioPlayerExtension.COMMAND_ADD_LYRICS_DURATION_IN_MILLISECONS_NAME,
                        [AudioPlayerExtension.PROPERTY_LYRICS_DURATION_IN_MILLISECONDS,
                        AudioPlayerExtension.PROPERTY_LYRICS_TOKEN], params)) {
                        this.observer.onAddLyricsDurationInMilliseconds(
                            Number(params[AudioPlayerExtension.PROPERTY_LYRICS_DURATION_IN_MILLISECONDS]),
                            params[AudioPlayerExtension.PROPERTY_LYRICS_TOKEN] as string);
                    } else {
                        succeeded = false;
                    }
                    break;

                case AudioPlayerExtension.COMMAND_FLUSH_LYRIC_DATA_NAME:
                    this.observer.onFlushLyricData();
                    break;

                default:
                    AudioPlayerExtension.logger.warn(`Invalid Command: ${commandName}`);
                    succeeded = false;
            }
        } else {
            AudioPlayerExtension.logger.warn('No valid observer is set');
            succeeded = false;
        }

        if (resultCallback) {
            resultCallback.onExtensionEventResult(succeeded);
        }
    }

    private confirmEventParams(tag : string, expectedParams : string[], params : object) : boolean {
        let isMissingParams = false;
        expectedParams.forEach((param) => {
            if (!params.hasOwnProperty(param)) {
                isMissingParams = true;
                AudioPlayerExtension.logger.warn(`${tag} is missing a parameter ${param}`);
            }
        });

        return !isMissingParams;
    }

    public reportPlaybackProgress(state : string, offset : number) {
        const newPlaybackState = {offset, playerActivity : state};
        this.playbackState.update(newPlaybackState);
    }

    public reportPlaybackStateChange(state : string, offset : number) {
        this.reportPlaybackProgress(state, offset);
        AudioPlayerExtension.logger.info(`reportPlabackStateChange: ${state} ${offset}`);

        if (this.context) {
            this.context.invokeExtensionEventHandler(AudioPlayerExtension.URI,
                AudioPlayerExtension.EVENTHANDLER_ON_PLAYER_ACTIVITY_UPDATED_NAME,
                JSON.stringify({playerActivity : state}),
                false
                );
        } else {
            AudioPlayerExtension.logger.warn(`reportPlabackStateChange: no context is set`);
        }
    }
}
