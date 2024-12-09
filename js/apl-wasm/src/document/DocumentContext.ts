/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Content, DefaultAudioPlayer, DisplayState as CoreDisplayState, IAudioEventListener,
    IConfigurationChangeOptions, ILogger, LocaleMethods,
    LoggerFactory, MediaPlayerHandle, MetricsRecorder, Milestone,
    Segment} from 'apl-html';
import { v4 as uuidv4 } from 'uuid';
import { APLWASMRenderer, IAPLWASMOptions } from '../APLWASMRenderer';
import { Queue } from '../common/Queue';
import { AplDisplayState } from '../common/ViewhostTypes';
import { PackageLoader } from '../content/PackageLoader';
import { PackageManager } from '../content/PackageManager';
import { IExecuteCommandsRequest, IRenderDocumentRequest } from '../viewhost/IRequest';
import { IAPLViewhostConfig } from '../viewhost/ViewhostConfig';
import { ViewhostContext } from '../viewhost/ViewhostContext';
import { DocumentHandle } from './DocumentHandle';
import { DocumentManager } from './DocumentManager';
import { DocumentState, IDocumentLifecycleListener } from './DocumentState';

interface ExecuteCommandsRequest extends IExecuteCommandsRequest {
    command: string;
    resolve: (result: boolean) => void;
    reject: (reason: any) => void;
}

export class DocumentContext {
    private logger: ILogger;

    private token: string;

    /// APL Content
    private content: Content;

    /// APL RootConfig
    private rootConfig: APL.RootConfig;

    /// AudioPlayer factory wrapper
    private audioPlayerFactory: APL.AudioPlayerFactory;

    /// MediaPlayer factory wrapper
    private mediaPlayerFactory: APL.MediaPlayerFactory;

    /// APLWASMRenderer contains the RootContext and rendering logic
    private aplRenderer: APLWASMRenderer | null;

    private stateListeners = new Map<number, IDocumentLifecycleListener>();
    private static listenerIndex = 0;

    private pendingCommand = new Queue<ExecuteCommandsRequest>();

    private metrics: APL.Metrics;
    private isAutoSizing: boolean;

    /// userData exposed to runtime
    public userData = new Map<string, object>();

    // Embedded document manager
    private documentManager: DocumentManager;

    // PackageManager components
    private packageLoader: PackageLoader;
    private packageManager: PackageManager;

    private documentConfig: APL.DocumentConfig;

    private metricsRecorder?: MetricsRecorder;

    private saved: boolean = false;

    private paused: boolean = false;

