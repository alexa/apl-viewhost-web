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
} from './IExtension';
import {IExtensionEventCallbackResult} from './IExtensionEventCallbackResult';

const extensionFactories = {
};

export interface CreateExtensionArgs {
    uri: string;
    createAplExtensionCommandDefinition: CreateAplExtensionCommandDefintion;
    createAplExtensionEventHandler: CreateAplExtensionEventHandler;
}

export function createExtension(args: CreateExtensionArgs): IExtension {
    const {uri, createAplExtensionCommandDefinition, createAplExtensionEventHandler} = args;
    if (extensionFactories.hasOwnProperty(uri)) {
        return extensionFactories[uri](createAplExtensionCommandDefinition, createAplExtensionEventHandler);
    }
    return new NullExtension(uri);
}

class NullExtension implements IExtension {
    constructor(private uri: string) {
    }

    public applySettings(settings: object): any {
    }

    public getEnvironment(): any {
    }

    public getExtensionCommands(): ExtensionCommandDefinition[] {
        return [];
    }

    public getExtensionEventHandlers(): ExtensionEventHandler[] {
        return [];
    }

    public getLiveData(): ILiveDataDefinition[] {
        return [];
    }

    public getUri(): string {
        return this.uri;
    }

    public onExtensionEvent(uri: string,
                            commandName: string,
                            source: object,
                            params: object,
                            resultCallback: IExtensionEventCallbackResult): any {
    }

    public setContext(context: APL.Context): void {
    }
}
