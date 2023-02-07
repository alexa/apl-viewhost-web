/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from './APLRenderer';
import { VectorGraphic } from './components/avg/VectorGraphic';
import { VectorGraphicElementUpdater } from './components/avg/VectorGraphicElementUpdater';
import { Component, IGenericPropType } from './components/Component';
import { Container } from './components/Container';
import { EditText } from './components/EditText';
import { Frame } from './components/Frame';
import { GridSequence } from './components/GridSequence';
import { Image } from './components/Image';
import { NoOpComponent } from './components/NoOpComponent';
import { PagerComponent } from './components/pager/PagerComponent';
import { ScrollView } from './components/ScrollView';
import { Sequence } from './components/Sequence';
import { Text } from './components/text/Text';
import { TouchWrapper } from './components/TouchWrapper';
import { ComponentType } from './enums/ComponentType';

export const componentFactory = (renderer: APLRenderer, component: APL.Component,
                                 parent?: Component, ensureLayout: boolean = false,
                                 insertAt: number = -1 ): Component<IGenericPropType> => {
    const id = component.getUniqueId();
    let comp;
    if (renderer.componentMap[id]) {
        comp = renderer.componentMap[id];
        comp.parent = parent;
        if (ensureLayout && comp instanceof Text) {
            comp.setDimensions();
            if (parent) {
                if (insertAt >= 0 && parent.container.children.length > 0 &&
                    insertAt < parent.container.children.length) {
                    parent.container.insertBefore(comp.container, parent.container.children.item(insertAt));
                } else {
                    parent.container.appendChild(comp.container);
                }
            }
        }
        return comp;
    } else if (factoryMap[component.getType()]) {
        comp = factoryMap[component.getType()](renderer, component, parent);
    } else {
        // Any unknown component is effectively container
        comp = new Container(renderer, component, componentFactory, parent);
    }

    if (ensureLayout) {
        if (comp instanceof Text) {
            comp.init();
        }
        comp.component.ensureLayout();
        comp.init();
        if (parent) {
            if (insertAt >= 0 && parent.container.children.length > 0 &&
                insertAt < parent.container.children.length) {
                parent.container.insertBefore(comp.container, parent.container.children.item(insertAt));
            } else {
                parent.container.appendChild(comp.container);
            }
        }
    }

    return comp;
};

// tslint:disable:max-line-length
const factoryMap = {
    [ComponentType.kComponentTypeContainer]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new Container(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeEditText]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return  renderer.options.environment.disallowEditText ?
            new NoOpComponent(renderer, component, componentFactory, parent) :
            new EditText(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeFrame]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new Frame(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeImage]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new Image(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypePager]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new PagerComponent(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeScrollView]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new ScrollView(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeSequence]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new Sequence(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeGridSequence]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new GridSequence(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeText]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return new Text(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeTouchWrapper]: (renderer: APLRenderer, component: APL.Component,
                                                 parent?: Component) => {
        return new TouchWrapper(renderer, component, componentFactory, parent);
    },
    [ComponentType.kComponentTypeVideo]: (renderer: APLRenderer, component: APL.Component, parent?: Component) => {
        return  renderer.options.environment.disallowVideo ?
            new NoOpComponent(renderer, component, componentFactory, parent) :
            renderer.videoFactory.create(renderer, component, componentFactory, parent);
        },
    [ComponentType.kComponentTypeVectorGraphic]: (renderer: APLRenderer, component: APL.Component,
                                                  parent?: Component) => {
        return new VectorGraphic(renderer, component, componentFactory, new VectorGraphicElementUpdater(), parent);
    }
};
// tslint:enable:max-line-length