    constructor(request: IRenderDocumentRequest, vhContext: ViewhostContext, fillMissingData = true) {
        if (!request.doc) {
            throw new Error('Document is required');
        }
        if (!request.data) {
            request.data = '{}';
        }
        this.logger = LoggerFactory.getLogger('DocumentContext');
        this.metricsRecorder = vhContext.getMetricsRecorder();
        this.metricsRecorder?.recordMilestone(Milestone.kDocumentReceived);

        if (request.token) {
            this.token = request.token;
        } else {
            this.token = uuidv4();
        }
        const vhConfig = vhContext.getConfig();

        const environment = {
            ...vhConfig.environment,
            ...request.environment
        };

        this.rootConfig = Module.RootConfig.create(environment);
        this.rootConfig.utcTime(vhConfig.utcTime).localTimeAdjustment(vhConfig.localTimeAdjustment);
        this.rootConfig.localeMethods(LocaleMethods);

        this.audioPlayerFactory = Module.AudioPlayerFactory.create(
            vhConfig.audioPlayerFactory ?
            vhConfig.audioPlayerFactory :
            ((eventListener: IAudioEventListener) => new DefaultAudioPlayer(eventListener)));
        this.rootConfig.audioPlayerFactory(this.audioPlayerFactory);

        this.mediaPlayerFactory = Module.MediaPlayerFactory.create(
            ((mediaPlayer: APL.MediaPlayer) => new MediaPlayerHandle(mediaPlayer))
        );
        this.rootConfig.mediaPlayerFactory(this.mediaPlayerFactory);

        this.packageLoader = new PackageLoader(vhConfig.packageLoader);
        this.packageManager = new PackageManager(this.packageLoader);
        this.rootConfig.packageManager(this.packageManager.getCppPackageManager());

        this.documentManager = new DocumentManager(vhContext, request.embeddedDocumentFactory);
        this.rootConfig.documentManager(this.documentManager.provideCppDocumentManager());

        this.createMetrics(vhConfig);

        const createContentSegment = this.metricsRecorder?.startTimer(Segment.kCreateContent,
                                                                      new Map<string, string>());
        this.content = Content.create(request.doc, request.data, vhConfig.onLogCommand,
                                      this.metrics, this.rootConfig, fillMissingData);
        createContentSegment?.stop();

        if (vhConfig.onDocumentStateUpdate) {
            this.stateListeners.set(0, {
                onStateUpdate(handle, state) {
                    vhConfig.onDocumentStateUpdate!(handle, state);
                }
            });
        }

        const options: IAPLWASMOptions = {
            unifiedApi: true,
            ...vhConfig,
            scaling: request.scaling,
            content: this.content,
            metrics: this.metrics,
            isAutoSizing: this.isAutoSizing,
            onDocumentStateUpdate: (state) => this.onDocumentStateUpdate(state),
            metricsRecorder: this.metricsRecorder
        };
        this.aplRenderer = APLWASMRenderer.create(options);
        this.aplRenderer.setRootConfig(this.rootConfig);
        this.aplRenderer.setAudioPlayerFactory(this.audioPlayerFactory);
        this.aplRenderer.setMediaPlayerFactory(this.mediaPlayerFactory);
    }

    public destroy() {
        this.logger.debug('Destroying document context: ', this.token);
        this.onDocumentStateUpdate(DocumentState.finished);
        this.audioPlayerFactory.destroy();
        this.mediaPlayerFactory.destroy();
        this.packageManager.destroy();
        this.documentManager.destroy();
        if (this.aplRenderer) {
            this.aplRenderer.removeRenderingComponents();
            this.aplRenderer.destroy();
            this.aplRenderer = null;
        }
    }

    /**
     * @internal
     * @ignore
     */
    public getDocumentManager(): DocumentManager {
        return this.documentManager;
    }

    /**
     * @internal
     * @ignore
     */
    public getContent(): Content {
        return this.content;
    }

    /**
     * @internal
     * @ignore
     */
    public getDocumentState(): DocumentState {
        if (!this.aplRenderer) {
            return DocumentState.pending;
        }
        return this.aplRenderer.getDocumentState();
    }

    /**
     * @internal
     * @ignore
     */
    public async prepareDocument(): Promise<DocumentHandle> {
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        if (this.isReady()) {
            return this.getHandle();
        }
        return this.aplRenderer!.prepare()
            .then(() => {
                this.metricsRecorder?.recordMilestone(Milestone.kDocumentPrepared);
                return new DocumentHandle(this);
            })
            .catch((e) => Promise.reject(e));
    }

    /**
     * @internal
     * @ignore
     */
    public async renderDocument(view: HTMLElement): Promise<DocumentHandle> {
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        this.aplRenderer!.bindToView(view);
        this.saved = false;

        const renderDocumentSegment = this.metricsRecorder?.startTimer(Segment.kRenderDocument,
                                                                       new Map<string, string>());
        return this.aplRenderer!.init()
            .then(() => {
                this.metricsRecorder?.recordMilestone(Milestone.kDocumentRendered);
                renderDocumentSegment?.stop();
                if (this.paused) {
                    this.aplRenderer!.stopUpdate();
                }
                return new DocumentHandle(this);
            })
            .catch((e) => {
                renderDocumentSegment?.fail();
                return Promise.reject(e);
            });
    }

    public unbindFromView() {
        this.saved = true;
        if (this.aplRenderer) {
            this.aplRenderer.unbindFromView();
        }
    }

