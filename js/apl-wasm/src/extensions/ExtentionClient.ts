/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The extensionClient communicate with APLCoreEngine.
 */
export interface IExtensionClient {
    createRegistrationRequest(content : APL.Content) : string;
    processMessage(context : APL.Context | null, message : string) : boolean;
    processCommand(event : APL.Event) : string;
}

/**
 * The extensionClient instance to communicate with APLCoreEngine.
 */
export class ExtensionClient implements IExtensionClient {

    public extensionClient : APL.ExtensionClient;

    public constructor(config : APL.RootConfig, uri : string) {
        this.extensionClient = Module.ExtensionClient.create(config, uri);
        return this;
    }

    public createRegistrationRequest(content : APL.Content) : string {
        return this.extensionClient.createRegistrationRequest(content);
    }

    public processCommand(event : APL.Event) : string {
        return this.extensionClient.processCommand(event);
    }

    public processMessage(context : APL.Context | null, message : string) : boolean {
        return this.extensionClient.processMessage(context, message);
    }
}
