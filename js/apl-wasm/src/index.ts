/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { APLWASMRenderer } from './APLWASMRenderer';
export { IAPLWASMOptions, IValidViewportSpecification } from './APLWASMRenderer';
export { ConfigurationChange } from './ConfigurationChange';
export default APLWASMRenderer;
export * from 'apl-html';
export { ExtensionFilterDefinition } from './extensions/ExtensionFilterDefinition';
export * from './extensions/ExtensionConfiguration';
export { ExtensionManager } from './extensions/ExtensionManager';
export { AudioPlayerExtension } from './extensions/audioplayer/AudioPlayerExtension';
export { AudioPlayerExtensionObserverInterface, Lyric} from './extensions/audioplayer/AudioPlayerExtensionObserverInterface';
export { AttentionSystemExtension } from './extensions/attentionsystem/AttentionSystemExtension';
export { BackstackExtension } from './extensions/backstack/BackstackExtension';
export { UnifiedBackstackExtension } from './extensions/unifiedBackstack/UnifiedBackstackExtension';
export { IDocumentState, createDocumentState } from './extensions/backstack/IDocumentState';
export * from './common/ViewhostTypes';
export * from './document/DocumentState';
export { DocumentHandle } from './document/DocumentHandle';
export { PreparedDocument } from './document/PreparedDocument';
export * from './viewhost/IRequest';
export { IAPLViewhostConfig } from './viewhost/ViewhostConfig';
export { APLViewhostWASM } from './viewhost/APLViewhostWASM';

/**
 * Call this first before anything. This function loads any webassembly
 * and waits for the content to be ready.
 * @param path Optional path to load from. If not supplied, it assumes that
 * apl-wasm.js can be loaded from the root.
 */
export async function initEngine(): Promise<void> {
    await new Promise<void>((res) => {
        Module.onRuntimeInitialized = () => res();
    });
}