    /**
     * @internal
     * @ignore
     */
    public async executeCommands(command: IExecuteCommandsRequest): Promise<boolean> {
        if (!command.command) {
            return Promise.reject('No command');
        }
        if (command.command) {
            try {
                JSON.parse(command.command);
            } catch (e) {
                return Promise.reject('Malformed command: ' + e);
            }
        }

        if (this.saved || this.isReady() || this.isPending()) {
            this.logger.info('queuing command');
            return new Promise<boolean>((resolve, reject) => {
                this.pendingCommand.enqueue({
                    ...command,
                    resolve,
                    reject
                });
            });
        }

        if (this.isRendered()) {
            this.logger.info('executing command');
            return new Promise<boolean>((resolve) => {
                const action = this.aplRenderer!.executeCommands(command.command);
                action.then(() => { resolve(true); });
                action.addTerminateCallback(() => { resolve(false); });
            });
        }

        return Promise.reject('Context in invalid state');
    }

    /**
     * @internal
     * @ignore
     */
    public cancelExecution() {
        if (this.aplRenderer) {
            this.aplRenderer.cancelExecution();
        }
    }

    private resolvePendingCommand() {
        while (this.pendingCommand.size()) {
            const command = this.pendingCommand.dequeue();
            if (command) {
                const action = this.aplRenderer!.executeCommands(command.command);
                action.then(() => { command.resolve(true); });
                action.addTerminateCallback(() => { command.resolve(false); });
            }
        }
    }

    private rejectPendingCommand() {
        while (this.pendingCommand.size()) {
            const command = this.pendingCommand.dequeue();
            if (command) {
                command.reject('Cannot fulfil due to document state');
            }
        }
    }

    /**
     * @internal
     * @ignore
     */
    public async getVisualContext(): Promise<string> {
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        if (this.aplRenderer.getDocumentState() !== DocumentState.displayed) {
            return Promise.reject('Document not rendered');
        }
        return this.aplRenderer.getVisualContext();
    }

    /**
     * @internal
     * @ignore
     */
    public async getDataSourceContext(): Promise<string> {
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        if (this.aplRenderer.getDocumentState() !== DocumentState.displayed) {
            return Promise.reject('Document not rendered');
        }
        return this.aplRenderer.getDataSourceContext();
    }

    /**
     * @internal
     * @ignore
     */
    public async updateDataSource(payload: string, type?: string): Promise<boolean> {
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        if (this.aplRenderer.getDocumentState() !== DocumentState.displayed) {
            return Promise.reject('Document not rendered');
        }

        if (this.documentConfig) {
            // Embedded Doc use case
            if (!type) {
                type = 'dynamicIndexList';
            }
            return this.documentConfig.processDataSourceUpdate(type, payload);
        }
        return this.aplRenderer.processDataSourceUpdate(payload, type);
    }

    /**
     * @internal
     * @ignore
     */
    public async pause(): Promise<void> {
        this.paused = true;
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        this.aplRenderer.stopUpdate();
    }

    /**
     * @internal
     * @ignore
     */
    public async resume(): Promise<void> {
        this.paused = false;
        if (!this.aplRenderer) {
            return Promise.reject('Context destroyed');
        }
        if (this.aplRenderer.getDocumentState() !== DocumentState.displayed) {
            return Promise.reject('Document not rendered');
        }
        this.aplRenderer.resumeUpdate();
    }

    /**
     * @internal
     * @ignore
     */
    public registerListener(listener: IDocumentLifecycleListener): number {
        DocumentContext.listenerIndex++;
        this.stateListeners.set(DocumentContext.listenerIndex, listener);
        setTimeout(() => {
            listener.onStateUpdate(new DocumentHandle(this), this.aplRenderer!.getDocumentState());
        }, 0);
        return DocumentContext.listenerIndex;
    }

    /**
     * @internal
     * @ignore
     */
    public unregisterListener(id: number) {
        this.stateListeners.delete(id);
    }

