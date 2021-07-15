/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CreateAplExtensionCommandDefintion,
    CreateAplExtensionEventHandler,
    ExtensionCommandDefinition,
    ExtensionEventHandler,
    IExtension,
    ILiveDataDefinition
} from '../IExtension';
import {IExtensionEventCallbackResult} from '../IExtensionEventCallbackResult';
import {Algorithm, encodeBase64, EncodeBase64Args, encrypt, EncryptBase64Args, ExtensionResult} from './CryptoUtils';

enum Commands {
    BASE64_ENCODE = 'Base64EncodeValue',
    BASE64_ENCRYPT = 'Base64EncryptValue'
}

enum Events {
    ON_ENCRYPT_SUCCESS = 'OnEncryptSuccess',
    ON_BASE64_ENCODE_SUCCESS = 'OnBase64EncodeSuccess',
    ON_ENCRYPT_FAILURE = 'OnEncryptFailure'
}

export const E2EEncryptionExtensionUri = 'aplext:e2eencryption:10';

export function createE2EEncryptionExtension(
    createExtensionCommand: CreateAplExtensionCommandDefintion,
    createExtensionEventHandler: CreateAplExtensionEventHandler
): IExtension {
    let mContext;

    const error = async function(reason: string, id: string) {
        this.context.invokeExtensionEventHandler(
            getUri(),
            Events.ON_ENCRYPT_FAILURE, JSON.stringify({
                id,
                reason
            }),
            false
        );
    };

    const setContext = (context: APL.Context): void => {
        mContext = context;
    };

    const applySettings = (settings: object): void => {
    };

    const getEnvironment = (): any => {
        return {
            version: '1.0',
            supportedAlgorithms: [Algorithm.RSASHA1, Algorithm.RSASHA256, Algorithm.AES]
        };
    };

    function getExtensionCommands(): ExtensionCommandDefinition[] {
        const uri = getUri();
        return [
            new ExtensionCommandDefinition({
                uri,
                name: Commands.BASE64_ENCODE,
                createAplExtensionCommandDefinition: createExtensionCommand
            })
                .property('token', '', false)
                .property('value', 'string', true)
                .allowFastMode(true),
            new ExtensionCommandDefinition({
                uri,
                name: Commands.BASE64_ENCRYPT,
                createAplExtensionCommandDefinition: createExtensionCommand
            })
                .property('token', '', false)
                .property('value', 'string', true)
                .property('key', '', false)
                .property('algorithm', 'string', true)
                .property('aad', '', false)
                .property('base64Encoded', false, false)
                .allowFastMode(true)
        ];
    }

    function getExtensionEventHandlers(): ExtensionEventHandler[] {
        const uri = getUri();
        return [
            new ExtensionEventHandler({
                uri,
                name: Events.ON_ENCRYPT_SUCCESS,
                createAplExtensionEventHandler: createExtensionEventHandler
            }),
            new ExtensionEventHandler({
                uri,
                name: Events.ON_BASE64_ENCODE_SUCCESS,
                createAplExtensionEventHandler: createExtensionEventHandler
            }),
            new ExtensionEventHandler({
                uri,
                name: Events.ON_ENCRYPT_FAILURE,
                createAplExtensionEventHandler: createExtensionEventHandler
            })
        ];
    }

    const getLiveData = (): ILiveDataDefinition[] => [];

    const getUri = (): string => E2EEncryptionExtensionUri;

    async function onExtensionEvent(uri: string,
                                    commandName: string,
                                    source: any,
                                    params: EncodeBase64Args,
                                    resultCallback: IExtensionEventCallbackResult): Promise<void> {
        if (uri !== getUri()) {
            await error(`Extension ${getUri()} was called with incorrect URI: ${uri}`, params.token);
            return;
        }

        let result: ExtensionResult;
        let event: string;
        try {
            switch (commandName as Commands) {
                case Commands.BASE64_ENCRYPT :
                    result = await encrypt(params as EncryptBase64Args);
                    event = Events.ON_ENCRYPT_SUCCESS;
                    break;
                case Commands.BASE64_ENCODE :
                    result = encodeBase64(params);
                    event = Events.ON_BASE64_ENCODE_SUCCESS;
                    break;
                default:
                    event = Events.ON_ENCRYPT_FAILURE;
                    result = {
                        token: params.token,
                        errorReason: `Could not handle encryption request: ${JSON.stringify(params)}`
                    };
                    break;
            }
            if (result.hasOwnProperty('message')) {
                event = Events.ON_ENCRYPT_FAILURE;
            }
        } catch (error) {
            event = Events.ON_ENCRYPT_FAILURE;
            result = {
                token: params.token,
                errorReason: error.message
            };
        }
        mContext.invokeExtensionEventHandler(
            getUri(),
            event,
            JSON.stringify(result),
            false
        );
    }

    const extension = {};
    Object.defineProperties(extension,
        {
            getUri: {value: getUri},
            getEnvironment: {value: getEnvironment},
            getExtensionCommands: {value: getExtensionCommands},
            getExtensionEventHandlers: {value: getExtensionEventHandlers},
            getLiveData: {value: getLiveData},
            onExtensionEvent: {value: onExtensionEvent},
            setContext: {value: setContext},
            applySettings: {value: applySettings}
        }
    );
    return extension as IExtension;
}
