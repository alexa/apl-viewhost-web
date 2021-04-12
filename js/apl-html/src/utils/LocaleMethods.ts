/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

function toUpperCase(value : string, locale : string) : string {
    return callSafely(value, locale, 'toLocaleUpperCase');
}

function toLowerCase(value : string, locale : string) : string {
    return callSafely(value, locale, 'toLocaleLowerCase');
}

function callSafely(value : string, locale : string, localeFunctionName : string) {
    if (!locale) {
        return value[localeFunctionName]();
    }
    return value[localeFunctionName](locale);
}

export const LocaleMethods = {
    toUpperCase,
    toLowerCase
};
