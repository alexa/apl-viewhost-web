/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ExtensionCommandDefinition,
    ExtensionEventHandler,
    IConfigurationChangeOptions,
    IExtension,
    IExtensionEventCallbackResult,
    ILiveDataDefinition
} from 'apl-html';
import { ILogger, LoggerFactory } from '../..';
import { DocumentContext } from '../../document/DocumentContext';
import { BackstackEnvironment } from '../backstack/BackstackEnvironment';
import { ClearCommand } from '../backstack/ClearCommand';
import { GoBackCommand } from '../backstack/GoBackCommand';
import { GoBackListener } from '../backstack/GoBackListener';
import { createAplExtensionCommandDefinition } from '../ExtensionCreationUtils';
import { SavedDocument } from './SavedDocument';
import { Stack } from './Stack';

export class UnifiedBackstackExtension implements IExtension, GoBackListener {
    public readonly URI: string = 'aplext:backstack:10';
    private logger: ILogger = LoggerFactory.getLogger('BackstackExtension');
    private responsibleForBackButton: boolean;
    private backstack: Stack;
    // The active backstack id as provided by the last requesting document in settings.
    private activeDocumentId: string | undefined;

    private backstackArrayName: string | undefined;

    private restoreCallback?: (documentContext: DocumentContext) => void;

    public constructor() {
        this.backstack = new Stack();
    }

    public provideRestoreCallback(restoreCallback: (documentContext: DocumentContext) => void) {
        this.restoreCallback = restoreCallback;
    }

    /**
     * Tells the Backstack if it should handleBack as invoked by a system event,
     * or if the document is responsible.
     *
     * Example:
     * A device that allows the AplClient and Apl documents to use the AplBackstack extension, but does not allow
     * any invocation of the backstack from it's system inputs (physical button or otherwise) would set this property
     * to be TRUE.
     *
     * @param isResponsibleForBackButton True if the device does not allow, or has no mechanism for, system invocation
     * of back (making the APL document "responsible").
     */
    public setResponsibleForBackButton(isResponsibleForBackButton: boolean) {
        this.responsibleForBackButton = isResponsibleForBackButton;
    }

    /**
     * Return the URI of this extension
     */
    public getUri(): string {
        return this.URI;
    }

    /**
     * @return True if there is an active document id to use for caching @c AplDocumentState.
     */
    public shouldCacheActiveDocument(): boolean {
        return this.activeDocumentId !== undefined;
    }

    /**
     * Clear the active document id tracked by the extension.
     */
    public clearActiveDocumentId() {
        this.activeDocumentId = undefined;
    }

    /**
     * Handle system invoked back to go back 1.
     * @return True if the extension allows system back and the back event succeeded in issuing a restoreDocumentState
     * callback to the observer.
     */
    public handleBack(): boolean {
        if (!this.responsibleForBackButton) {
            const backstackSize = this.backstack.size;
            const goBackCommand: GoBackCommand = new GoBackCommand({
                backType: GoBackCommand.COUNT_BACK_TYPE,
                backValue: 1
            }, this);
            goBackCommand.execute(this.backstack);
            return this.backstack.size < backstackSize;
        }
        return false;
    }

    /**
     * Defines the callback for when a GoBack command is executed.
     */
    public onGoBack(savedDoc: SavedDocument) {
        if (this.restoreCallback) {
            this.activeDocumentId = savedDoc.getId();
            this.restoreCallback(savedDoc.restore());
        }
    }

    /**
     * The backstack extension adds the following environment properties to the assigned namespace of the entension:
     * backstack - The id’s of the documents in the backstack
     * responsibleForBackButton - True if the document is responsible for drawing a back button.
     */
    public getEnvironment(): BackstackEnvironment {
        return {
            responsibleForBackButton: this.responsibleForBackButton,
            backstack: this.backstack.getIds()
        };
    }

