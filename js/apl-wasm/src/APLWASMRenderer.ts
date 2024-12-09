/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer, {
    commandFactory, Content, DefaultAudioPlayer, DeviceMode, DisplayState,
    FontUtils, IAPLOptions, IAudioEventListener, IAudioPlayerFactory,
    IConfigurationChangeOptions, JSLogLevel, LiveArray, LiveMap,
    LocaleMethods, LoggerFactory, LogTransport, MediaPlayerHandle, OnLogCommand,
    Segment, ViewportShape
} from 'apl-html';
import { ConfigurationChange } from './ConfigurationChange';
import { PackageLoader } from './content/PackageLoader';
import { PackageManager } from './content/PackageManager';
import { DocumentState } from './document/DocumentState';
import { IDocumentState } from './extensions/backstack/IDocumentState';
import { ExtensionManager } from './extensions/ExtensionManager';
import { UnifiedBackstackExtension } from './extensions/unifiedBackstack/UnifiedBackstackExtension';

/**
 * This matches the schema sent from the server
 */
export interface IValidViewportSpecification {
    mode: DeviceMode;
    shape: ViewportShape;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
}

export interface ScalingOptions {
    /** Higher values will scale less but use screen real estate less efficiently */
    biasConstant: number;
    /** Tested configurations */
    specifications: IValidViewportSpecification[];
}
/**
 * Options when creating a new APLWASMRenderer
 */
export interface IAPLWASMOptions extends IAPLOptions {
    /** Internal used only */
    unifiedApi?: boolean;
    /** Contains all the data and docs needed to inflate an APL view */
    content: Content;
    /** information on device scaling */
    scaling?: ScalingOptions;
    /** Skip force loading of fonts loading. For tests mainly as electron flacky with it. */
    notLoadFonts?: boolean;
    /** Log level to report. */
    logLevel?: JSLogLevel;
    /** Log transport */
    logTransport?: LogTransport;
    /** Extension Manager */
    extensionManager?: ExtensionManager;
    /** Document State to restore */
    documentState?: IDocumentState;
    /** Override package download. Reject the Promise to fallback to the default logic. */
    packageLoader?: (name: string, version: string, url?: string, domain?: string) => Promise<string>;
    /** callback for APL Log Command handling, will overwrite the callback during Content creation */
    onLogCommand?: OnLogCommand;
    /** @internal */
    metrics?: APL.Metrics;
    /** @internal */
    isAutoSizing?: boolean;
    /** @internal */
    onDocumentStateUpdate?: (state: DocumentState) => void;
    /** @internal used for unfied API only */
    backstackExtension?: UnifiedBackstackExtension;
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
    public static create(options: IAPLWASMOptions) {
        return new APLWASMRenderer(options);
    }

    protected documentAplVersion: string;
    protected legacyKaroke: boolean;
    protected isAutoSizing: boolean;
    private needRefreshing: boolean;
    private unifiedApi: boolean;

    /// Viewport metrics.
    private metrics: APL.Metrics;

    /// APL Core config.
    private rootConfig: APL.RootConfig;

    /// Current Configuration Change
    private configurationChange: ConfigurationChange;

    /// AudioPlayer factory wrapper
    private audioPlayerFactory: APL.AudioPlayerFactory;

    /// MediaPlayer factory wrapper
    private mediaPlayerFactory: APL.MediaPlayerFactory;

    // PackageManager components
    private packageLoader: PackageLoader;
    private packageManager: PackageManager;

    private documentState: DocumentState = DocumentState.pending;

    private onDocumentStateUpdate?: (state: DocumentState) => void;

    private coreDocumentContext: APL.DocumentContext;

