/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import * as loglevel from 'loglevel';
import { LogLevelNumbers, MethodFactory } from 'loglevel';
import { ILogger } from './ILogger';
import { LogTransport } from './LogTransport';
import { LogLevel } from './LogLevel';

/**
 * Simple wrapper to hide loglevel logger oddity and do set-up. Could be changed to be more generic in the future.
 */
export class LoggerFactory {
    /// Root logger object.
    private static rootLogger : loglevel.RootLogger = loglevel;
    private static originalFactory : MethodFactory = LoggerFactory.rootLogger.methodFactory;

    /// Flag to specify if logger was initialized.
    private static initialized : boolean = false;

    /**
     * Initialize logger
     *
     * @param logLevel one of 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
     * @param transport optional parameter for custom log transport. @see LogTransport
     */
    public static initialize(logLevel : LogLevel, transport? : LogTransport) : void {
        this.rootLogger.setDefaultLevel(logLevel);

        this.rootLogger.methodFactory =
            (methodName : string,
             level : LogLevelNumbers,
             loggerName : string) => {
                const rawMethod = LoggerFactory.originalFactory(methodName, level, loggerName);
                return (message : string) => {
                    if (transport) {
                        transport(methodName as LogLevel, loggerName, message);
                    } else {
                        rawMethod(`${methodName[0].toUpperCase()} ${loggerName}:  ${message}`);
                    }
                };
            };
        this.rootLogger.setLevel(this.rootLogger.getLevel());
        this.initialized = true;
    }

    /**
     * Creates component specific logger.
     *
     * @param name Name of the requesting component.
     */
    public static getLogger(name : string) : ILogger {
        if (!this.initialized) {
            this.initialize('info');
        }
        return this.rootLogger.getLogger(name) as ILogger;
    }
}
