/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {GraphicPropertyKey} from '../../enums/GraphicPropertyKey';
import {AVG} from './AVG';
import {Path} from './Path';
import {AVGText} from './AVGText';
import {ILogger} from '../../logging/ILogger';
import {Component} from '../Component';
import {GraphicElementType} from '../../enums/GraphicElementType';

export interface GroupArgs {
    graphic: APL.GraphicElement;
    parent: Element;
    logger: ILogger;
    lang: string;
}

export class Group extends AVG {
    public children: AVG[] = [];

    constructor({graphic, parent, logger, lang}: GroupArgs) {
        super({
            graphic,
            parent,
            logger,
            lang
        });
        this.graphicKeysToSetters = new Map([
            [GraphicPropertyKey.kGraphicPropertyTransform, this.setAttribute('transform')],
            [GraphicPropertyKey.kGraphicPropertyOpacity, this.setAttribute('opacity')],
            [GraphicPropertyKey.kGraphicPropertyFilters, this.setFilter()],
            [GraphicPropertyKey.kGraphicPropertyClipPath, this.setClipPath()]
        ]);
    }

    private setClipPath() {
        return (key: GraphicPropertyKey) => {
            const clipPath = Component.getClipPathElementId(
                this.graphic.getValue<string>(key), this.parent);
            this.element.setAttributeNS('', 'clip-path', clipPath.toString());
        };
    }

    public bootStrapChildren(graphic: APL.GraphicElement, logger: ILogger) {
        for (let i = 0; i < graphic.getChildCount(); i++) {
            const child = graphic.getChildAt(i);
            if (child.getType() === GraphicElementType.kGraphicElementTypeGroup) {
                const childAVG = new Group({
                    graphic: child,
                    parent: this.element,
                    logger,
                    lang: this.lang
                });
                childAVG.bootStrapChildren(child, logger);
                this.children.push(childAVG);
            } else if (child.getType() === GraphicElementType.kGraphicElementTypePath) {
                const childAVG = new Path(child, this.element, logger);
                this.children.push(childAVG);
            } else if (child.getType() === GraphicElementType.kGraphicElementTypeText) {
                const childText = new AVGText({
                    graphic: child,
                    parent: this.element,
                    logger,
                    lang: this.lang
                });
                this.children.push(childText);
            }
        }
        for (const child of this.children) {
            child.setAllProperties();
        }
    }
}
