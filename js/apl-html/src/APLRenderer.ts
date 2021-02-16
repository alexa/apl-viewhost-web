/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { commandFactory } from './CommandFactory';
import { componentFactory } from './ComponentFactory';
import { Component } from './components/Component';
import { MeasureMode } from './components/text/MeasureMode';
import { TextMeasurement } from './components/text/Text';
import { AnimationQuality } from './enums/AnimationQuality';
import { IVideoFactory } from './components/video/IVideoFactory';
import { VideoFactory } from './components/video/VideoFactory';
import { SpatialNavigation } from './utils/SpatialNavigation';
import { AudioPlayerWrapper } from './AudioPlayerWrapper';
import { AudioPlayerFactory } from './media/audio/AudioPlayer';
import { LoggerFactory } from './logging/LoggerFactory';
import { ILogger } from './logging/ILogger';
import { Image } from './components/Image';
import { PointerEventType } from './enums/PointerEventType';
import { PointerType } from './enums/PointerType';
import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP, ENTER_KEY } from './utils/Constant';
import { IExtensionManager } from './extensions/IExtensionManager';

const agentName = 'AplWebRenderer';
const agentVersion = '1.0.0';
// For touch enabled browser, touch event will be followed by a mouse event after 300ms-500ms up to browser.
// This will cause issue which triggers click or press events twice.
// setup a 500ms gap between two events.
const pointerEventGap : number = 500;

/**
 * Device viewport mode
 */
export type DeviceMode = 'AUTO' | 'HUB' | 'MOBILE' | 'PC' | 'TV';

/**
 * Device viewport shape
 */
export type ViewportShape = 'ROUND' | 'RECTANGLE';

/**
 * Physical charcteristics of the viewport
 */
export interface IViewportCharacteristics {
    /** Width in pixels */
    width : number;
    /** Height in pixels */
    height : number;
    /** `true` if the screen is round */
    isRound : boolean;
    /** Viewport shape. If undefined than decided by "isRound" */
    shape? : ViewportShape;
    /** Dots per inch */
    dpi : number;
}

/**
 * Environment and support options
 */
export interface IEnvironment {
    /** Agent Name */
    agentName : string;
    /** Agent Version */
    agentVersion : string;
    /** `true` if OpenURL command is supported. Defaults to `false` */
    allowOpenUrl? : boolean;
    /** `true` if video is not supported. Defaults to `false` */
    disallowVideo? : boolean;
    /** Level of animation quality. Defaults to `AnimationQuality.kAnimationQualityNormal` */
    animationQuality? : AnimationQuality;
}

/**
 * Developer tool options can be used to inject additional data into the DOM
 *
 * Keys are defined post transformation, for e.g. if the input is '-user-foo', then
 * define keys as 'foo' here
 */
export interface IDeveloperToolOptions {
    /** Key to use to create component mapping */
    mappingKey : string;

    /** Keys to export as data- attributes in the DOM */
    writeKeys : string[];
}

/**
 * Event coming from APL.
 * See https://aplspec.aka.corp.amazon.com/release-1.1/html/standard_commands.html#user-event for more information.
 */
export interface ISendEvent {
    source : any;
    arguments : string[];
    components : any[];
}

/**
 * Event coming from APL to request data fetch for any of registered DataSources.
 */
export interface IDataSourceFetchRequest {
    type : string;
    payload : any;
}

export interface IExtensionEvent {
    uri : string;
    name : string;
    source : any;
    params : any;
    event? : APL.Event;
}

/**
 * keyboard handler type
 */
export enum KeyHandlerType {
    KeyDown = 0,
    KeyUp = 1
}

/**
 * Async keyboardEvent.
 */
export interface IAsyncKeyboardEvent extends KeyboardEvent {
    asyncChecked : boolean;
}

/**
 * Options when creating a new APLRenderer
 */
