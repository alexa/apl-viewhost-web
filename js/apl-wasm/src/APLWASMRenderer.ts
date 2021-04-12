/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer,
    {Content, DeviceMode, FontUtils, IAPLOptions, ILogger, JSLogLevel, LoggerFactory, LogLevel, LogTransport,
        ViewportShape, commandFactory, LocaleMethods} from 'apl-html';
import {ConfigurationChange} from './ConfigurationChange';
import {LiveArray} from './LiveArray';
import {LiveMap} from './LiveMap';
import {PackageLoader} from './PackageLoader';
import {ExtensionManager} from './extensions/ExtensionManager';
import {IDocumentState} from './extensions/IDocumentState';
import { IConfigurationChangeOptions } from 'apl-html';

/**
 * This matches the schema sent from the server
 */
export interface IValidViewportSpecification {
    mode : DeviceMode;
    shape : ViewportShape;
    minWidth : number;
    maxWidth : number;
    minHeight : number;
    maxHeight : number;
}

/**
 * Options when creating a new APLWASMRenderer
 */
export interface IAPLWASMOptions extends IAPLOptions {
    /** Contains all the data and docs needed to inflate an APL view */
    content : Content;
    /** information on device scaling */
    scaling? : {
        /** Higher values will scale less but use screen real estate less efficiently */
        biasConstant : number;
        /** Tested configurations */
        specifications : IValidViewportSpecification[];
    };
    /** Skip force loading of fonts loading. For tests mainly as electron flacky with it. */
    notLoadFonts? : boolean;
    /** Log level to report. */
    logLevel? : JSLogLevel;
    /** Log transport */
    logTransport? : LogTransport;
    /** Extension Manager */
    extensionManager? : ExtensionManager;
    /** Document State to restore */
    documentState? : IDocumentState;
}

const LEGACY_KARAOKE_APL_VERSION = '1.0';

/**
 * The main renderer. Create a new one with `const renderer = APLWASMRenderer.create(content);`
 */
export class APLWASMRenderer extends APLRenderer<IAPLWASMOptions> {
    /**
     * Creates a new renderer
     * @param options Options for this instance
     */
    public static create(options : IAPLWASMOptions) {
        return new APLWASMRenderer(options);
    }

    protected legacyKaroke : boolean;

    /// Logger to be used for core engine logs.
    private coreLogger : ILogger;

    /// Viewport metrics.
    private metrics : APL.Metrics;

    /// APL Core config.
    private rootConfig : APL.RootConfig;

    /// Current Configuration Change
    private configurationChange : ConfigurationChange;

    /**
     * This constructor is private
     * @param options options passed in through `create`
     * @internal
     * @ignore
     */
    private constructor(options : IAPLWASMOptions) {
        LoggerFactory.initialize(options.logLevel || 'debug', options.logTransport);
        super(options);
        this.coreLogger = LoggerFactory.getLogger('Core');
        this.legacyKaroke = options.content.getAPLVersion() === LEGACY_KARAOKE_APL_VERSION;
        this.metrics = Module.Metrics.create();
        this.metrics.size(this.options.viewport.width, this.options.viewport.height)
            .dpi(this.options.viewport.dpi)
            .theme(this.options.theme)
            .shape(this.options.viewport.shape as string)
            .mode(this.options.mode as string);
        this.rootConfig = Module.RootConfig.create(this.options.environment);
        this.rootConfig.utcTime(this.options.utcTime).localTimeAdjustment(this.options.localTimeAdjustment);
        this.rootConfig.localeMethods(LocaleMethods);
        this.handleConfigurationChange = (configurationChangeOptions : IConfigurationChangeOptions) => {
            if (this.context) {
                const originalScaleFactor = this.context.getScaleFactor();
                this.configurationChange = ConfigurationChange.create(configurationChangeOptions);
                this.passConfigurationChangeToCore(this.configurationChange);
                if (this.context.getScaleFactor() !== originalScaleFactor) {
                    this.destroyRenderingComponents();
                    this.reRenderComponents();
                }
            }
        };
    }

    /**
     * Returns current configuration change
     */
    public getConfigurationChange() {
        return this.configurationChange;
    }

    /**
     * @internal
     * @ignore
     */
    public getLegacyKaraoke() : boolean {
        return this.legacyKaroke;
    }

    /**
     * Register any live data with the configuration. Should be called before call to init().
     * @param name Live data object name.
     * @param liveData Live data object.
     */
    public registerLiveData(name : string, liveData : LiveArray | LiveMap) {
        if (liveData instanceof LiveArray) {
            this.rootConfig.liveArray(name, liveData.liveArray);
        } else {
            this.rootConfig.liveMap(name, liveData.liveMap);
        }
    }