    /**
     * @internal
     * @ignore
     */
    public onDocumentStateUpdate(state: DocumentState) {
        if (state === DocumentState.displayed ||
            state === DocumentState.inflated) {
            this.resolvePendingCommand();
        }

        if (state === DocumentState.finished || state === DocumentState.error) {
            this.rejectPendingCommand();
        }

        // For embedded documents, the document state is synced from the host document.
        // So they can be different
        if (this.aplRenderer && state !== this.aplRenderer.getDocumentState()) {
            this.aplRenderer.updateDocumentState(state);
        }

        this.documentManager.updateDocumentState(state);

        this.stateListeners.forEach((listener) => {
            listener.onStateUpdate(new DocumentHandle(this), state);
        });
    }

    /**
     * @internal
     * @ignore
     */
    public configurationChange(config: IConfigurationChangeOptions) {
        if (this.aplRenderer) {
            this.aplRenderer.onConfigurationChange(config);
        }
    }

    /**
     * @internal
     * @ignore
     */
    public updateDisplayState(state: AplDisplayState) {
        let displayState;
        switch (state) {
            case AplDisplayState.hidden:
                displayState = {displayState: CoreDisplayState.kDisplayStateHidden};
                break;
            case AplDisplayState.background:
                displayState = {displayState: CoreDisplayState.kDisplayStateBackground};
                break;
            case AplDisplayState.foreground:
                displayState = {displayState: CoreDisplayState.kDisplayStateForeground};
                break;
            default: // eslint-disable-line no-fallthrough, @typescript-eslint/no-unused-vars
        }
        if (this.aplRenderer) {
            this.aplRenderer.onDisplayStateChange(displayState);
        }
    }

    /**
     * @deprecated
     * @ignore
     */
    public getLegacy(): APLWASMRenderer|null {
        return this.aplRenderer;
    }

    /**
     * @internal
     * @ignore
     */
    public getToken(): string {
        return this.token;
    }

    /**
     * @internal
     * @ignore
     */
    public getHandle(): DocumentHandle {
        return new DocumentHandle(this);
    }

    /**
     * @internal
     * @ignore
     */
    private createMetrics(vhConfig: IAPLViewhostConfig) {
        this.metrics = Module.Metrics.create();
        let shape = vhConfig.viewport.shape as string;
        if (!shape) {
            shape = vhConfig.viewport.isRound ? 'ROUND' : 'RECTANGLE';
        }
        this.metrics.size(vhConfig.viewport.width, vhConfig.viewport.height)
            .dpi(vhConfig.viewport.dpi)
            .theme(vhConfig.theme)
            .shape(shape)
            .mode(vhConfig.mode as string);
        if (vhConfig.viewport.minWidth && vhConfig.viewport.minWidth > 0
            && vhConfig.viewport.maxWidth && vhConfig.viewport.maxWidth > 0) {
            this.isAutoSizing = true;
            this.metrics.minAndMaxWidth(vhConfig.viewport.minWidth, vhConfig.viewport.maxWidth);
        }
        if (vhConfig.viewport.minHeight && vhConfig.viewport.minHeight > 0
            && vhConfig.viewport.maxHeight && vhConfig.viewport.maxHeight > 0) {
            this.isAutoSizing = true;
            this.metrics.minAndMaxHeight(vhConfig.viewport.minHeight, vhConfig.viewport.maxHeight);
        }
    }

    public isPending(): boolean {
        if (!this.aplRenderer) {
            return false;
        }
        const docState = this.aplRenderer.getDocumentState();
        return docState === DocumentState.pending;
    }

    public isReady(): boolean {
        if (!this.aplRenderer) {
            return false;
        }
        const docState = this.aplRenderer.getDocumentState();
        return docState === DocumentState.prepared;
    }

    public isRendered(): boolean {
        if (!this.aplRenderer) {
            return false;
        }

        const docState = this.aplRenderer.getDocumentState();
        return docState === DocumentState.displayed ||
               docState === DocumentState.inflated;
    }

    public setCoreDocumentContext(coreDocumentContext: APL.DocumentContext): void {
        this.aplRenderer!.updateCoreDocumentContext(coreDocumentContext);
    }

    public createAndGetDocumentConfig(): APL.DocumentConfig {
        if (!this.documentConfig) {
            this.documentConfig = Module.DocumentConfig.create();
        }
        return this.documentConfig;
    }

}