export interface IAPLOptions {
    /** Contains all the information on environment suport and options */
    environment : IEnvironment;
    /** APL theme. Usually 'light' or 'dark' */
    theme : string;
    /** Optional Video player factory. If no player is provided, a default player will be used */
    videoFactory? : IVideoFactory;
    /** The HTMLElement to draw onto */
    view : HTMLElement;
    /** Physical viewport characteristics */
    viewport : IViewportCharacteristics;
    /** Device mode. If no provided "HUB" is used. */
    mode? : DeviceMode;

    /** Optional externalized audio player */
    audioPlayerFactory? : AudioPlayerFactory;

    /** Callback for executed SendEvent commands */
    onSendEvent? : (event : ISendEvent) => void;

    /** Callback for logging PEGTL Parsing Session Error */
    onPEGTLError? : (error : string) => void;

    /** Callback for Finish command */
    onFinish? : () => void;

    /** Callback for Extension command */
    onExtensionEvent? : (event : IExtensionEvent) => Promise<boolean>;

    /** Callback when speakPlayback starts */
    onSpeakEventEnd? : (type : string) => void;

    /** Callback when speakPlayback ends */
    onSpeakEventStart? : (type : string) => void;

    /** Callback for Data Source fetch requests */
    onDataSourceFetchRequest? : (event : IDataSourceFetchRequest) => void;

    /** Callback for pending errors from APLCore Library */
    onRunTimeError? : (pendingErrors : object[]) => void;

    /**
     * Callback when a AVG source needs to be retreived by the consumer
     * If this is not provided, this viewhost will use the fetch API to
     * retreive graphic content from sources.
     */
    onRequestGraphic? : (source : string) => Promise<string | undefined>;
    /**
     * Callback to open a URL. Return `false` if this call fails
     */
    onOpenUrl? : (source : string) => Promise<boolean>;

    /**
     * Contains developer tool options
     */
    developerToolOptions? : IDeveloperToolOptions;

    /** Starting UTC time in milliseconds since 1/1/1970 */
    utcTime : number;

    /** Offset of the local time zone from UTC in milliseconds */
    localTimeAdjustment : number;
}

/**
 * The main renderer. Create a new one with `const renderer = APLRenderer.create(content);`
 */
// TODO -> When upgrading to TypeScript 3.x.x
// https://issues.labcollab.net/browse/ARC-867
export default abstract class APLRenderer<Options = {}> {
    private static mappingKeyExpression : RegExp = /:\d+$/;
    private static mousePointerId : number = 0;

    private lastPointerEventTimestamp : number = (new Date()).getTime();

    /// Logger to be used for this component logs.
    protected logger : ILogger;

    /**
     * Map of unique ID to component instance
     * @internal
     * @ignore
     */
    public componentMap : {[key : string] : Component} = {};

    /**
     * Map of user assigned IDs to component instance
     * @internal
     * @ignore
     */
    public componentIdMap : {[id : string] : Component} = {};

    public componentByMappingKey : Map<string, Component> = new Map<string, Component>();

    /**
     * @internal
     * @ignore
     */
    public videoFactory : IVideoFactory;

    /**
     * @internal
     * @ignore
     */
    public abstract getLegacyKaraoke() : boolean;

    /** A reference to the APL root context */
    public context : APL.Context;

    /** Root renderer component */
    public top : Component;

    /** A reference to the APL extension manager */
    public extensionManager : IExtensionManager;

    /**
     * @internal
     * @ignore
     */
    private view : HTMLElement | undefined;

    /**
     * @internal
     * @ignore
     */
    private startTime : number = Number.NaN;

    /**
     * @internal
     * @ignore
     */
    private requestId : number = undefined;

    /**
     * @internal
     * @ignore
     */
    private lastDSTCheck : number = 0;

    /**
     * @internal
     * @ignore
     */
    private screenLocked : boolean = false;

    /**
     * @internal
     * @ignore
     */
    private readonly MAXFPS : number = 60;

    /**
     * @internal
     * @ignore
     */
    private readonly TOLERANCE : number = 1.2;

