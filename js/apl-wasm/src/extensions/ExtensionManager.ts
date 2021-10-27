/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Content, IExtension, IExtensionConnection, IExtensionEventCallbackResult, IExtensionManager,
    IExtensionService, ILogger, LiveArray, LiveMap, LoggerFactory} from 'apl-html';
import { ExtensionConfiguration } from './ExtensionConfiguration';
import { ExtensionLocalConnection } from './ExtensionConnection';
import { ExtensionClient, IExtensionClient } from './ExtentionClient';

/**
 * Extension Manager responsible for containing available extensions and registering requested extension
 * with the root config.
 */
export class ExtensionManager implements IExtensionManager {
    public rootContext: APL.Context | undefined;
    /// Logger to be used for this component logs.
    protected logger: ILogger;
    private extensions: Map<string, IExtension>;
    private connections: Map<string, IExtensionConnection>;
    private extensionClients: Map<string, IExtensionClient>;
    private extensionServices: Map<string, IExtensionService>;
    private extensionConfiguration: ExtensionConfiguration;

    constructor(extensionServices?: Map<string, IExtensionService>) {
        this.extensions = new Map<string, IExtension>();
        this.extensionServices = extensionServices || new Map<string, IExtensionService>();
        this.connections = new Map<string, IExtensionConnection>();
        this.extensionClients = new Map<string, IExtensionClient>();
        this.extensionConfiguration = new ExtensionConfiguration();
        this.logger = LoggerFactory.getLogger('ExtensionManager');
    }

    public getBuildInExtension(uri: string) {
        return this.extensions.get(uri);
    }

    public addExtension(extension: IExtension): void {
        this.extensions.set(extension.getUri(), extension);
    }

    public isBuildInExtensionSupported(uri: string): boolean {
        return this.getBuildInExtension(uri) != null;
    }

    public registerRequestedExtensions(rootConfig: APL.RootConfig, content: Content): void {
        content.getExtensionRequests().forEach((requestedExtensionUri) => {
            const extension = this.getBuildInExtension(requestedExtensionUri);
            if (extension != null) {
                this.registerBuildInExtensions(extension, rootConfig, content);
            } else {
                this.registerDynamicExtensions(requestedExtensionUri, rootConfig, content);
            }
        });
        // register completed.
        this.disconnectUnusedConnections();
    }

    public onExtensionEvent(uri: string,  event: APL.Event, commandName: string, source: object, params: object,
                            resultCallback: IExtensionEventCallbackResult): void {
        let handled = false;
        if (this.isBuildInExtensionSupported(uri)) {
            handled = this.onBuildInExtensionEvent(uri, commandName, source, params, resultCallback);
        } else {
            handled = this.onDynamicExtensionEvent(uri, event);
        }
        if (!handled) {
            this.logger.info(`Callback not handled for uri:  ${uri}`);
        }
    }

    public onDocumentRender(rootContext: APL.Context, content: APL.Content): void {
        this.rootContext = rootContext;

        // Set the Context to each extension so that they can use it for invoking extension events
        content.getExtensionRequests().forEach((uri) => {
            const extension: IExtension | undefined = this.getBuildInExtension(uri);
            if (extension) {
                extension.setContext(rootContext);
            }
        });
    }

    public configureExtensions(extensionConfiguration: ExtensionConfiguration): void {
        // reset configuration and connections.
        this.extensionConfiguration = extensionConfiguration;
        this.connections = new Map<string, IExtensionConnection>();
        // if the extension is in initialized, we establish connection first.
        if (extensionConfiguration === undefined) {
            return;
        }
        extensionConfiguration.getInitializedExtensions().forEach( (settings, uri) => {
            const extensionService = this.extensionServices.get(uri);
            if (extensionService) {
                const connection: IExtensionConnection = new ExtensionLocalConnection(this, extensionService);
                const connectionResult: boolean = connection.connect(settings);
                if (connectionResult) {
                    this.connections.set(uri, connection);
                } else {
                    this.logger.info(`Failed to connect dynamic extension:  ${uri}`);
                }
            }
        });
    }

