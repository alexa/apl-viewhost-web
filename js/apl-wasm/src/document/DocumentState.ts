/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentHandle } from './DocumentHandle';

export enum DocumentState {
    pending = 0,
    prepared,
    inflated,
    displayed,
    finished,
    error
}

export interface IDocumentLifecycleListener {
    onStateUpdate(handle: DocumentHandle, state: DocumentState): void;
}
