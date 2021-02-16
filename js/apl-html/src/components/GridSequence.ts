/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import APLRenderer from '../APLRenderer';
import { Component, FactoryFunction } from './Component';
import { MultiChildScrollable } from './MultiChildScrollable';

/**
 * @ignore
 */
export class GridSequence extends MultiChildScrollable {

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
    }

    protected setDisplay = () => {
        this.$container.css({display : 'grid'});
    }
}
