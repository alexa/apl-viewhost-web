/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export function createAplExtensionCommandDefinition(uri: string, name: string): APL.ExtensionCommandDefinition {
    return Module.ExtensionCommandDefinition.create(uri, name);
}

export function createAplExtensionEventHandler(uri: string, name: string): APL.ExtensionEventHandler {
    return Module.ExtensionEventHandler.create(uri, name);
}