    /**
     * @internal
     * @ignore
     */
    private readonly maxTimeDeltaBetweenFrames : number;

    /**
     * @internal
     * @ignore
     */
    private previousTimeStamp : number = undefined;

    /**
     * @internal
     * @ignore
     */
    private dropFrameCount : number = 0;

    private isEdge : boolean = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);

    public get options() : Options {
        return this.mOptions as any as Options;
    }

    public audioPlayer : AudioPlayerWrapper;

    /**
     * THis constructor is private
     * @param mOptions options passed in through `create`
     * @ignore
     */
    protected constructor(private mOptions : IAPLOptions) {
        this.logger = LoggerFactory.getLogger('APLRenderer');
        this.videoFactory = mOptions.videoFactory ? mOptions.videoFactory : new VideoFactory();
        if (!mOptions.mode) {
            mOptions.mode = 'HUB';
        }
        if (!mOptions.viewport.shape) {
            mOptions.viewport.shape = mOptions.viewport.isRound  ? 'ROUND' : 'RECTANGLE';
        }

        mOptions.view.style.height = mOptions.viewport.height + 'px';
        mOptions.view.style.width = mOptions.viewport.width + 'px';
        if (mOptions.viewport.shape === 'ROUND') {
            mOptions.view.style.clipPath = 'circle(50%)';
        } else {
            mOptions.view.style.clipPath = '';
        }
        this.view = mOptions.view;
        this.view.style.display = 'flex';
        this.view.tabIndex = 0;
        this.view.addEventListener('keydown', this.handleKeyDown, false);
        this.view.addEventListener('keyup', this.handleKeyUp, false);

        this.view.addEventListener('touchstart', this.onPointerDown);
        this.view.addEventListener('touchmove', this.onPointerMove);
        this.view.addEventListener('touchend', this.onPointerUp);
        this.view.addEventListener('touchcancel', this.onPointerLeave);
        this.view.addEventListener('mousedown', this.onPointerDown);
        this.view.addEventListener('mousemove', this.onPointerMove);
        this.view.addEventListener('mouseup', this.onPointerUp);
        this.view.addEventListener('mouseleave', this.onPointerLeave);

        mOptions.environment.agentName = mOptions.environment.agentName ?
            mOptions.environment.agentName : agentName;
        mOptions.environment.agentVersion = mOptions.environment.agentVersion ?
            mOptions.environment.agentVersion : agentVersion;
        mOptions.environment.allowOpenUrl = mOptions.environment.allowOpenUrl === undefined ?
            false : mOptions.environment.allowOpenUrl;
        mOptions.environment.disallowVideo = mOptions.environment.disallowVideo === undefined ?
            false : mOptions.environment.disallowVideo;
        mOptions.environment.animationQuality = mOptions.environment.animationQuality === undefined ?
            AnimationQuality.kAnimationQualityNormal : mOptions.environment.animationQuality;

        // set options callbacks
        if (mOptions.onSendEvent) {
            this.onSendEvent = mOptions.onSendEvent;
        }
        if (mOptions.onPEGTLError) {
            this.onPEGTLError = mOptions.onPEGTLError;
        }
        if (mOptions.onDataSourceFetchRequest) {
            this.onDataSourceFetchRequest = mOptions.onDataSourceFetchRequest;
        }
        if (mOptions.onRunTimeError) {
            this.onRunTimeError = mOptions.onRunTimeError;
        }
        if (mOptions.onRequestGraphic) {
            this.onRequestGraphic = mOptions.onRequestGraphic;
        }
        if (mOptions.onFinish) {
            this.onFinish = mOptions.onFinish;
        }
        if (mOptions.onSpeakEventStart) {
            this.onSpeakEventStart = mOptions.onSpeakEventStart;
        }
        if (mOptions.onSpeakEventEnd) {
            this.onSpeakEventEnd = mOptions.onSpeakEventEnd;
        }
        if (mOptions.environment.allowOpenUrl && mOptions.onOpenUrl) {
            this.onOpenUrl = mOptions.onOpenUrl;
        }
        if (mOptions.onExtensionEvent) {
            this.onExtensionEvent = mOptions.onExtensionEvent;
        }

        this.audioPlayer = new AudioPlayerWrapper(mOptions.audioPlayerFactory);

        this.maxTimeDeltaBetweenFrames = (1000 * this.TOLERANCE / this.MAXFPS);
    }

    public init(metricRecorder? : (m : APL.DisplayMetric) => void) {
        SpatialNavigation.uninit();
        if (this.mOptions.mode === 'TV') {
            SpatialNavigation.init();
        }

        const startTime = performance.now();
        const top = this.context.topComponent();
        this.top = componentFactory(this, top) as Component;
        if (this.view) {
            this.view.appendChild(this.top.container);
        }
        this.top.init();
        // just the top component
        this.top.$container.css('position', '');
        const stopTime = performance.now();
        if (typeof metricRecorder === 'function') {
            metricRecorder({
                kind: 'timer',
                name: 'APL-Web.RootContext.inflate',
                value: stopTime - startTime
            });
        }

        let docTheme : string = this.context.getTheme();
        if (docTheme !== 'light' && docTheme !== 'dark') {
            // treat themes other than dark and light as dark
            docTheme = 'dark';
        }

        this.setBackground(docTheme);

        // begin update loop
        this.requestId = requestAnimationFrame(this.update);
        if (this.mOptions.mode === 'TV') {
            SpatialNavigation.setFocusableComponents();
        }
    }

    public getComponentCount() : number {
        return Object.keys(this.componentMap).length;
    }

    private setBackground(docTheme : string) {
        const background = this.context.getBackground();
        const backgroundColors = {
            dark: 'black',
            light: 'white'
        };
        // Spec: If the background property is partially transparent
        // the default background color of the device will show through
        this.view.style.backgroundColor = backgroundColors[docTheme];
        this.view.style.backgroundImage = background.gradient ?
                                        Image.getCssGradient(background.gradient, this.logger) :
                                        Image.getCssPureColorGradient(background.color);
    }

    /**
     * Get developer tool options (if defined)
     */
    public getDeveloperToolOptions() : IDeveloperToolOptions | undefined {
      return this.mOptions.developerToolOptions;
    }

    /**
     *
     * @param source URL of the graphic
     * @ignore
     * @internal
     */
    public async onRequestGraphic(source : string) : Promise<string | undefined> {
        const res = await fetch(source, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'get'
        });
        if (res.status === 200) {
            const text = await res.text();
            return text;
        }
        return undefined;
    }

    /**
     * Opens the url in a new tab
     * @param source The url
     * @returns `false` if not supported
     * @internal
     * @ignore
     */
    public async onOpenUrl(source : string) : Promise<boolean> {
        if (!this.mOptions.environment.allowOpenUrl) {
            return false;
        }
        const win = window.open(source, '_blank');
        if (!win) {
            return false;
        }
        win.focus();
        return true;
    }

    /**
     * @internal
     * @ignore
     */
    public onSendEvent(event : ISendEvent) : void {
        this.logger.info(`SendEvent: ${JSON.stringify(event)}`);
    }

    /**
     * @internal
     * @ignore
     */
    public onPEGTLError(error : string) : void {
        this.logger.info(`PEGTLError: ${error}`);
    }

    /**
     * @internal
     * @ignore
     */
    public onDataSourceFetchRequest(event : IDataSourceFetchRequest) : void {
        this.logger.info(`DataSourceFetchRequest: ${JSON.stringify(event)}`);
    }

    /**
     * @internal
     * @ignore
     */
    public onFinish() : void {
    }

    /**
     * @internal
     * @ignore
     */
    public async onExtensionEvent(event : IExtensionEvent) : Promise<boolean> {
        if (this.extensionManager) {
            return new Promise<boolean>((res) => {
                this.extensionManager.onExtensionEvent(event.uri, event.event, event.name, event.source, event.params,
                    { onExtensionEventResult : (succeeded : boolean) => { res(succeeded); } });
            });
        } else {
            this.logger.info(`ExtensionEvent: ${JSON.stringify(event)}`);
        }
        return true;
    }

    /**
     * @internal
     * @ignore
     */
    public onSpeakEventEnd(type : string) : void {
        this.logger.info(`onSpeakEventEnd: ${JSON.stringify(type)}`);
    }

    /**
     * @internal
     * @ignore
     */
    public onSpeakEventStart(type : string) : void {
        this.logger.info(`onSpeakEventStart: ${JSON.stringify(type)}`);

    }

    public onRunTimeError(pendingErrors : object[]) : void {
        this.logger.warn(`onRunTimeError: ${JSON.stringify(pendingErrors)}`);
    }

    /**
     * Called by core when a text measure is required
     * @param component The component to measure
     * @param measureWidth specified width
     * @param widthMode Mode to measure width
     * @param measureHeight specified height
     * @param heightMode Mode to measure height
     * @ignore
     */
    public onMeasure(component : APL.Component, measureWidth : number, widthMode : MeasureMode,
                     measureHeight : number, heightMode : MeasureMode) {
        const { width , height } = this.mOptions.viewport;
        const comp = new TextMeasurement(component, width, height);
        comp.init();
        return comp.onMeasure(measureWidth, widthMode, measureHeight, heightMode);
    }

    /**
     * Baseline
     * @param component The component to measure
     * @param width specified width
     * @param height specified height
     * @ignore
     */
    public onBaseline(component : APL.Component, width : number, height : number) : number {
        return height * 0.5;
    }

    /**
     * Cleans up this instance
     */
    public destroy(preserveContext? : boolean) {
        if (this.context) {
            this.context.handleDisplayMetrics([{
                kind: 'counter',
                name: 'APL-Web.RootContext.dropFrame',
                value: this.dropFrameCount
            }]);

            if (this.context.topComponent()) {
                const root = this.componentMap[this.context.topComponent().getUniqueId()];
                if (root) {
                    root.destroy(true);
                }
            }
            if (!preserveContext) {
                this.context.delete();
            }
            (this.context as any) = undefined;
        }

        if (this.top && this.view &&
            this.top.container &&
            this.view.contains(this.top.container)) {
            this.view.removeChild(this.top.container);
        }
        if (this.view) {
            this.view = undefined;
        }
    }

    /**
     * @ignore
     */
    public getBackgroundColor() : string {
        return `grey`;
    }

    /**
     * Gets a component by its developer assigned ID.
     * @param id The developer assigned component ID
     */
    public getComponentById(id : string) : Component {
        return this.componentIdMap[id];
    }

    /**
     * @returns true if is in screenLock state, false otherwise.
     */
    public screenLock() : boolean {
        return this.screenLocked;
    }

    /**
     * @internal
     * @ignore
     */
    private updateTime() : void {
        const now = Date.now();
        if (isNaN(this.startTime)) {
            this.startTime = now;
        }
        // move clock forward
        this.context.updateTime(now - this.startTime, now);

        // Check once per second for a DST change or any other time-zone change
        if (now > this.lastDSTCheck + 1000) {
            const d = new Date();
            this.context.setLocalTimeAdjustment(-d.getTimezoneOffset() * 60 * 1000);
            this.lastDSTCheck = now;
        }
    }

    /**
     * Internal function to set screen lock status. Could be used to call any callback if any in future.
     * @internal
     * @ignore
     */
    private setScreenLock(lock : boolean) : void {
        this.screenLocked = lock;
    }

    /**
     * APL Core relies on operations to be performed in particular way.
     * Order and set of operations in this method should be preserved.
     * Order is the following:
     * * Update time and adjust TimeZone if required.
     * * Call **clearPending** method on RootConfig to give Core possibility to execute all pending actions and updates.
     * * Process requested events.
     * * Process dirty properties.
     * * Check and set screenlock if required.
     * @internal
     * @ignore
     */
    private coreFrameUpdate() : void {
        this.updateTime();

        this.context.clearPending();

        while (this.context && this.context.hasEvent()) {
            const event = this.context.popEvent();
            commandFactory(event, this);
        }

        if (this.context) {
            if (this.context.isDirty()) {
                const dirtyComponents = this.context.getDirty();
                for (const dirtyId of dirtyComponents) {
                    const component = this.componentMap[dirtyId];
                    if (component) {
                        component.updateDirtyProps();
                    }
                }
                this.context.clearDirty();
            }
            this.setScreenLock(this.context.screenLock());
        }
    }

    /**
     * @internal
     * @ignore
     */
    private update = (timestamp : number) => {
        if (this.context) {
            this.coreFrameUpdate();
            if (this.context) {
                const pendingErrors = this.context.getPendingErrors();
                if (pendingErrors && pendingErrors.length) {
                    this.onRunTimeError(pendingErrors);
                }

                this.dropFrameTick(timestamp);
                this.requestId = requestAnimationFrame(this.update);
            }
        }
    }

    /**
     * @internal
     * @ignore
     */
    private dropFrameTick = (timestamp : number) => {
        if (this.previousTimeStamp === undefined) {
            this.previousTimeStamp = timestamp;
        } else {
            const delta = timestamp - this.previousTimeStamp;
            if (delta > this.maxTimeDeltaBetweenFrames) {
              this.dropFrameCount++;
            }
            this.previousTimeStamp = timestamp;
        }
    }

    // Devtool APIs
    /**
     * Cancel Animation Frame
     */
    public async stopUpdate() : Promise<void> {
        window.cancelAnimationFrame(this.requestId);
        this.requestId = undefined;
        return Promise.resolve();
    }

    /**
     * Return a map of components where the key matches the non-unique part of mappingKey
     * (when mappings are created a unique identifier is appended to ensure maps are unique)
     *
     * Note: mappingKeys are configured via developerToolOptions and come from -user- attributes
     */
    public getComponentsByMappingKey(mappingKey : string) : Map<string, Component> {
        return new Map(
            Array.from(this.componentByMappingKey).filter(
                /*
                * evaluate the passed `path` value against the map of componentsByPath
                * after stripping the internalId so that it's a path to path comparison.
                */
                (v, k) => v[0].replace(APLRenderer.mappingKeyExpression, '') === mappingKey));
    }

    /**
     * Add a component without re-rendering the whole output. The virtual component will be returned.
     *
     * @param parent Virtual component to add new component to.
     * @param childIndex Index to put component to. Existing component at this index will be pushed up.
     * @param componentData json string containing component definition.
     * @returns virtual component.
     */
    public addComponent(parent : Component, childIndex : number, componentData : string) : Component | undefined {
        return parent.inflateAndAddChild(childIndex, componentData);
    }

    /**
     * Delete a component without re-rendering the whole output.
     *
     * @param component Virtual component to remove.
     * @returns true if removed, false otherwise.
     */
    public deleteComponent(component : Component) : boolean {
        return component.remove();
    }

    /**
     * Update a component without re-rendering the whole output. Given the component's path and json payload,
     * this component's DOM element will be returned.
     *
     * @param parent Virtual component to replace current component with.
     * @param componentData Json string containing component definition.
     * @returns virtual component.
     */
    public updateComponent(component : Component, componentData : string) : Component | undefined {
        const parent = component.parent;
        if (!parent) {
            return undefined;
        }
        const childIndex = parent.children.indexOf(component);
        component.remove();
        return parent.inflateAndAddChild(childIndex, componentData);
    }

    private getScreenCoords = (evt : MouseEvent | Touch) => {
        let x = evt.clientX;
        let y = evt.clientY;
        if (navigator.appVersion.indexOf('MSIE') !== -1) {
            // in IE scrolling page affects mouse coordinates into an element
            // This gets the page element that will be used to add scrolling value to correct mouse coords
            const standardBody = (document.compatMode === 'CSS1Compat') ? document.documentElement : document.body;
            x += standardBody.scrollLeft;
            y += standardBody.scrollTop;
        }
        return {x, y};
    }

    private getLeavingCoords = (evt : MouseEvent) => {
        const coords = this.getViewportCoords(evt);
        let x : number;
        let y : number;
        const delta = 5;
        x = Math.abs(coords.x) < delta ? -delta : Math.abs(coords.x -
            this.view.getBoundingClientRect().width) < delta ? coords.x + delta : coords.x;
        y = Math.abs(coords.y) < delta ? -delta : Math.abs(coords.y -
            this.view.getBoundingClientRect().height) < delta ? coords.y + delta : coords.y;
        return {x, y};
    }

    private getTransformScale = () => {
        let scaleX : number = 1;
        let scaleY : number = 1;
        if (this.view !== undefined) {
            scaleX = this.view.getBoundingClientRect().width / this.view.offsetWidth;
            scaleY = this.view.getBoundingClientRect().height / this.view.offsetHeight;
        }
        return {scaleX, scaleY};
    }

    private getViewportCoords = (evt : MouseEvent | Touch) => {
        const screenCoords = this.getScreenCoords(evt);
        const offsetLeft = this.view === undefined ? 0 : this.view.getBoundingClientRect().left;
        const offsetTop = this.view === undefined ? 0 : this.view.getBoundingClientRect().top;
        const x = (screenCoords.x - offsetLeft) / this.getTransformScale().scaleX;
        const y = (screenCoords.y - offsetTop) / this.getTransformScale().scaleY;
        return {x, y};
    }

    private onPointerDown = (evt : UIEvent) => {
        if (this.context && this.view) {
            if (evt instanceof MouseEvent) {
                this.sendMousePointerEvent(evt, PointerEventType.kPointerDown);
            } else if (evt instanceof TouchEvent) {
                this.sendTouchPointerEvent(evt, PointerEventType.kPointerDown);
            } else {
                this.logger.warn('The pointer event is not supported.');
            }
        }
    }

    private onPointerMove = (evt : UIEvent) => {
        if (this.context && this.view) {
            if (evt instanceof MouseEvent) {
                this.sendMousePointerEvent(evt, PointerEventType.kPointerMove);
            } else if (evt instanceof TouchEvent) {
                this.sendTouchPointerEvent(evt, PointerEventType.kPointerMove);
            } else {
                this.logger.warn('The pointer event is not supported.');
            }
        }
    }

    private onPointerUp = (evt : UIEvent) => {
        if (this.context && this.view) {
            if (evt instanceof MouseEvent) {
                this.sendMousePointerEvent(evt, PointerEventType.kPointerUp);
            } else if (evt instanceof TouchEvent) {
                this.sendTouchPointerEvent(evt, PointerEventType.kPointerUp);
                // to prevent a mouseDown event been triggered in touch enabled browser.
                // another option is to use evt.preventDefault(), but not supported in some browsers.
                this.lastPointerEventTimestamp = (new Date()).getTime();
            } else {
                this.logger.warn('The pointer event is not supported.');
            }
        }
    }

    private onPointerLeave = (evt : UIEvent) => {
        if (this.context && this.view) {
            if (evt instanceof MouseEvent) {
                const coords = this.getLeavingCoords(evt);
                this.context.updateCursorPosition(coords.x, coords.y);
                this.sendMousePointerEvent(evt, PointerEventType.kPointerCancel);
            } else if (evt instanceof TouchEvent) {
                this.sendTouchPointerEvent(evt, PointerEventType.kPointerCancel);
            } else {
                this.logger.warn('The pointer event is not supported.');
            }
        }
    }

    private sendMousePointerEvent = (evt : MouseEvent, pointerEventType : PointerEventType) => {
        // to prevent mouse events been triggered in touch enabled browser.
        // It is followed by touchend event after 300-500ms.
        const gap = (new Date()).getTime() - this.lastPointerEventTimestamp;
        if (gap > pointerEventGap) {
            const coords = this.getViewportCoords(evt);
            this.context.handlePointerEvent(pointerEventType,
                coords.x, coords.y, APLRenderer.mousePointerId, PointerType.kMousePointer);
        }
    }

    private sendTouchPointerEvent = (evt : TouchEvent, pointerEventType : PointerEventType) => {
        const touchCount = evt.changedTouches.length;
        for (let i = 0; i < touchCount; i++) {
            const touch : Touch = evt.changedTouches.item(i);
            const coords = this.getViewportCoords(touch);
            const handlePointerEventResult = this.context.handlePointerEvent(pointerEventType,
                coords.x, coords.y, touch.identifier, PointerType.kTouchPointer);
            if (handlePointerEventResult) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        }
    }

    private handleKeyDown = async (evt : IAsyncKeyboardEvent) => {
        await this.passKeyboardEventToCore(evt, KeyHandlerType.KeyDown);
    }

    private handleKeyUp = async (evt : IAsyncKeyboardEvent) => {
        await this.passKeyboardEventToCore(evt, KeyHandlerType.KeyUp);
    }

    /**
     * Get APL.Keyboard object
     * for MS edge Gamepad, repeat/altKey/ctrlKey/metaKey/shiftKey are undefined, need set default to false
     */
    private getKeyboard = (evt : KeyboardEvent) => {
        const keyboard : APL.Keyboard = {
            code: this.isEdge ? this.getKeyboardCodeInEdge(evt) : evt.code,
            key: evt.key,
            repeat: evt.repeat === undefined ? false : evt.repeat,
            altKey: evt.altKey === undefined ? false : evt.altKey,
            ctrlKey: evt.ctrlKey === undefined ? false : evt.ctrlKey,
            metaKey: evt.metaKey === undefined ? false : evt.metaKey,
            shiftKey: evt.shiftKey === undefined ? false : evt.shiftKey
        };
        return keyboard;
    }

    private getKeyboardCodeInEdge = (evt : KeyboardEvent) : string => {
        if (this.isDPadKey(evt.key)) {
            return evt.key;
        } else if (evt.key.match('[0-9]')) {
            return 'Digit' + evt.key;
        } else if (evt.key.match('[a-zA-Z]')) {
            return 'Key' + String.fromCharCode(evt.keyCode);
        }
        return evt.code;
    }

    private passKeyboardEventToCore = async (evt : IAsyncKeyboardEvent, keyHandlerType : number) => {
        if (this.context && !evt.asyncChecked) {
            if (this.isDPadKey(evt.key)) {
                evt.preventDefault();
                evt.stopPropagation();
            }
            const keyboard : APL.Keyboard = this.getKeyboard(evt);
            const handleKeyboardResult = await this.context.handleKeyboard(keyHandlerType, keyboard);
            if (handleKeyboardResult === false) {
                if (this.isDPadKey(evt.key)) {
                    if (!this.isEdge) {
                        // @ts-ignore
                        const eventClone = new evt.constructor(evt.type, evt);
                        eventClone.asyncChecked = true;
                        evt.target.dispatchEvent(eventClone);
                    } else {
                        // Handle Edge browser dispatch keyboard event copy
                        // cast to any type to bypass changing read-only property
                        // @ts-ignore
                        const eventCopy = document.createEvent('Event') as Any;
                        eventCopy.initEvent(evt.type, evt.bubbles, evt.cancelable);
                        eventCopy.code = evt.key;
                        eventCopy.key = evt.key;
                        eventCopy.keyCode = evt.keyCode;
                        eventCopy.asyncChecked = true;
                        evt.target.dispatchEvent(eventCopy);
                    }
                }
            }
        }
    }

    private isDPadKey = (key : string) : boolean => {
        return key === ENTER_KEY || key === ARROW_LEFT || key === ARROW_UP || key === ARROW_RIGHT || key === ARROW_DOWN;
    }
}
