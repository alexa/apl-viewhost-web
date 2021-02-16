/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import APLRenderer from '../APLRenderer';
import { PropertyKey } from '../enums/PropertyKey';
import { Component, FactoryFunction, IComponentProperties } from './Component';

/**
 * @ignore
 */
export interface IFrameProperties extends IComponentProperties {
    [PropertyKey.kPropertyBackgroundColor] : number;
    [PropertyKey.kPropertyBorderRadii] : APL.Radii;
    [PropertyKey.kPropertyBorderColor] : number;
    [PropertyKey.kPropertyBorderWidth] : number;
}

/**
 * @ignore
 */
export class Frame extends Component<IFrameProperties> {

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.$container.css({
            'border-style': 'solid',
            'overflow': 'hidden'
        });
        this.propExecutor
            (this.setBackgroundColor, PropertyKey.kPropertyBackgroundColor)
            (this.setBorderRadii, PropertyKey.kPropertyBorderRadii)
            (this.setBorderColor, PropertyKey.kPropertyBorderColor)
            (this.setBorderWidth, PropertyKey.kPropertyBorderWidth);
    }

    protected isLayout() : boolean {
        return true;
    }

    private setBackgroundColor = () => {
        this.$container.css('background-color',
            Component.numberToColor(this.props[PropertyKey.kPropertyBackgroundColor]));
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
        this.$container.css('border-width', this.props[PropertyKey.kPropertyBorderWidth]);
    }
}
