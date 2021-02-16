/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { GraphicElementType } from '../../enums/GraphicElementType';
import { ILogger } from '../../logging/ILogger';
import { SVG_NS } from '../Component';

export abstract class AVG {
    protected element : Element;

    constructor(protected graphic : APL.GraphicElement,
                protected parent : Element, protected logger : ILogger) {
        let tag : string;
        if (graphic.getType() === GraphicElementType.kGraphicElementTypeGroup) {
            tag = 'g';
        } else if (graphic.getType() === GraphicElementType.kGraphicElementTypePath) {
            tag = 'path';
        } else if (graphic.getType() === GraphicElementType.kGraphicElementTypeText) {
            tag = 'text';
        } else {
            this.logger.debug(`GraphicElement type ${graphic.getType()} is not supported`);
            return;
        }
        this.element =  document.createElementNS(SVG_NS, tag);
        parent.appendChild(this.element);
    }

    public abstract setAllProperties();
    public abstract updateDirty();
}
