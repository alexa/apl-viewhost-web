/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { APLWASMRenderer } from './APLWASMRenderer';
export { IAPLWASMOptions, IValidViewportSpecification } from './APLWASMRenderer';
export { LiveMap } from './LiveMap';
export { LiveArray } from './LiveArray';
export default APLWASMRenderer;
export * from 'apl-html';
export { ExtensionCommandDefinition, ExtensionEventHandler, ExtensionFilterDefinition } from './extensions/Extension';
export * from './extensions/ExtensionConfiguration';
export { ExtensionManager } from './extensions/ExtensionManager';
export { BackstackExtension } from './extensions/backstack/BackstackExtension';
export { AudioPlayerExtension } from './extensions/audioplayer/AudioPlayerExtension';
export { AudioPlayerExtensionObserverInterface, Lyric} from './extensions/audioplayer/AudioPlayerExtensionObserverInterface';
export { IDocumentState, createDocumentState } from './extensions/IDocumentState';
export * from './extensions/IExtension';

/**
 * Call this first before anything. This function loads any webassembly
 * and waits for the content to be ready.
 * @param path Optional path to load from. If not supplied, it assumes that
 * apl-wasm.js can be loaded from the root.
 */
export async function initEngine() : Promise<void> {
    await new Promise<void>((res) => {
        Module.onRuntimeInitialized = () => res();
    });
}
