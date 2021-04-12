/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { PropertyKey } from '../../enums/PropertyKey';
import { VectorGraphicAlign } from '../../enums/VectorGraphicAlign';
import { VectorGraphicScale } from '../../enums/VectorGraphicScale';
import { Component, FactoryFunction, IComponentProperties } from '../Component';
import { ActionableComponent } from '../ActionableComponent';
import { VectorGraphicElementUpdater } from './VectorGraphicElementUpdater';

export interface IVectorGraphicProperties extends IComponentProperties {
    [PropertyKey.kPropertyAlign] : VectorGraphicAlign;
    [PropertyKey.kPropertyGraphic] : APL.Graphic;
    [PropertyKey.kPropertyMediaBounds] : APL.Rect;
    [PropertyKey.kPropertyScale] : VectorGraphicScale;
    [PropertyKey.kPropertySource] : string;
}

/**
 * @ignore
 */
export class VectorGraphic extends ActionableComponent<IVectorGraphicProperties> {
    public static readonly SVG_NS : string = 'http://www.w3.org/2000/svg';
    private graphic : APL.Graphic;
    private svg : SVGElement;
    private vectorGraphicUpdater : VectorGraphicElementUpdater;

    constructor(renderer : APLRenderer,
                component : APL.Component,
                factory : FactoryFunction,
                vectorGraphicUpdater : VectorGraphicElementUpdater,
                parent? : Component) {
        super(renderer, component, factory, parent);
        this.svg = document.createElementNS(VectorGraphic.SVG_NS, 'svg') as SVGElement;
        this.container.appendChild(this.svg);
        this.$container.css('overflow', 'hidden');
        this.vectorGraphicUpdater = vectorGraphicUpdater;
    }

    public async setProperties(props : IVectorGraphicProperties) {
        super.setProperties(props);
        this.graphic = this.component.getCalculatedByKey<APL.Graphic>(PropertyKey.kPropertyGraphic);

        if (!this.graphic) {
            const source = this.component.getCalculatedByKey<string>(PropertyKey.kPropertySource);
            const json = await this.renderer.onRequestGraphic(source);
            if (!json || !this.component.updateGraphic(json)) {
                this.logger.warn(`Invalid graphic at source ${source}`);
            }
            return;
        }
        const root = this.graphic.getRoot();
        this.vectorGraphicUpdater.updateElements(root, this.svg, this.graphic.getDirty());
        this.initSvg(root);
    }

    private initSvg(root : APL.GraphicElement) {
        const height = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyHeightActual);
        const width = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyWidthActual);

        const vph = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyViewportHeightActual);
        const vpw = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyViewportWidthActual);

        this.svg.setAttributeNS('', 'viewBox', `0 0 ${vpw} ${vph}`);
        const innerBounds = this.component.getCalculatedByKey<APL.Rect>(PropertyKey.kPropertyInnerBounds);
        const scaleX = width / vpw;
        const scaleY = height / vph;

        $(this.svg).css({
            display: 'inline-block',
            height: vph,
            left: innerBounds.left,
            position: 'absolute',
            top: innerBounds.top,
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
            width: vpw
        });
    }
}
