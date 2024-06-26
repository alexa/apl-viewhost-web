/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { PropertyKey } from '..';
import APLRenderer from '../APLRenderer';
import { getCssGradient } from '../utils/ImageUtils';
import { Component, FactoryFunction, IComponentProperties } from './Component';

export interface IHostProperties extends IComponentProperties {
    [PropertyKey.kPropertyBackground]: any;
}

export class Host extends Component<IHostProperties> {
    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);

        this.propExecutor
            (this.setBackground, PropertyKey.kPropertyBackground);
    }

    protected onPropertiesUpdated(): void {
        this.setBackground();
    }

    private setBackground = () => {
        const bg = this.component.getCalculated()[PropertyKey.kPropertyBackground];

        if (Number.isFinite(bg)) {
            this.$container.css('background-image', '');
            this.$container.css('background-color',
                Component.numberToColor(this.component.getCalculated()[PropertyKey.kPropertyBackground] as number));
        } else {
            this.$container.css('background-color', '');
            this.$container.css('background-image',
                getCssGradient(this.component.getCalculated()[PropertyKey.kPropertyBackground], this.logger));
        }
    }

}
