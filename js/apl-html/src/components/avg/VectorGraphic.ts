/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import { GraphicElementType } from '../../enums/GraphicElementType';
import { GraphicPropertyKey } from '../../enums/GraphicPropertyKey';
import { PropertyKey } from '../../enums/PropertyKey';
import { VectorGraphicAlign } from '../../enums/VectorGraphicAlign';
import { VectorGraphicScale } from '../../enums/VectorGraphicScale';
import { Component, FactoryFunction, IComponentProperties } from '../Component';
import { AVG } from './AVG';
import { Group } from './Group';
import { Path } from './Path';
import { AVGText } from './AVGText';
import { TouchableComponent } from '../TouchableComponent';
import { SpatialNavigation } from '../../utils/SpatialNavigation';

export { AVG } from './AVG';
export { Group } from './Group';
export { Path } from './Path';
export { AVGText } from './AVGText';
export { Patterns } from './Patterns';

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
export class VectorGraphic extends TouchableComponent<IVectorGraphicProperties> {
    public static readonly SVG_NS : string = 'http://www.w3.org/2000/svg';

    public elements : AVG[] = [];
    private graphic : APL.Graphic;
    private svg : SVGElement;

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.svg = document.createElementNS(VectorGraphic.SVG_NS, 'svg') as SVGElement;
        this.container.appendChild(this.svg);
        this.$container.css('overflow', 'hidden');

        // SpatialNavigation enabled device is controlled by D-pad. VH has specific listeners through pointer-events.
        // only allow pointer-events if VG is focusable/touchable element.

        if (!SpatialNavigation.enabled()
            || !this.component.getCalculatedByKey<boolean>(PropertyKey.kPropertyFocusable)) {
            // allow the pointer events pass underneath of SVG layer. otherwise will be blocked by SVG.
            this.$container.css('pointer-events', 'none');
        }
    }

    public async setProperties(props : IVectorGraphicProperties) {
        super.setProperties(props);
        $(this.svg).empty();

        // dirty. For now this is the only use case where a VectorComponent will have
        // a dirty property. This logic will need to be updated once those properties become
        // dynamic.
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
        if (root && root.getType() === GraphicElementType.kGraphicElementTypeContainer) {
            this.elements.length = 0;
            for (let i = 0; i < root.getChildCount(); i++) {
                const child = root.getChildAt(i);
                if (child.getType() === GraphicElementType.kGraphicElementTypeGroup) {
                    const element = new Group(child, this.svg, this.logger);
                    this.elements.push(element);
                } else if (child.getType() === GraphicElementType.kGraphicElementTypePath) {
                    const element = new Path(child, this.svg, this.logger);
                    this.elements.push(element);
                } else if (child.getType() === GraphicElementType.kGraphicElementTypeText) {
                    const element = new AVGText(child, this.svg, this.logger);
                    this.elements.push(element);
                }
            }
        } else {
            return;
        }
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

        for (const element of this.elements) {
            element.setAllProperties();
        }
    }
}
