/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {createExtension, E2EEncryptionExtensionUri, IExtension} from 'apl-html';
import {createAplExtensionCommandDefinition, createAplExtensionEventHandler} from '../ExtensionCreationUtils';

export function createWasmE2EEncryptionExtension(): IExtension {
    return createExtension({
        uri: E2EEncryptionExtensionUri,
        createAplExtensionCommandDefinition,
        createAplExtensionEventHandler
    });
}
