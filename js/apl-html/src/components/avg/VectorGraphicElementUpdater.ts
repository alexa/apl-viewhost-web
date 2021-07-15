/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { GraphicElementType } from '../../enums/GraphicElementType';
import { AVG } from './AVG';
import { Group } from './Group';
import { Path } from './Path';
import { AVGText } from './AVGText';
import { ILogger, LoggerFactory } from '../..';

export { AVG } from './AVG';
export { Group } from './Group';
export { Path } from './Path';
export { AVGText } from './AVGText';

export interface UpdateElementsArgs {
    root: APL.GraphicElement;
    parentElement: Element;
    dirty: { [key: number]: APL.GraphicElement };
    lang: string;
}

export class VectorGraphicElementUpdater {
    private AVGByGraphicKey: Map<number, AVG> = new Map<number, AVG>();
    private walkable: Set<GraphicElementType> = new Set<GraphicElementType>(
        [
            GraphicElementType.kGraphicElementTypeContainer,
            GraphicElementType.kGraphicElementTypeGroup
        ]);
    private orphanedAVGKeys: Set<number>;
    private readonly logger: ILogger;

    constructor() {
        this.logger = LoggerFactory.getLogger('VectorGraphicUpdater');
    }

    public updateElementsWithArgs({root, parentElement, dirty, lang}: UpdateElementsArgs) {
        this.orphanedAVGKeys = new Set<number>(this.AVGByGraphicKey.keys());
        this.walkTree(root, parentElement, dirty, lang);
        this.deleteOrphanedElements();
    }

    /**
     * @Deprecated use updateElementsWithArgs
     */
    public updateElements(root: APL.GraphicElement,
                          parentElement: Element,
                          dirty: { [key: number]: APL.GraphicElement }) {
        this.updateElementsWithArgs({
            root,
            parentElement,
            dirty,
            lang: ''
        });
    }

    private walkTree(root: APL.GraphicElement,
                     parentElement: Element,
                     dirty: { [key: number]: APL.GraphicElement },
                     lang: string) {
        if (root && this.walkable.has(root.getType())) {
            for (let i = 0; i < root.getChildCount(); i++) {
                const child = root.getChildAt(i);
                this.orphanedAVGKeys.delete(child.getId());
                if (!this.AVGByGraphicKey.has(child.getId())) {
                    const newElement = this.createElement(child, parentElement, lang);
                    if (newElement) {
                        this.AVGByGraphicKey.set(child.getId(), newElement);
                    }
                }
                if (dirty && dirty.hasOwnProperty(child.getId())) {
                    const dirtyElement = this.AVGByGraphicKey.get(child.getId());
                    dirtyElement.graphic = dirty[child.getId()];
                    dirtyElement.updateDirty();
                }
                this.walkTree(child, this.AVGByGraphicKey.get(child.getId()).element, dirty, lang);
            }
        } else {
            return;
        }
    }

    private createElement(graphicElement: APL.GraphicElement, parentElement: Element, lang: string): AVG | undefined {
        let newAVG: AVG;
        if (graphicElement.getType() === GraphicElementType.kGraphicElementTypeGroup) {
            newAVG = new Group({
                graphic: graphicElement,
                parent: parentElement,
                logger: this.logger,
                lang
            });
        } else if (graphicElement.getType() === GraphicElementType.kGraphicElementTypePath) {
            newAVG = new Path(graphicElement, parentElement, this.logger);
        } else if (graphicElement.getType() === GraphicElementType.kGraphicElementTypeText) {
            newAVG = new AVGText({
                graphic: graphicElement,
                parent: parentElement,
                logger: this.logger,
                lang
            });
        } else {
            this.logger.debug(`GraphicElement type ${graphicElement.getType()} is not supported`);
            return undefined;
        }
        newAVG.setAllProperties();
        return newAVG;
    }

    private deleteOrphanedElements() {
        const removeFromParentCallback = (key) => {
            const elementToRemove = this.AVGByGraphicKey.get(key).element;
            if (elementToRemove && elementToRemove.parentNode) {
                this.AVGByGraphicKey.delete(key);
                elementToRemove.parentNode.removeChild(elementToRemove);
            }
        };
        this.orphanedAVGKeys.forEach(removeFromParentCallback);
        this.orphanedAVGKeys.clear();
    }
}
