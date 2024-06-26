/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioPlayerFactory, DeviceMode, IDataSourceFetchRequest,
    IDeveloperToolOptions, IEnvironment, IExtensionEvent, ISendEvent,
    IVideoFactory, IViewportCharacteristics, JSLogLevel, LogTransport } from 'apl-html';
import { DocumentHandle } from '../document/DocumentHandle';
import { DocumentState } from '../document/DocumentState';
import { ExtensionManager } from '../extensions/ExtensionManager';
import { UnifiedBackstackExtension } from '../extensions/unifiedBackstack/UnifiedBackstackExtension';

/**
 * Viewhost configuration
 */
export interface IAPLViewhostConfig {
    /** Contains all the information on environment support and options */
    environment: IEnvironment;
    /** APL theme. Usually 'light' or 'dark' */
    theme: string;
    /** Optional Video player factory. If no player is provided, a default player will be used */
    videoFactory?: IVideoFactory;
    /** Physical viewport characteristics */
    viewport: IViewportCharacteristics;
    /** Device mode. If no provided "HUB" is used. */
    mode?: DeviceMode;
    /** Optional externalized audio player factory */
    audioPlayerFactory?: AudioPlayerFactory;
    /** Callback for executed SendEvent commands */
    onSendEvent?: (event: ISendEvent) => void;
    /** Callback for logging PEGTL Parsing Session Error */
    onPEGTLError?: (error: string) => void;
    /** Callback for Finish command */
    onFinish?: () => void;
    /** Callback for Extension command */
    onExtensionEvent?: (event: IExtensionEvent) => Promise<boolean>;
    /** Callback for Data Source fetch requests */
    onDataSourceFetchRequest?: (event: IDataSourceFetchRequest) => void;
    /** Callback for pending errors from APLCore Library */
    onRunTimeError?: (pendingErrors: object[]) => void;
    /** Callback for ignoring resize config change */
    onResizingIgnored?: (ignoredWidth: number, ignoredHeight: number) => void;
    /**
     * Callback when a AVG source needs to be retrieved by the consumer
     * If this is not provided, this viewhost will use the fetch API to
     * retrieve graphic content from sources.
     */
    onRequestGraphic?: (url: string, headers?: Headers) => Promise<string | undefined>;
    /**
     * Callback to open a URL. Return `false` if this call fails
     */
    onOpenUrl?: (source: string) => Promise<boolean>;
    /**
     * Callback for view size update during auto-resizing. width and height in pixels
     * Runtime should return quickly as this method blocks the rendering path
     */
    onViewportSizeUpdate?: (pixelWidth: number, pixelHeight: number) => void;
    /**
     * Contains developer tool options
     */
    developerToolOptions?: IDeveloperToolOptions;
    /** Starting UTC time in milliseconds since 1/1/1970 */
    utcTime: number;
    /** Offset of the local time zone from UTC in milliseconds */
    localTimeAdjustment: number;
    /** Log level to report. */
    logLevel?: JSLogLevel;
    /** Log transport */
    logTransport?: LogTransport;
    /** Extension Manager */
    extensionManager?: ExtensionManager;
    /** Override package download. Reject the Promise to fallback to the default logic. */
    packageLoader?: (name: string, version: string, url?: string) => Promise<string>;
    /** callback for APL Log Command handling, will overwrite the callback used in Content creation */
    onLogCommand?: (level: number, message: string, args: object) => void;
    /** Skip force loading of fonts loading. For tests mainly as electron flacky with it. */
    notLoadFonts?: boolean;
    /** Listen to document state update */
    onDocumentStateUpdate?: (handle: DocumentHandle, state: DocumentState) => void;
    /** Backstack extension provider */
    backstackExtension?: UnifiedBackstackExtension;
}