    /**
     * Returns all of the commands supported by the Backstack extension.
     */
    public getExtensionCommands(): ExtensionCommandDefinition[] {
        return [
            new ExtensionCommandDefinition({
                uri: this.URI,
                name: GoBackCommand.COMMAND_TYPE,
                createAplExtensionCommandDefinition
            })
                .allowFastMode(true)
                .requireResolution(false)
                .property(GoBackCommand.BACK_TYPE_KEY, GoBackCommand.COUNT_BACK_TYPE, false)
                .property(GoBackCommand.BACK_VALUE_KEY, 1, false),
            new ExtensionCommandDefinition({
                uri: this.URI,
                name: ClearCommand.COMMAND_TYPE,
                createAplExtensionCommandDefinition
            })
                .allowFastMode(true)
                .requireResolution(false)
        ];
    }

    /**
     * The backstack extension does not add any event handlers.
     */
    public getExtensionEventHandlers(): ExtensionEventHandler[] {
        return [];
    }

    public getLiveData(): ILiveDataDefinition[] {
        const liveData: ILiveDataDefinition[] = [];
        if (this.backstackArrayName) {
            liveData.push({
                name: this.backstackArrayName,
                data: this.backstack.getLiveIds()
            });
        }
        return liveData;
    }

    /**
     * Sets the Context for later use
     * @param context Context for the current document
     */
    public setContext(context: APL.Context): void {
        // No-op
    }

    /**
     * Apply extension settings retrieved from Content.
     * @param settings Backstack settings object.
     */
    public applySettings(settings: object): void {
        this.backstackArrayName = undefined;
        // handle edge case: when backs stack settings are not provided.
        // meaning document request backstack but not intent to add to backstack extension.
        if (!settings) {
            return;
        }
        if (settings.hasOwnProperty('backstackId') && settings['backstackId'] && this.activeDocumentId === undefined) {
            /**
             * The backstackId property determines if the document will be added to the backstack.
             * If the backstackId is not present or empty, the document will not be added to the backstack.
             * If it is present, the document will be added to the backstack.
             *
             * Please note that documents are added to the backstack when they are replaced by a new document,
             * and not when they are first displayed on the screen. For example:
             *
             * 1. APL Client inits with presentation of document A, which has a backstackId set.
             * 2. Backstack length is 0.
             * 3. APL Client receives and presents document B.
             * 4. Backstack length is now 1, because document A has been added to the stack.
             *
             * There is no requirement that backstackId values be unique;
             * duplicate backstackId values are permitted in the backstack.
             * Be aware that with duplicates only the most recent document in the backstack
             * can be reached with the GoBack command.
             */
            this.activeDocumentId = settings['backstackId'];
        }
        if (settings.hasOwnProperty('backstackArrayName')) {
            this.backstackArrayName = settings['backstackArrayName'];
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
        if (uri === this.URI) {
            switch (commandName) {
             case GoBackCommand.COMMAND_TYPE : {
                 const goBackCommand: GoBackCommand = new GoBackCommand(params, this);
                 goBackCommand.execute(this.backstack);
                 break;
             }
             case ClearCommand.COMMAND_TYPE : {
                 const clearCommand: ClearCommand = new ClearCommand();
                 clearCommand.execute(this.backstack);
                 break;
             }
             default : {
                 this.logger.warn(`Ignoring unknown commandType ${commandName}`);
                 break;
             }
            }
        }
    }

    /**
     * Used to add an item to the backstack.
     * @param context item to be added
     */
    public addDocumentContextToBackstack(context: DocumentContext): boolean {
        // only add items to the backstack if the backstackId has been provided in the settings
        if (this.activeDocumentId) {
            this.logger.info(`adding ${this.activeDocumentId}`);
            this.backstack.push(this.activeDocumentId, SavedDocument.create(context, this.activeDocumentId));
            this.clearActiveDocumentId();
            return true;
        } else {
            this.logger.error('backstackId missing');
            return false;
        }
    }

    public provideConfigChangeToStackedDocuments(configChange: IConfigurationChangeOptions) {
        this.backstack.getStackedItems().forEach( (savedDocument) => {
            savedDocument.storeConfigurationChange(configChange);
        });
    }
}
