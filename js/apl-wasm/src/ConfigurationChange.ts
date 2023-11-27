/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeviceMode, IConfigurationChangeOptions, ScreenMode } from 'apl-html';

/**
 * ConfigurationChange Object used in WebVH WASM to trigger reInflate/reSize.
 */
export class ConfigurationChange {

    public configurationChange: APL.ConfigurationChange;
    public width: number;
    public height: number;
    public minWidth: number;
    public maxWidth: number;
    public minHeight: number;
    public maxHeight: number;

    /**
     * Creates an instance of a ConfigurationChange object.
     * @param options - optional config change options used to init the object.
     */
    public static create(options?: IConfigurationChangeOptions) {
        const configChange = new ConfigurationChange();
        if (options) {
            let autoSize = false;
            let width = 0;
            let height = 0;
            let minWidth = 0;
            let maxWidth = 0;
            let minHeight = 0;
            let maxHeight = 0;
            if ('width' in options && 'height' in options) {
                width = options.width!;
                height = options.height!;
            }
            if ('minWidth' in options && 'maxWidth' in options &&
                'minHeight' in options && 'maxHeight' in options) {
                autoSize = true;
                minWidth = options.minWidth!;
                maxWidth = options.maxWidth!;
                minHeight = options.minHeight!;
                maxHeight = options.maxHeight!;
            }
            if ('docTheme' in options) {
                configChange.theme(options.docTheme!);
            }
            if ('theme' in options) {
                configChange.theme(options.theme!);
            }
            if ('mode' in options) {
                configChange.viewportMode(options.mode!);
            }
            if ('screenMode' in options) {
                configChange.screenMode(options.screenMode!);
            }
            if ('screenReader' in options) {
                configChange.screenReader(options.screenReader!);
            }
            if ('fontScale' in options) {
                configChange.fontScale(options.fontScale!);
            }
            if ('disallowVideo' in options) {
                configChange.disallowVideo(options.disallowVideo!);
            }
            if ('environmentValues' in options) {
                Object.keys(options.environmentValues!).forEach((key) =>
                    configChange.environmentValue(key, options.environmentValues![key])
                );
            }
            if (autoSize) {
                if (width > 0 && height > 0) {
                    configChange.sizeRange(width, minWidth, maxWidth, height, minHeight, maxHeight);
                } else {
                    throw new Error('ConfigurationChange: default width and height must be set for auto sizing');
                }
            } else {
                if (width > 0 && height > 0) {
                    configChange.size(width, height);
                }
            }
        }
        return configChange;
    }

    /**
     * Get ConfigurationChange created from Core.
     */
    public getConfigurationChange(): APL.ConfigurationChange {
        return this.configurationChange;
    }

    /**
     * Add Fixed Size information to the ConfigurationChange object.
     * @param width
     * @param height
     */
    public size(width: number, height: number): ConfigurationChange {
        this.configurationChange.size(width, height);
        this.width = width;
        this.height = height;
        return this;
    }

    /**
     * Add Variable Size information to the ConfigurationChange object.
     * @param width
     * @param height
     */
    public sizeRange(width: number, minWidth: number, maxWidth: number,
                     height: number, minHeight: number, maxHeight: number): ConfigurationChange {
        this.configurationChange.sizeRange(width, minWidth, maxWidth, height, minHeight, maxHeight);
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.minHeight = minHeight;
        this.maxHeight = maxHeight;
        return this;
    }

    /**
     * Add theme information to the ConfigurationChange object.
     * @param theme
     */
    public theme(theme: string): ConfigurationChange {
        this.configurationChange.theme(theme);
        return this;
    }

    /**
     * Add viewport mode information to the ConfigurationChange object.
     * @param viewportMode
     */
    public viewportMode(viewportMode: DeviceMode): ConfigurationChange {
        this.configurationChange.viewportMode(viewportMode);
        return this;
    }

    /**
     * Add scaling factor information to the ConfigurationChange object.
     * @param scale
     */
    public fontScale(scale: number): ConfigurationChange {
        this.configurationChange.fontScale(scale);
        return this;
    }

    /**
     * Add screen mode information to the ConfigurationChange object.
     * @param screenMode
     */
    public screenMode(screenMode: ScreenMode): ConfigurationChange {
        this.configurationChange.screenMode(screenMode);
        return this;
    }

    /**
     * Add screen reader turned on or not to the ConfigurationChange object.
     * @param enabled
     */
    public screenReader(enabled: boolean): ConfigurationChange {
        this.configurationChange.screenReader(enabled);
        return this;
    }

    public disallowVideo(disallowVideo: boolean): ConfigurationChange {
        this.configurationChange.disallowVideo(disallowVideo);
        return this;
    }

    public environmentValue(key: string, value: object): ConfigurationChange {
        this.configurationChange.environmentValue(key, value);
        return this;
    }

    /**
     * merge configuration change.
     * @param other config change object
     */
    public mergeConfigurationChange(other: ConfigurationChange): void {
        if (other.width && other.height) {
            this.width = other.width;
            this.height = other.height;
        }
        if (other.minWidth && other.maxWidth && other.minHeight && other.maxHeight) {
            this.minWidth = other.minWidth;
            this.maxWidth = other.maxWidth;
            this.minHeight = other.minHeight;
            this.maxHeight = other.maxHeight;
        }
        this.configurationChange.mergeConfigurationChange(other.getConfigurationChange());
    }

    /**
     * @internal
     * @ignore
     */
    private constructor() {
        this.configurationChange = Module.ConfigurationChange.create();
    }
}
