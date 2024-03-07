/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogLevel } from '../enums/LogLevel';

/// All supported levels for log command.
export enum LogCommandLevel {
    debug,
    info,
    warn,
    error,
    critical
}

/// Convert a Core log level to a supported log level.
export function logLevelToLogCommandLevel(level: LogLevel) {
    switch (level) {
        case LogLevel.kDebug:
            return LogCommandLevel.debug;
        case LogLevel.kInfo:
            return LogCommandLevel.info;
        case LogLevel.kWarn:
            return LogCommandLevel.warn;
        case LogLevel.kError:
            return LogCommandLevel.error;
        case LogLevel.kCritical:
            return LogCommandLevel.critical;
        default:
            return LogCommandLevel.info;
    }
}

/// Simple function type for log command callback.
export type OnLogCommand = (level: LogCommandLevel, message: string, args: object) => void;
