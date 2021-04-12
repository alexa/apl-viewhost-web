/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter = require('eventemitter3');
import * as $ from 'jquery';
import APLRenderer from '../APLRenderer';
import { Display } from '../enums/Display';
import { PropertyKey } from '../enums/PropertyKey';
import { UpdateType } from '../enums/UpdateType';
import { ComponentType } from '../enums/ComponentType';
import { LoggerFactory } from '../logging/LoggerFactory';
import { ILogger } from '../logging/ILogger';
import { getScaledTransform } from '../utils/TransformUtils';
import { GradientSpreadMethod } from '../enums/GradientSpreadMethod';
import { ChildAction } from '../utils/Constant';
import { GradientUnits } from '../enums/GradientUnits';
import { createGradientElement, IAVGGradient } from './avg/Gradient';
import { createPatternElement } from './avg/Patterns';
import {FocusDirection} from '../enums/FocusDirection';

/**
 * @ignore
 */
const COMPONENT_TYPE_MAP = {
    [ComponentType.kComponentTypeContainer]: 'Container',
    [ComponentType.kComponentTypeFrame]: 'Frame',
    [ComponentType.kComponentTypeImage]: 'Image',
    [ComponentType.kComponentTypePager]: 'Pager',
    [ComponentType.kComponentTypeScrollView]: 'ScrollView',
    [ComponentType.kComponentTypeSequence]: 'Sequence',
    [ComponentType.kComponentTypeGridSequence]: 'GridSequence',
    [ComponentType.kComponentTypeText]: 'Text',
    [ComponentType.kComponentTypeTouchWrapper]: 'TouchWrapper',
    [ComponentType.kComponentTypeVideo]: 'Video',
    [ComponentType.kComponentTypeVectorGraphic]: 'VectorGraphic'
};

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const uuidv4 = require('uuid/v4');
export const IDENTITY_TRANSFORM = 'matrix(1.000000,0.000000,0.000000,1.000000,0.000000,0.000000)';
/**
 * @ignore
 */
export interface IGenericPropType {
    [key : number] : any;
}

export const copyAsPixels = (from : any, to : HTMLElement, propertyName : string) => {
    to.style[propertyName] = `${from[propertyName]}px`;
};

export const fitElementToRectangle = (element : HTMLElement, rectangle : APL.Rect) => {

    ['top', 'left' , 'width', 'height'].forEach((propertyName) => copyAsPixels(rectangle, element, propertyName));
};

/**
 * @ignore
 */
export interface IComponentProperties {
    [PropertyKey.kPropertyOpacity] : number;
    [PropertyKey.kPropertyBounds] : APL.Rect;
    [PropertyKey.kPropertyInnerBounds] : APL.Rect;
    [PropertyKey.kPropertyShadowHorizontalOffset] : number;
    [PropertyKey.kPropertyShadowVerticalOffset] : number;
    [PropertyKey.kPropertyShadowRadius] : number;
    [PropertyKey.kPropertyShadowColor] : number;
}

export interface IValueWithReference {
    value : string;
    reference? : Element;
}

/**
 * @ignore
 */
export type FactoryFunction = (renderer : APLRenderer, component : APL.Component,
                               parent? : Component, ensureLayout? : boolean,
                               insertAt? : number) => Component;

export type Executor = () => void;

export abstract class Component<PropsType = IGenericPropType> extends EventEmitter {
    /// Logger to be used for this component logs.
    protected logger : ILogger;

    public container : HTMLDivElement = document.createElement('div');

    /** @internal */
    public $container = $(this.container);

    /**
     * Array of children components in this hierarchy
     */
    public children : Component[] = [];

    /** Map of every property */
    public props : IGenericPropType = {};

    /** Absolute calculated bounds of this component */
    public bounds : APL.Rect;

    /** Absolute calculated inner bounds of this component */
    public innerBounds : APL.Rect;

    /** Component unique ID */
    public id : string;

    /** User assigned ID */
    public assignedId : string;

