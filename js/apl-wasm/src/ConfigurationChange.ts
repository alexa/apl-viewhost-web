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

    /**
     * Creates an instance of a ConfigurationChange object.
     * @param options - optional config change options used to init the object.
     */
    public static create(options?: IConfigurationChangeOptions) {
        const configChange = new ConfigurationChange();
        if (options) {
            if (options.width && options.height) {
                configChange.size(options.width, options.height);
            }
            if (options.docTheme) {
                configChange.theme(options.docTheme);
            }
            if (options.mode) {
                configChange.viewportMode(options.mode);
            }
            if (options.screenMode) {
                configChange.screenMode(options.screenMode);
            }
            if (options.screenReader) {
                configChange.screenReader(options.screenReader);
            }
            if (options.fontScale) {
                configChange.fontScale(options.fontScale);
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
     * Add Size information to the ConfigurationChange object.
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

    /**
     * merge configuration change.
     * @param other config change object
     */
    public mergeConfigurationChange(other: ConfigurationChange): void {
        if (other.width && other.height) {
            this.width = other.width;
            this.height = other.height;
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
