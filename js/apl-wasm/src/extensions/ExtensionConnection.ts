/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtensionManager } from './ExtensionManager';
import { IExtensionConnection, IExtensionService, IExtensionConnectionMessage, ILogger, LoggerFactory } from 'apl-html';

/**
 * The connection to local service.
 */
export class ExtensionLocalConnection implements IExtensionConnection {
    private extensionService: IExtensionService | undefined;
    private extensionManager: ExtensionManager | undefined;
    protected logger: ILogger;

    public constructor(extensionManager: ExtensionManager, extensionService: IExtensionService) {
        this.extensionManager = extensionManager;
        this.extensionService = extensionService;
        this.logger = LoggerFactory.getLogger('ExtensionLocalConnection');
    }

    public connect(settings: string): boolean {
        if (this.extensionService) {
            this.extensionService.onConnect(settings, this);
            return true;
        }
        return false;
    }

    public reconnect(extensionManager: ExtensionManager,
                     extensionService: IExtensionService,
                     configuration: string): boolean {
        this.extensionManager = extensionManager;
        this.extensionService = extensionService;
        this.extensionService.onConnect(configuration, this);
        return true;
    }

    public disconnect(): boolean {
        if (this.extensionService) {
            this.extensionService.onDisconnect();
        }
        this.extensionService = undefined;
        this.extensionManager = undefined;
        return true;
    }

    public onClose(event: any): void {
        this.extensionService = undefined;
    }

    public onError(event: any): void {
        this.logger.error(event);
    }

    public onMessage(message: IExtensionConnectionMessage): void {
        if (message) {
            if (this.extensionManager) {
                this.extensionManager.onMessageReceived(message.uri, message.payload);
            }
        }
    }

    public onOpen(event: any): void {
    }

    public sendMessage(message: IExtensionConnectionMessage): void {
        if (this.extensionService) {
            this.extensionService.onMessage(message);
        }
    }
}