    /** true us destroyed was called */
    protected isDestroyed : boolean = false;

    private doForceInvisible : boolean = false;

    /** Component state */
    protected state = {
        [UpdateType.kUpdatePagerPosition]: 0,
        [UpdateType.kUpdatePressState]: 0,
        [UpdateType.kUpdatePressed]: 0,
        [UpdateType.kUpdateScrollPosition]: 0,
        [UpdateType.kUpdateTakeFocus]: 0
    };

    protected executors : Map<PropertyKey, (props : PropsType) => void> =
        new Map<PropertyKey, (props : PropsType) => void>();

    /**
     * @param renderer The renderer instance
     * @param component The core component
     * @param factory Factory function to create new components
     * @param parent The parent component
     * @ignore
     */
    constructor(public renderer : APLRenderer, public component : APL.Component,
                protected factory : FactoryFunction, public parent? : Component) {
        super();
        this.logger = LoggerFactory.getLogger(COMPONENT_TYPE_MAP[component.getType()] || 'Component');
        this.$container.css({
            'position': 'absolute',
            'transform-origin': '0% 0%',
            '-webkit-box-sizing': 'border-box',
            '-moz-box-sizing': 'border-box',
            'box-sizing': 'border-box'
        });
        this.id = component.getUniqueId();
        this.$container.attr('id', this.id);
        this.assignedId = component.getId();

        if (renderer) {
          renderer.componentMap[this.id] = this;
          renderer.componentIdMap[this.assignedId] = this;
        }

        this.container.classList.add('apl-' + this.constructor.name.toLowerCase());

        this.parent = parent;

        this.propExecutor
            (this.setTransform, PropertyKey.kPropertyTransform)
            (this.setBoundsAndDisplay, PropertyKey.kPropertyBounds, PropertyKey.kPropertyInnerBounds,
                PropertyKey.kPropertyDisplay)
            (this.setOpacity, PropertyKey.kPropertyOpacity)
            (this.setUserProperties, PropertyKey.kPropertyUser)
            (this.handleComponentChildrenChange, PropertyKey.kPropertyNotifyChildrenChanged)
            (this.setShadow,
                PropertyKey.kPropertyShadowHorizontalOffset,
                PropertyKey.kPropertyShadowVerticalOffset,
                PropertyKey.kPropertyShadowRadius,
                PropertyKey.kPropertyShadowColor);
    }

    /**
     * Creates all child components and initialized all calculated properties
     * @ignore
     */
    public init() {
        const children = this.component.getChildCount();
        for (let i = 0; i < children; i++) {
            const childComponent = this.component.getChildAt(i);
            const child : Component = this.factory(this.renderer, childComponent, this);
            this.container.appendChild(child.container);
            this.children[i] = child;
        }

        const props = this.component.getCalculated() as PropsType;
        this.setProperties(props);
        this.alignSize();
        for (const child of this.children) {
            child.init();
        }
    }

    /**
     * Get all displayed child count
     * @ignore
     */
    public async getDisplayedChildCount() : Promise<number> {
        return this.component.getDisplayedChildCount();
    }

    protected onPropertiesUpdated() : void {
      // do nothing
    }

    /**
     * @param props
     * @ignore
     */
    public setProperties(props : PropsType) {
        Object.keys(props).forEach((keyString) => {
            const key = parseInt(keyString, 10) as PropertyKey;
            this.props[key] = props[key];
        });
        Object.keys(props).forEach((keyString) => {
            const key = parseInt(keyString, 10) as PropertyKey;
            if (key in props) {
                const executor = this.executors.get(key);
                if (executor) {
                    executor(props);
                }
            }
        });
        this.onPropertiesUpdated();
    }

    /**
     * Will update the view with any dirty properties
     * @ignore
     */
    public updateDirtyProps() {
        const props = this.component.getDirtyProps();
        this.setProperties(props as PropsType);
    }