    /**
     * This constructor is private
     * @param options options passed in through `create`
     * @internal
     * @ignore
     */
    private constructor(options: IAPLWASMOptions) {
        super(options);
        this.unifiedApi = this.options.unifiedApi ? true : false;
        LoggerFactory.initialize(options.logLevel || 'debug', options.logTransport);
        if (this.options.documentState) {
            this.content = this.options.documentState.content;
        } else if (!this.unifiedApi && this.options.onLogCommand) {
            this.content = Content.recreate(this.options.content, this.options.onLogCommand);
        } else {
            this.content = this.options.content;
        }
        this.legacyKaroke = this.content.getAPLVersion() === LEGACY_KARAOKE_APL_VERSION;
        this.documentAplVersion = this.content.getAPLVersion();
        if (this.options.metrics && this.options.isAutoSizing) {
            this.needRefreshing = false;
            this.metrics = this.options.metrics;
            this.isAutoSizing = this.options.isAutoSizing;
        } else {
            this.needRefreshing = true;
            this.metrics = Module.Metrics.create();
            this.metrics.size(this.options.viewport.width, this.options.viewport.height)
                .dpi(this.options.viewport.dpi)
                .theme(this.options.theme)
                .shape(this.options.viewport.shape as string)
                .mode(this.options.mode as string);
            if (this.options.viewport.minWidth && this.options.viewport.minWidth > 0
                && this.options.viewport.maxWidth && this.options.viewport.maxWidth > 0) {
                this.isAutoSizing = true;
                this.metrics.minAndMaxWidth(this.options.viewport.minWidth, this.options.viewport.maxWidth);
            }
            if (this.options.viewport.minHeight && this.options.viewport.minHeight > 0
                && this.options.viewport.maxHeight && this.options.viewport.maxHeight > 0) {
                this.isAutoSizing = true;
                this.metrics.minAndMaxHeight(this.options.viewport.minHeight, this.options.viewport.maxHeight);
            }
        }

        this.handleConfigurationChange = (configurationChangeOptions: IConfigurationChangeOptions) => {
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

        this.handleUpdateDisplayState = (displayState: DisplayState) => {
            if (this.context) {
                this.context.updateDisplayState(displayState);
            }
        };

        if (!this.unifiedApi) {
            this.rootConfig = Module.RootConfig.create(this.options.environment);
            this.rootConfig.utcTime(this.options.utcTime).localTimeAdjustment(this.options.localTimeAdjustment);
            this.rootConfig.localeMethods(LocaleMethods);

            this.audioPlayerFactory = Module.AudioPlayerFactory.create(
                this.options.audioPlayerFactory ?
                this.options.audioPlayerFactory :
                ((eventListener: IAudioEventListener) => new DefaultAudioPlayer(eventListener)));
            this.rootConfig.audioPlayerFactory(this.audioPlayerFactory);

            this.mediaPlayerFactory = Module.MediaPlayerFactory.create(
                ((mediaPlayer: APL.MediaPlayer) => new MediaPlayerHandle(mediaPlayer))
            );
            this.rootConfig.mediaPlayerFactory(this.mediaPlayerFactory);

            this.packageLoader = new PackageLoader(this.options.packageLoader);
            this.packageManager = new PackageManager(this.packageLoader);
            this.rootConfig.packageManager(this.packageManager.getCppPackageManager());
        }

        if (this.options.onDocumentStateUpdate) {
            this.onDocumentStateUpdate = this.options.onDocumentStateUpdate;
        }
    }

    /**
     * For unified API internal only
     * @internal
     * @ignore
     */
    public setRootConfig(rootConfig: APL.RootConfig) {
        this.rootConfig = rootConfig;
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
    public getDocumentState(): DocumentState {
        return this.documentState;
    }

    /**
     * @internal
     * @ignore
     */
    public getLegacyKaraoke(): boolean {
        return this.legacyKaroke;
    }

    /**
     * @internal
     * @ignore
     */
    protected getDocumentAplVersion(): string {
        return this.documentAplVersion;
    }

    /**
     * @internal
     * @ignore
     */
    public setMediaPlayerFactory(mediaPlayerFactory: APL.MediaPlayerFactory) {
        this.mediaPlayerFactory = mediaPlayerFactory;
    }

    /**
     * @internal
     * @ignore
     */
    public setAudioPlayerFactory(audioPlayerFactory: APL.AudioPlayerFactory) {
        this.audioPlayerFactory = audioPlayerFactory;
    }

    /**
     * @internal
     * @ignore
     */
    protected getAudioPlayerFactory(): IAudioPlayerFactory {
        return this.audioPlayerFactory as IAudioPlayerFactory;
    }

    /**
     * Register any live data with the configuration. Should be called before call to init().
     * @param name Live data object name.
     * @param liveData Live data object.
     */
    public registerLiveData(name: string, liveData: LiveArray | LiveMap) {
        if (liveData instanceof LiveArray) {
            this.rootConfig.liveArray(name, liveData.liveArray);
        } else {
            this.rootConfig.liveMap(name, liveData.liveMap);
        }
    }

    public async prepare() {
        if (!this.content) {
            return Promise.reject('No content');
        }
        if (!this.rootConfig) {
            return Promise.reject('No root config');
        }
        if (this.documentState !== DocumentState.pending) {
            return Promise.reject(`Document in invalid state: ${this.documentState}`);
        }

        this.supportsResizing = this.content.getAPLSettings('supportsResizing');

        if (!this.options.documentState) {
            if (this.needRefreshing) {
                this.content.refresh(this.metrics, this.rootConfig);
            }
            if (!await this.loadPackages() || this.content.isWaiting()
                || this.content.isError()) {
                this.updateDocumentState(DocumentState.error);
                this.logger.warn('Content is still pending or is in an error state');
                return Promise.reject('Failed to prepare content');
            }
        }

        if (!this.options.notLoadFonts) {
            await FontUtils.initialize();
        }
        this.updateDocumentState(DocumentState.prepared);
        return Promise.resolve();
    }

    public async init() {
        if (!this.content) {
            return Promise.reject('No content');
        }
        if (!this.rootConfig) {
            return Promise.reject('No root config');
        }
        if (this.documentState === DocumentState.pending) {
            await this.prepare();
        }

        if (this.options.extensionManager) {
            // Extensions requested by the content
            const registerExtensionsSegment =
                this.metricsRecorder?.startTimer(Segment.kRegisterExtensions, new Map<string, string>());
            this.options.extensionManager.registerRequestedExtensions(this.rootConfig, this.content);
            this.extensionManager = this.options.extensionManager;
            registerExtensionsSegment?.stop();
        }

        const inflateRootContextSegment =
            this.metricsRecorder?.startTimer(Segment.kInflateRootContext, new Map<string, string>());
        if (!this.context) {
            if (this.options.documentState) {
                await this.restoreDocument(this.options.documentState);
                this.options.documentState = undefined;
            } else {
                this.context = Module.Context.create(
                    this.options,
                    this,
                    this.metrics,
                    (this.content as any).content,
                    this.rootConfig,
                    this.options.scaling
                );
            }
        }

        if (!this.context) {
            this.logger.warn('Template provided is invalid.');
            this.updateDocumentState(DocumentState.error);
            inflateRootContextSegment?.fail();
            return Promise.reject('Failed to create context');
        }

        this.coreDocumentContext = this.context.topDocument();
        this.updateDocumentState(DocumentState.inflated);
        inflateRootContextSegment?.stop();

        const inflateViewsSegment = this.metricsRecorder?.startTimer(Segment.kInflateViews, new Map<string, string>());
        super.init();
        this.updateDocumentState(DocumentState.displayed);
        inflateViewsSegment?.stop();

        if (this.extensionManager) {
            this.extensionManager.onDocumentRender(this.context, this.content.getContent());
        }
        return Promise.resolve();
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
    public executeCommands(commands: string): APL.Action {
        return this.coreDocumentContext.executeCommands(commands, false);
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
    public invokeExtensionEventHandler(uri: string, name: string, data: string, fastMode: boolean): APL.Action {
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
    public processDataSourceUpdate(payload: string, type?: string): boolean {
        return this.context.processDataSourceUpdate(payload, type ? type : 'dynamicIndexList');
    }

    /**
     * @internal
     * @ignore
     */
    public getVisualContext(): Promise<string> {
        return Promise.resolve(this.coreDocumentContext.getVisualContext());
    }

    /**
     * @internal
     * @ignore
     */
    public getDataSourceContext(): Promise<string> {
        return Promise.resolve(this.coreDocumentContext.getDataSourceContext());
    }

    /**
     * @internal
     * @ignore
     */
    public updateCoreDocumentContext(documentContext: APL.DocumentContext) {
        this.coreDocumentContext = documentContext;
    }

    public destroy(preserveContext?: boolean) {
        super.destroy(preserveContext);
        if (!preserveContext) {
            if (!this.unifiedApi && this.audioPlayerFactory) {
                this.audioPlayerFactory.destroy();
            }
            if (!this.unifiedApi && this.mediaPlayerFactory) {
                this.mediaPlayerFactory.destroy();
            }
            if (this.packageManager) {
                this.packageManager.destroy();
            }
            if (this.options.extensionManager) {
                this.options.extensionManager.resetRootContext();
            }
        }
    }

    public async loadPackages(): Promise<boolean> {
        const prepareContentSegment =
            this.metricsRecorder?.startTimer(Segment.kPrepareContent, new Map<string, string>());

        return new Promise<boolean>((resolve) => {
            this.content.getContent().load(
                () => {
                    prepareContentSegment?.stop();
                    resolve(true);
                },
                () => {
                    prepareContentSegment?.fail();
                    resolve(false);
                }
            );
        });
    }

    private async restoreDocument(documentState: IDocumentState): Promise<void> {
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

    private passConfigurationChangeToCore(configurationChange: ConfigurationChange): void {

        if (configurationChange.width && configurationChange.height && !this.isAutoSizing) {
            this.metrics.size(configurationChange.width, configurationChange.height);
            this.context.configurationChange(configurationChange.getConfigurationChange(),
                this.metrics, this.options.scaling);
        } else {
            this.context.configurationChange(configurationChange.getConfigurationChange(),
                undefined, undefined);
        }
    }

    /**
     * @internal
     * @ignore
     */
    public updateDocumentState(state: DocumentState) {
        this.documentState = state;
        if (this.onDocumentStateUpdate) {
            this.onDocumentStateUpdate(state);
        }
    }
}
