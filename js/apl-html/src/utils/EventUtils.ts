/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export const processNextTick = (func): void => {
    setTimeout(func, 0);
};