    /**
     * Call this to set the state of this component and any components
     * that inherit state from it.
     * @param stateProp
     * @param value
     */
    public update(stateProp : UpdateType, value : number | string) {
        if (typeof value === 'string') {
            this.state[stateProp] = value.toString();
            this.component.updateEditText(stateProp, value.toString());
        } else {
            this.state[stateProp] = value;
            this.component.update(stateProp, value);
        }
    }

    /**
     * Destroys and cleans up this instance
     */
    public destroy(destroyComponent : boolean = false) {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        this.isDestroyed = true;
        this.parent = undefined;
        delete this.renderer.componentMap[this.id];
        delete this.renderer.componentMap[this.assignedId];
        (this.renderer as any) = undefined;
        for (const child of this.children) {
            child.destroy(destroyComponent);
        }
        (this.children as any) = undefined;
        if (destroyComponent) {
            this.component.delete();
            (this.component as any) = undefined;
        }
    }

    /**
     * Converts a number to css rgba format
     * @param val Number value to convert
     */
    public static numberToColor(val : number) : string {
        const a = (0xFF & val) / 0xFF;
        const b = 0xFF & (val >> 8);
        const g = 0xFF & (val >> 16);
        const r = 0xFF & (val >> 24);

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    public static getGradientSpreadMethod(gradientSpreadMethod : GradientSpreadMethod) : string {
        switch (gradientSpreadMethod) {
            case GradientSpreadMethod.REFLECT:
                return 'reflect';
            case GradientSpreadMethod.REPEAT:
                return 'repeat';
            case GradientSpreadMethod.PAD:
            default:
                return 'pad';
        }
    }

    public static getGradientUnits(gradientUnits : GradientUnits) : string {
        switch (gradientUnits) {
            case GradientUnits.kGradientUnitsUserSpace:
                return 'userSpaceOnUse';
            case GradientUnits.kGradientUnitsBoundingBox:
            default:
                return 'objectBoundingBox';
        }
    }
    /*
     * Converts to Color if input is number otherwise create Gradient or Pattern element.
     * @param val Object value which could be either Color, Gradient or Pattern
     * @param parent the parent element
     * @param logger logger for console output
     */
    public static fillAndStrokeConverter(val : object, transform : string, parent : Element, logger : ILogger)
        : IValueWithReference | undefined {
        if (typeof val === 'number') {
            return {
                value: this.numberToColor(val)
            };
        }
        if ((val as IAVGGradient).type !== undefined) {
            return createGradientElement(val as IAVGGradient, transform, parent, logger);
        } else if ((val as APL.GraphicPattern).getId()) {
            return createPatternElement(val as APL.GraphicPattern, transform, parent, logger);
        }
        // non-supported type
        logger.warn('Type is not supported yet.');
        return undefined;
    }

    public hasValidBounds() : boolean {
        return this.bounds.width > 0 && this.bounds.width < 1000000;
    }

    public static getClipPathElementId(pathData : string, parent : Element) : string {
        if (!pathData || pathData === '') {
            return '';
        }
        const defs = document.createElementNS(SVG_NS, 'defs');
        const clipPathElement = document.createElementNS(SVG_NS, 'clipPath');
        const pathElement = document.createElementNS(SVG_NS, 'path');
        const clipPathElementId = uuidv4().toString();
        clipPathElement.setAttributeNS('', 'id', clipPathElementId);
        pathElement.setAttributeNS('', 'd', pathData.toString());
        clipPathElement.appendChild(pathElement);
        defs.appendChild(clipPathElement);
        parent.appendChild(defs);
        return `url('#${clipPathElementId}')`;
    }

    public inflateAndAddChild(index : number, data : string) : Component | undefined {
        const inflated = this.component.inflateChild(data, index);
        let child;
        if (inflated) {
            child = this.factory(this.renderer, inflated, this, true, index);
            this.children.splice(index, 0, child);
        }
        return child;
    }

    public remove() : boolean {
        if (this.component.remove()) {
            if (this.parent && this.parent.children) {
                this.parent.children.splice(this.parent.children.indexOf(this), 1);
            }
            this.destroy(true);
            return true;
        }
        return false;
    }

    protected boundsUpdated() {
        // do nothing
    }

    protected isLayout() : boolean {
        return false;
    }

    /**
     * If parent is Container component and this component is layout components then limit size of child to
     * offset+size of parent to overcome broken skills
     */
    protected alignSize() {
        if (!this.bounds) {
            return;
        }
        let width = this.bounds.width;
        let height = this.bounds.height;

        if (this.parent && this.parent.component.getType() === ComponentType.kComponentTypeContainer && this.isLayout()
            && (this.bounds.width + this.bounds.left > this.parent.bounds.width
                || this.bounds.height + this.bounds.top > this.parent.bounds.height)) {
            width = Math.min(this.parent.bounds.width - this.bounds.left, this.bounds.width);
            height = Math.min(this.parent.bounds.height - this.bounds.top, this.bounds.height);
            this.logger.warn(`Component ${this.id} has bounds that is bigger than parent bounds.\n`
                + `Check your template correctness.\n`
                + `Adjusting ${this.id} to parent ${this.parent.id}\n`
                + `WIDTH: ${this.bounds.width} => ${width}\n`
                + `HEIGHT: ${this.bounds.height} => ${height}`);

            this.bounds = {
                left: this.bounds.left,
                top: this.bounds.top,
                width,
                height
            };
        } else {
            return;
        }

        if (!this.innerBounds) {
            return;
        }

        if (this.innerBounds.width > this.bounds.width || this.innerBounds.height > this.bounds.height) {
            const widthDiff = this.bounds.width - width;
            const heightDiff = this.bounds.height - height;
            this.innerBounds = {
                left: this.innerBounds.left,
                top: this.innerBounds.top,
                width: this.innerBounds.width - widthDiff,
                height: this.innerBounds.height - heightDiff
            };
        }

        this.$container.css('width', width);
        this.$container.css('height', height);
        this.$container.css('padding-left', this.innerBounds.left);
        this.$container.css('padding-right', width - this.innerBounds.left - this.innerBounds.width);
        this.$container.css('padding-top', this.innerBounds.top);
        this.$container.css('padding-bottom', height - this.innerBounds.top - this.innerBounds.height);

        this.boundsUpdated();
    }

    protected propExecutor = (executor : () => void, ...props : PropertyKey[]) => {
        for (const prop of props) {
            this.executors.set(prop, (remaining : PropsType) => {
                const keys = Object.keys(props);
                for (const keyString of keys) {
                    const key = parseInt(keyString, 10) as PropertyKey;
                    delete remaining[key];
                }
                executor();
            });
        }
        return this.propExecutor;
    }

    protected getProperties() : PropsType {
        return this.component.getCalculated() as PropsType;
    }

    protected setTransform = () => {
        if (this.renderer) {
            const scale = this.renderer.context.getScaleFactor();
            const transform = getScaledTransform(this.props[PropertyKey.kPropertyTransform], scale);
            this.$container.css({transform});
        }
    }

    protected setOpacity = () => {
        this.$container.css('opacity', this.props[PropertyKey.kPropertyOpacity]);
    }

    public forceInvisible(doForceInvisible : boolean) {
        if (this.doForceInvisible !== doForceInvisible) {
            this.doForceInvisible = doForceInvisible;
            this.setDisplay();
        }
    }

    protected getNormalDisplay() {
        return '';
    }

    protected setDisplay = () => {
        let display = this.props[PropertyKey.kPropertyDisplay] as Display;
        if (!this.hasValidBounds() || this.doForceInvisible) {
            display = Display.kDisplayInvisible;
        }
        switch (display) {
            case Display.kDisplayInvisible:
            case Display.kDisplayNone:
                this.$container.css({display: 'none'});
                break;
            case Display.kDisplayNormal:
                this.$container.css({display: this.getNormalDisplay()});
                break;
            default:
                this.logger.warn(`Incorrect display type: ${display}`);
                break;
        }
    }

    protected setBoundsAndDisplay = () => {
        this.bounds = this.props[PropertyKey.kPropertyBounds];
        if (!this.bounds) {
            return;
        }
        this.setDisplay();
        // html takes an element's parent's border width into account when determining
        // its childrens' origin, but core does not. So here we need to offet by
        // the border width of its parent. Frame is the only component that uses
        // border width css property.
        let offsetTop = 0;
        let offsetLeft = 0;
        if (this.parent && this.parent.component.getType() === ComponentType.kComponentTypeFrame) {
            const frame = this.parent.component;
            const borderWidth = frame.getCalculatedByKey<number>(PropertyKey.kPropertyBorderWidth);
            offsetTop -= borderWidth;
            offsetLeft -= borderWidth;
        }

        this.bounds = {
            top: this.bounds.top + offsetTop,
            left: this.bounds.left + offsetLeft,
            height: this.bounds.height,
            width: this.bounds.width
        };

        for (const child of this.children) {
            child.setBoundsAndDisplay();
        }
        fitElementToRectangle(this.container, this.bounds);
        this.innerBounds = this.props[PropertyKey.kPropertyInnerBounds];
        this.$container.css('padding-left', this.innerBounds.left);
        this.$container.css('padding-right', this.bounds.width - this.innerBounds.left - this.innerBounds.width);
        this.$container.css('padding-top', this.innerBounds.top);
        this.$container.css('padding-bottom', this.bounds.height - this.innerBounds.top - this.innerBounds.height);

        this.boundsUpdated();
    }

    protected setUserProperties = () => {
        if (!this.renderer) {
          return;
        }
        const options = this.renderer.getDeveloperToolOptions();
        if (!options) {
          return;
        }

        const userProperties = this.props[PropertyKey.kPropertyUser];

        const id = options.mappingKey;
        if (id) {
            if (userProperties.hasOwnProperty(id)) {
                const uniqueKey = userProperties[id] + this.id;
                this.renderer.componentByMappingKey.set(uniqueKey, this);
            }
        }

        const writeKeys = options.writeKeys;
        if (writeKeys && Array.isArray(writeKeys)) {
          for (const key of writeKeys) {
            if (userProperties.hasOwnProperty(key)) {
              this.container.setAttribute(['data', key].join('-'), userProperties[key]);
            }
          }
        }
    }

    protected handleComponentChildrenChange = () => {
        for (const child of this.props[PropertyKey.kPropertyNotifyChildrenChanged]) {
            if (child.action === ChildAction.Insert) {
                this.factory(this.renderer, this.component.getChildAt(child.index), this, true, child.index);
            } else if (child.action === ChildAction.Remove) {
                if (this.container.children[child.uid] !== undefined) {
                    this.container.children[child.uid].remove();
                }
            } else {
                this.logger.warn(`Invalid action type ${child.action} for child ${child.uid}`);
            }
        }
    }

    protected getCssShadow = () => {
        const offsetX = this.props[PropertyKey.kPropertyShadowHorizontalOffset];
        const offsetY = this.props[PropertyKey.kPropertyShadowVerticalOffset];
        const blurRadius = this.props[PropertyKey.kPropertyShadowRadius];
        const color = Component.numberToColor(this.props[PropertyKey.kPropertyShadowColor]);
        return `${offsetX}px ${offsetY}px ${blurRadius}px ${color}`;
    }

    private setShadow = () => {
        this.applyCssShadow(this.getCssShadow());
    }

    protected applyCssShadow = (shadowParams : string) => {
        this.$container.css('box-shadow', shadowParams);
    }
    protected async takeFocus() {
        const focusableAreas = await this.renderer.context.getFocusableAreas();
        const myFocusableArea = focusableAreas[this.id];
        if (myFocusableArea) {
            this.renderer.context.setFocus(FocusDirection.kFocusDirectionNone, myFocusableArea, this.id);
        }
    }
}
