/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import { GraphicLayoutDirection } from '../../enums/GraphicLayoutDirection';
import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { PropertyKey } from '../../enums/PropertyKey';
import { VectorGraphicScale } from '../../enums/VectorGraphicScale';
import { IURLRequest, parseHeaders, toUrlRequest } from '../../media/IURLRequest';

import { ActionableComponent } from '../ActionableComponent';
import { Component, FactoryFunction, IComponentProperties } from '../Component';
import { VectorGraphicElementUpdater } from './VectorGraphicElementUpdater';

const SUPPORTED_GRAPHIC_LAYOUT_DIRECTIONS = {
    [GraphicLayoutDirection.kGraphicLayoutDirectionLTR]: 'ltr',
    [GraphicLayoutDirection.kGraphicLayoutDirectionRTL]: 'rtl'
};

export interface IVectorGraphicProperties extends IComponentProperties {
    [PropertyKey.kPropertyGraphic]: APL.Graphic;
    [PropertyKey.kPropertyMediaBounds]: APL.Rect;
    [PropertyKey.kPropertyScale]: VectorGraphicScale;
    [PropertyKey.kPropertySource]: string;
}

const defaultHeaders = new Headers({
    'Accept': 'application/json',
    'Content-Type': 'application/json'
});

export function extractVectorGraphicFromResponse(response: Response): Promise<string> {
    return response.text();
}

/**
 * @ignore
 */
export class VectorGraphic extends ActionableComponent<IVectorGraphicProperties> {
    public static readonly SVG_NS: string = 'http://www.w3.org/2000/svg';
    private graphic: APL.Graphic;
    private readonly svg: SVGElement;
    private vectorGraphicUpdater: VectorGraphicElementUpdater;

    constructor(renderer: APLRenderer,
                component: APL.Component,
                factory: FactoryFunction,
                vectorGraphicUpdater: VectorGraphicElementUpdater,
                parent?: Component) {
        super(renderer, component, factory, parent);
        this.svg = document.createElementNS(VectorGraphic.SVG_NS, 'svg') as SVGElement;
        this.container.appendChild(this.svg);
        this.vectorGraphicUpdater = vectorGraphicUpdater;
    }

    public async setProperties(props: IVectorGraphicProperties) {
        super.setProperties(props);
        this.graphic = this.component.getCalculatedByKey<APL.Graphic>(PropertyKey.kPropertyGraphic);

        if (!this.graphic) {
            const source = this.component.getCalculatedByKey<string | IURLRequest>(PropertyKey.kPropertySource);
            const urlRequest = toUrlRequest(source);
            const headers = parseHeaders(urlRequest.headers);

            defaultHeaders.forEach((value, key) => headers.append(key, value));
            const json = await this.renderer.onRequestGraphic(urlRequest.url, parseHeaders(urlRequest.headers));
            if (!json || !this.component.updateGraphic(json)) {
                this.logger.warn(`Invalid graphic at source ${urlRequest.url}`);
            }
            return;
        }
        const root: APL.GraphicElement = this.graphic.getRoot();
        this.initSvg(root);
        this.vectorGraphicUpdater.updateElementsWithArgs({
            root,
            parentElement: this.svg,
            dirty: this.graphic.getDirty(),
            lang: this.container.lang
        });
    }

    private initSvg(root: APL.GraphicElement) {
        const lang = root.getValue<string>(GraphicPropertyKey.kGraphicPropertyLang);
        if (lang) {
            this.container.lang = lang;
        }
        const height = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyHeightActual);
        const width = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyWidthActual);

        const vph = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyViewportHeightActual);
        const vpw = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyViewportWidthActual);

        const layoutDirection = root.getValue<number>(GraphicPropertyKey.kGraphicPropertyLayoutDirection);

        this.svg.setAttributeNS('', 'viewBox', `0 0 ${vpw} ${vph}`);
        this.svg.setAttributeNS('', 'width', `${vpw}`);
        this.svg.setAttributeNS('', 'height', `${vph}`);

        const innerBounds = this.getInnerBounds();
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
            width: vpw,
            direction: SUPPORTED_GRAPHIC_LAYOUT_DIRECTIONS[layoutDirection]
        });
    }

    private getInnerBounds(): APL.Rect {
        let innerBounds = this.component.getCalculatedByKey<APL.Rect>(PropertyKey.kPropertyMediaBounds);
        if (innerBounds === undefined) {
            innerBounds = this.component.getCalculatedByKey<APL.Rect>(PropertyKey.kPropertyInnerBounds);
        }
        return innerBounds;
    }
}
