/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export const Nothing = Symbol('Nothing');
export type Nothing = typeof Nothing;
export type Maybe<T> = T | Nothing | undefined;

export function isSomething<T>(value: Maybe<T>): value is T {
    return value !== undefined && value !== Nothing;
}
