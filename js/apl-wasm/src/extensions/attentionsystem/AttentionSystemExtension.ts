/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ExtensionCommandDefinition,
    ExtensionEventHandler,
    IExtension,
    IExtensionEventCallbackResult,
    ILiveDataDefinition,
    LiveMap
} from 'apl-html';
import {ILogger, LoggerFactory} from '../..';
import {createAplExtensionEventHandler} from '../ExtensionCreationUtils';
import {AttentionSystemEnvironment} from './AttentionSystemEnvironment';

/**
 * An APL Extension designed for bi-directional communication between the Attention System and the APL document
 * to allow for knowledge of the state of the attention system with control over the APL UI.
 */
export class AttentionSystemExtension implements IExtension {
    public static readonly URI: string = 'aplext:attentionsystem:10';

    public static readonly EVENTHANDLER_ON_ATTENTION_STATE_CHANGED_NAME: string = 'OnAttentionStateChanged';
    public static readonly PROPERTY_ATTENTION_STATE: string = 'attentionState';
    public static readonly SETTINGS_ATTENTION_SYSTEM_STATE_NAME: string = 'attentionSystemStateName';

    private logger: ILogger = LoggerFactory.getLogger('AttentionSystemExtension');
    private context: APL.Context;
    private attentionSystemState: LiveMap;
    private attentionSystemStateName: string;

    public constructor() {
        this.attentionSystemState = LiveMap.create({});
        this.attentionSystemStateName = '';
    }

    /**
     * Return the URI of this extension
     */
    public getUri(): string {
        return AttentionSystemExtension.URI;
    }

    /**
     * The attentionsystem extension environment properties.
     */
    public getEnvironment(): AttentionSystemEnvironment {
        return {
            version: '1.0'
        };
    }

    /**
     * Returns all of the commands supported by the AttentionSystem extension.
     */
    public getExtensionCommands(): ExtensionCommandDefinition[] {
        return [];
    }

    /**
     * Returns all of the event handlers supported by the AttentionSystem extension.
     */
    public getExtensionEventHandlers(): ExtensionEventHandler[] {
        return [
            new ExtensionEventHandler({
                uri: AttentionSystemExtension.URI,
                name: AttentionSystemExtension.EVENTHANDLER_ON_ATTENTION_STATE_CHANGED_NAME,
                createAplExtensionEventHandler
            })
        ];
    }

    /**
     * Returns all of the event Live Data for the current document
     */
    public getLiveData(): ILiveDataDefinition[] {
        if (this.attentionSystemStateName) {
            return [{
                name: this.attentionSystemStateName,
                data: this.attentionSystemState
            }];
        }
        return [];
    }

    /**
     * Sets the Context for later use
     * @param context Context for the current document
     */
    public setContext(context: APL.Context): void {
        this.context = context;
        this.logger.debug(`context is set to ${context}`);
    }

    /**
     * Apply extension settings retrieved from Content.
     * @param settings AttentionExtension settings object.
     */
    public applySettings(settings: object): void {
        this.logger.debug(`AttentionSystemExtension.applySettings`);
        this.attentionSystemStateName = '';
        if (settings.hasOwnProperty(AttentionSystemExtension.SETTINGS_ATTENTION_SYSTEM_STATE_NAME)) {
            const stateName = settings[AttentionSystemExtension.SETTINGS_ATTENTION_SYSTEM_STATE_NAME];
            if (stateName) {
                this.attentionSystemState = LiveMap.create({
                    [AttentionSystemExtension.PROPERTY_ATTENTION_STATE]: 'IDLE'
                });
                this.attentionSystemStateName = stateName;
                this.logger.debug(
                    `binding ${this.attentionSystemStateName} to attentionSystemState ${this.attentionSystemState}`);
            }
        }
    }

    /**
     * Handles executing custom commands defined by the extension.
     * @param uri the uri of the extension
     * @param commandName the name of the command to execute
     * @param source the source which raised the event that triggered the command
     * @param params the command parameters specified in the extension command definition
     */
    public onExtensionEvent(uri: string, commandName: string, source: object, params: object,
                            resultCallback: IExtensionEventCallbackResult): void {
    }

    public updateAttentionSystemState(state: string) {
        this.logger.info(`updateAttentionSystemState: ${state}`);
        this.attentionSystemState.update({
            [AttentionSystemExtension.PROPERTY_ATTENTION_STATE]: state
        });

        if (this.context) {
            this.context.invokeExtensionEventHandler(
                AttentionSystemExtension.URI,
                AttentionSystemExtension.EVENTHANDLER_ON_ATTENTION_STATE_CHANGED_NAME,
                JSON.stringify({[AttentionSystemExtension.PROPERTY_ATTENTION_STATE]: state}),
                false
            );
        } else {
            this.logger.warn(`updateAttentionSystemState: no context is set`);
        }
    }
}