    public onMessageReceived(uri: string, payload: string): void {
        const extensionClient = this.extensionClients.get(uri);
        if (extensionClient) {
            extensionClient.processMessage(this.rootContext === undefined ? null : this.rootContext, payload);
        }
    }

    public onDocumentFinished(): void {
        // disconnect all connecitons;
        this.connections.forEach((connection, uri) => {
            connection.disconnect();
        });
        this.connections = new Map<string, IExtensionConnection>();
        this.extensionClients = new Map<string, IExtensionClient>();
    }

    public resetRootContext(): void {
        this.rootContext = undefined;
    }

    private registerBuildInExtensions(extension: IExtension,
                                      rootConfig: APL.RootConfig,
                                      content: Content): void {
        // Apply content defined settings to extension
        extension.applySettings(content.getExtensionSettings(extension.getUri()));
        rootConfig.registerExtension(extension.getUri());
        rootConfig.registerExtensionEnvironment(extension.getUri(), extension.getEnvironment());
        for (const command of extension.getExtensionCommands()) {
            rootConfig.registerExtensionCommand(command.commandDefinition);
        }
        for (const handler of extension.getExtensionEventHandlers()) {
            rootConfig.registerExtensionEventHandler(handler.eventHandler);
        }
        for (const liveData of extension.getLiveData()) {
            if (liveData.data instanceof LiveArray) {
                rootConfig.liveArray(liveData.name, (liveData.data as LiveArray).liveArray);
            } else {
                rootConfig.liveMap(liveData.name, (liveData.data as LiveMap).liveMap);
            }
        }
    }

    private registerDynamicExtensions(requestedExtensionUri: string,
                                      rootConfig: APL.RootConfig,
                                      content: Content): void {
        // reset extensionClients for new APL template.
        this.extensionClients = new Map<string, IExtensionClient>();
        // register extension through connections
        if (this.extensionConfiguration.isGranted(requestedExtensionUri)) {
            const extensionClient: ExtensionClient = new ExtensionClient(rootConfig, requestedExtensionUri);
            this.extensionClients.set(requestedExtensionUri, extensionClient);
            let connection = this.connections.get(requestedExtensionUri);
            if (!connection) {
                // create connection for the extension used in APL document and is granted.
                const extensionService = this.extensionServices.get(requestedExtensionUri);
                if (extensionService) {
                    connection = new ExtensionLocalConnection(this, extensionService);
                }
            }
            if (connection && connection.connect(JSON.stringify(content.getExtensionSettings(requestedExtensionUri)))) {
                this.connections.set(requestedExtensionUri, connection);
                const message = extensionClient.createRegistrationRequest(content.getContent());
                connection.sendMessage({
                    uri : requestedExtensionUri,
                    payload : message
                });
            }
        }
    }

    private disconnectUnusedConnections(): void {
        this.connections.forEach((connection, uri) => {
            if (!this.extensionClients.has(uri)) {
                connection.disconnect();
            }
        });
    }

    private onBuildInExtensionEvent(uri: string,
                                    commandName: string,
                                    source: object,
                                    params: object,
                                    resultCallback: IExtensionEventCallbackResult): boolean {
        this.logger.info(`Handling callback for build-in extension:  ${uri}`);
        const extension = this.getBuildInExtension(uri);
        if (extension != null) {
            extension.onExtensionEvent(uri, commandName, source, params, resultCallback);
            return true;
        }
        return false;
    }

    private onDynamicExtensionEvent(uri: string, event: APL.Event): boolean {
        this.logger.info(`event handled for dynamic extension:  ${uri}`);
        const extensionClient = this.extensionClients.get(uri);
        const connection = this.connections.get(uri);
        if (extensionClient && connection) {
            const command = extensionClient.processCommand(event);
            connection.sendMessage({
                uri,
                payload : command
            });
            return true;
        }
        return false;
    }
}
