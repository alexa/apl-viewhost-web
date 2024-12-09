/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { IConfigurationChangeOptions, JSLogLevel, MetricsRecorder } from 'apl-html';
import { IAPLViewhostConfig } from './ViewhostConfig';

/**
 * Encapsulates global viewhost state during rendering. This state is independent of a particular APL component.
 * Components should obtain the state from the context object itself for each render operation instead of storing
 * references to its contents.
 */
export class ViewhostContext {
    private viewhostConfig: IAPLViewhostConfig;
    private logLevel: JSLogLevel;
    private metricsRecorder?: MetricsRecorder;

    public static create(viewhostConfig: IAPLViewhostConfig, metricsRecorder?: MetricsRecorder): ViewhostContext {
        return new ViewhostContext(viewhostConfig, metricsRecorder);
    }

    private constructor(viewhostConfig: IAPLViewhostConfig, metricsRecorder?: MetricsRecorder) {
        this.viewhostConfig = viewhostConfig;
        this.logLevel = viewhostConfig.logLevel || 'debug';
        this.metricsRecorder = metricsRecorder;
    }

    public getConfig(): IAPLViewhostConfig {
        return this.viewhostConfig;
    }

    /**
     * Update the configure of the view and viewhost
     * @param config IConfigurationChangeOptions
     */
    public configurationChange(config: IConfigurationChangeOptions) {
        if (config.mode) {
            this.viewhostConfig.mode = config.mode;
        }
        if (config.theme) {
            this.viewhostConfig.theme = config.theme;
        }
        if (config.docTheme) {
            this.viewhostConfig.theme = config.docTheme;
        }
        if (config.width && config.height) {
            if (config.maxWidth && config.maxHeight && config.minWidth && config.minHeight) {
                this.viewhostConfig.viewport = {
                    ...this.viewhostConfig.viewport,
                    width: config.width,
                    height: config.height,
                    maxWidth: config.maxWidth,
                    maxHeight: config.maxHeight,
                    minWidth: config.minWidth,
                    minHeight: config.minHeight
                };
            } else {
                this.viewhostConfig.viewport = {
                    ...this.viewhostConfig.viewport,
                    width: config.width,
                    height: config.height,
                    maxWidth: config.width,
                    maxHeight: config.height,
                    minWidth: config.width,
                    minHeight: config.height
                };
            }
        }
    }

    public setConfig(viewhostConfig: IAPLViewhostConfig): void {
        this.viewhostConfig = viewhostConfig;
    }

    public getLogLevel(): JSLogLevel {
        return this.logLevel;
    }

    public setLogLevel(logLevel: JSLogLevel): void {
        this.logLevel = logLevel;
    }

    public getMetricsRecorder(): MetricsRecorder|undefined {
        return this.metricsRecorder;
    }
}