    public async init() {
        const logTransport : APL.CoreLogTransport = (level : number, log : string) => {
            const logLevel : LogLevel = level as LogLevel;
            switch (logLevel) {
                case LogLevel.TRACE:
                    this.coreLogger.trace(log);
                    break;
                case LogLevel.DEBUG:
                    this.coreLogger.debug(log);
                    break;
                case LogLevel.INFO:
                    this.coreLogger.info(log);
                    break;
                case LogLevel.WARN:
                    this.coreLogger.warn(log);
                    break;
                case LogLevel.ERROR:
                    this.coreLogger.error(log);
                    break;
                case LogLevel.CRITICAL:
                    this.coreLogger.error(log);
                    break;
                case LogLevel.NONE:
                    break;
                default:
                    this.coreLogger.warn(`Log with unknown level: ${level} : ${log}`);
                    break;
            }
        };
        Module.Logger.setLogTransport(logTransport);

        const content : Content = this.options.documentState ?
                                  this.options.documentState.content : this.options.content;

        this.supportsResizing = content.getAPLSettings('supportsResizing');

        if (!this.options.documentState) {
            if (!await this.loadPackages() || !this.options.content.isReady()
                || this.options.content.isError()) {
                this.logger.warn('Content is not ready or is in an error state');
                return;
            }
        }

        if (this.options.extensionManager) {
            // Extensions requested by the content
            this.options.extensionManager.registerRequestedExtensions(this.rootConfig, content);
            this.extensionManager = this.options.extensionManager;
        }

        if (!this.options.notLoadFonts) {
            await FontUtils.initialize();
        }

        if (this.options.documentState) {
            await this.restoreDocument(this.options.documentState);
            this.options.documentState = undefined;
        } else {
            this.context = Module.Context.create(this.options, this,
            this.metrics, (content as any).content, this.rootConfig, this.options.scaling);
        }

        if (!this.context) {
            this.logger.warn('Template provided is invalid.');
            return;
        }

        super.init();
        if (this.extensionManager) {
            this.extensionManager.onDocumentRender(this.context, content);
        }
    }

    /**
     * Execute the following commands in sequence
     * ```
     * const action = renderer.executeCommands(JSON.stringify([
     *     type: "SetValue",
     *     property: "color",
     *     value: "red",
     *     componentId: "myText",
     * ]));
     * action.then(() => {
     *    // when the action is complete
     * });
     * action.addTerminateCallback(() => {
     *    // when the action is terminated usually from a
     *    // renderer.cancelExecution() call.
     * });
     * ```
     * @param commands JSON string of an array of commands
     */
    public executeCommands(commands : string) : APL.Action {
        return this.context.executeCommands(commands);
    }

    /**
     * Execute the specific extension handler
     * ```
     * const action = renderer.invokeExtensionEventHandler("aplext:example:10", "Example", JSON.stringify({
     *     parameterA: 76,
     *     parameterB: "seven"
     * }), false);
     * action.then(() => {
     *    // when the action is complete
     * });
     * action.addTerminateCallback(() => {
     *    // when the action is terminated by any reason.
     * });
     * ```
     * @param uri Extension URI.
     * @param name Handler name.
     * @param data Handler supported data. Should be stringified.
     * @param fastMode true if should be executed in fast mode, false otherwise.
     */
    public invokeExtensionEventHandler(uri : string, name : string, data : string, fastMode : boolean) : APL.Action {
        return this.context.invokeExtensionEventHandler(uri, name, data, fastMode);
    }

    /**
     * Cancel any current commands in execution.  This is typically called
     * as a result of the user touching on the screen to interrupt.
     */
    public cancelExecution() {
        this.context.cancelExecution();
    }

    /**
     * Process DataSource update payload passed from directive.
     * @param payload DataSource update payload.
     * @param type DataSource type. Optional, should be one of runtime registered.
     */
    public processDataSourceUpdate(payload : string, type? : string) : boolean {
        return this.context.processDataSourceUpdate(payload, type ? type : 'dynamicIndexList');
    }

    public destroy(preserveContext? : boolean) {
        super.destroy(preserveContext);
        if (!preserveContext) {
            if (this.options.extensionManager) {
                this.options.extensionManager.resetRootContext();
            }
        }
    }

    private async loadPackages() : Promise<boolean> {
        const packageLoader : PackageLoader = new PackageLoader();
        while (this.options.content.isWaiting()) {
            const importRequests = this.options.content.getRequestedPackages();
            if (importRequests.size > 0) {
                const irArr : APL.ImportRequest[] = [];
                importRequests.forEach((ir) => irArr.push(ir));
                const loadedPkgs = await packageLoader.load(irArr);
                for (const loadPkg of loadedPkgs) {
                    this.options.content.addPackage(loadPkg.importRequest, JSON.stringify(loadPkg.json));
                    irArr.splice(irArr.indexOf(loadPkg.importRequest));
                }
                if (irArr.length > 0) {
                    return false;
                }
            }
        }
        return true;
    }

    private async restoreDocument(documentState : IDocumentState) : Promise<void> {
        if (!documentState) {
            return;
        }
        this.context = documentState.context;
        this.context.setBackground(documentState.background);
        if (documentState.configurationChange) {
            // apply config change and consume events against restoring document.
            this.passConfigurationChangeToCore(documentState.configurationChange);
            this.context.clearPending();
            while (this.context && this.context.hasEvent()) {
                const event = this.context.popEvent();
                await commandFactory(event, (this as any));
            }
        }
    }

    private passConfigurationChangeToCore(configurationChange : ConfigurationChange) : void {
        if (configurationChange.width && configurationChange.height) {
            this.metrics.size(configurationChange.width, configurationChange.height);
            this.context.configurationChange(configurationChange.getConfigurationChange(),
                this.metrics, this.options.scaling);
        } else {
            this.context.configurationChange(configurationChange.getConfigurationChange(),
                undefined, undefined);
        }
    }
}
