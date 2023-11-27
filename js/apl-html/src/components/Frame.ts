/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { PropertyKey } from '../enums/PropertyKey';
import { getCssGradient } from '../utils/ImageUtils';
import { Component, FactoryFunction, IComponentProperties } from './Component';

/**
 * @ignore
 */
export interface IFrameProperties extends IComponentProperties {
    [PropertyKey.kPropertyBackground]: any;
    [PropertyKey.kPropertyBorderRadii]: APL.Radii;
    [PropertyKey.kPropertyBorderColor]: number;
    [PropertyKey.kPropertyDrawnBorderWidth]: number;
}

/**
 * @ignore
 */
export class Frame extends Component<IFrameProperties> {

    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
        this.$container.css({
            'border-style': 'solid',
            'background-clip': 'padding-box'
        });
        this.propExecutor
            (this.setBackground, PropertyKey.kPropertyBackground)
            (this.setBorderRadii, PropertyKey.kPropertyBorderRadii)
            (this.setBorderColor, PropertyKey.kPropertyBorderColor)
            (this.setBorderWidth, PropertyKey.kPropertyDrawnBorderWidth);
    }

    protected isLayout(): boolean {
        return true;
    }

    private setBackground = () => {
        const bg = this.props[PropertyKey.kPropertyBackground];
        if (Number.isFinite(bg)) {
            this.$container.css('background-image', '');
            this.$container.css('background-color',
                Component.numberToColor(this.props[PropertyKey.kPropertyBackground] as number));
        } else {
            this.$container.css('background-color', '');
            this.$container.css('background-image',
                getCssGradient(this.props[PropertyKey.kPropertyBackground], this.logger));
        }
    }

    private setBorderRadii = () => {
        const radii = this.props[PropertyKey.kPropertyBorderRadii];
        this.$container.css('border-top-left-radius', radii.topLeft());
        this.$container.css('border-top-right-radius', radii.topRight());
        this.$container.css('border-bottom-right-radius', radii.bottomRight());
        this.$container.css('border-bottom-left-radius', radii.bottomLeft());
    }

    private setBorderColor = () => {
        this.$container.css('border-color', Component.numberToColor(this.props[PropertyKey.kPropertyBorderColor]));
    }

    private setBorderWidth = () => {
        this.$container.css('border-width', this.props[PropertyKey.kPropertyDrawnBorderWidth]);
    }
}
