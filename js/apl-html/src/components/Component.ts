/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter = require('eventemitter3');
import * as $ from 'jquery';
import APLRenderer, {IAPLOptions} from '../APLRenderer';
import {ComponentType} from '../enums/ComponentType';
import {Display} from '../enums/Display';
import {FocusDirection} from '../enums/FocusDirection';
import {GradientSpreadMethod} from '../enums/GradientSpreadMethod';
import {GradientUnits} from '../enums/GradientUnits';
import {LayoutDirection} from '../enums/LayoutDirection';
import {PropertyKey} from '../enums/PropertyKey';
import {UpdateType} from '../enums/UpdateType';
import {ILogger} from '../logging/ILogger';
import {LoggerFactory} from '../logging/LoggerFactory';
import {getRectDifference} from '../utils/AplRectUtils';
import {numberToColor} from '../utils/ColorUtils';
import {ChildAction} from '../utils/Constant';
import {getScaledTransform} from '../utils/TransformUtils';
import {fillAndStrokeConverter} from './avg/GraphicsUtils';
import {createBoundsFitter} from './helpers/BoundsFitter';
import {applyAplRectToStyle, applyPaddingToStyle} from './helpers/StylesUtil';

/**
 * @ignore
 */
const COMPONENT_TYPE_MAP = {
    [ComponentType.kComponentTypeContainer]: 'Container',
    [ComponentType.kComponentTypeEditText]: 'EditText',
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

const SUPPORTED_LAYOUT_DIRECTIONS = {
    [LayoutDirection.kLayoutDirectionLTR]: 'ltr',
    [LayoutDirection.kLayoutDirectionRTL]: 'rtl'
};

const LEGACY_CLIPPING_COMPONENTS_SET = new Set([
    ComponentType.kComponentTypeFrame,
    ComponentType.kComponentTypePager,
    ComponentType.kComponentTypeScrollView,
    ComponentType.kComponentTypeSequence,
    ComponentType.kComponentTypeGridSequence
]);

const NO_CLIPPING_COMPONENTS_SET = new Set([
    ComponentType.kComponentTypeEditText,
    ComponentType.kComponentTypeImage,
    ComponentType.kComponentTypeText,
    ComponentType.kComponentTypeTouchWrapper,
    ComponentType.kComponentTypeVideo
]);

export const SVG_NS = 'http://www.w3.org/2000/svg';
export const uuidv4 = require('uuid/v4');
export const IDENTITY_TRANSFORM = 'matrix(1.000000,0.000000,0.000000,1.000000,0.000000,0.000000)';

/**
 * @ignore
 */
export interface IGenericPropType {
    [key: number]: any;
}

/**
 * @ignore
 */
export interface IComponentProperties {
    [PropertyKey.kPropertyOpacity]: number;
    [PropertyKey.kPropertyBounds]: APL.Rect;
    [PropertyKey.kPropertyInnerBounds]: APL.Rect;
    [PropertyKey.kPropertyShadowHorizontalOffset]: number;
    [PropertyKey.kPropertyShadowVerticalOffset]: number;
    [PropertyKey.kPropertyShadowRadius]: number;
    [PropertyKey.kPropertyShadowColor]: number;
}

export interface IValueWithReference {
    value: string;
    reference?: Element;
}

/**
 * @ignore
 */
export type FactoryFunction = (renderer: APLRenderer, component: APL.Component,
                               parent?: Component, ensureLayout?: boolean,
                               insertAt?: number) => Component;

export type Executor = () => void;

export abstract class Component<PropsType = IGenericPropType> extends EventEmitter {
    /// Logger to be used for this component logs.
    protected logger: ILogger;

    public container: HTMLDivElement = document.createElement('div');

    /** @internal */
    public $container = $(this.container);

    /**
     * Array of children components in this hierarchy
     */
    public children: Component[] = [];

    /** Map of every property */
    public props: IGenericPropType = {};

    /** Absolute calculated bounds of this component */
    public bounds: APL.Rect;

    /** Absolute calculated inner bounds of this component */
    public innerBounds: APL.Rect;

    /** Display direction of this component */
    protected layoutDirection: LayoutDirection;

    /** Component unique ID */
    public id: string;

    /** User assigned ID */
    public assignedId: string;

    /** true us destroyed was called */
    protected isDestroyed: boolean = false;

    private doForceInvisible: boolean = false;

    /** Component state */
    protected state = {
        [UpdateType.kUpdatePagerPosition]: 0,
        [UpdateType.kUpdatePressState]: 0,
        [UpdateType.kUpdatePressed]: 0,
        [UpdateType.kUpdateScrollPosition]: 0,
        [UpdateType.kUpdateTakeFocus]: 0
    };

    protected executors: Map<PropertyKey, (props: PropsType) => void> =
        new Map<PropertyKey, (props: PropsType) => void>();

    /**
     * @param renderer The renderer instance
     * @param component The core component
     * @param factory Factory function to create new components
     * @param parent The parent component
     * @ignore
     */
    constructor(public renderer: APLRenderer, public component: APL.Component,
                protected factory: FactoryFunction, public parent?: Component) {
        super();
        this.logger = LoggerFactory.getLogger(COMPONENT_TYPE_MAP[component.getType()] || 'Component');
        this.$container.css({
            'position': 'absolute',
            'transform-origin': '0% 0%',
            '-webkit-box-sizing': 'border-box',
            '-moz-box-sizing': 'border-box',
            'box-sizing': 'border-box'
        });
        this.checkComponentTypeAndEnableClipping();
        this.id = component.getUniqueId();
        this.$container.attr('id', this.id);

        this.assignedId = component.getId();

        if (renderer) {
            renderer.componentMap[this.id] = this;
            renderer.componentIdMap[this.assignedId] = this;

            const options = renderer.options as IAPLOptions;
            if (options && options.developerToolOptions && options.developerToolOptions.includeComponentId) {
                this.$container.attr('data-componentid', component.getId());
            }
        }

        this.container.classList.add('apl-' + this.constructor.name.toLowerCase());

        this.parent = parent;

        this.propExecutor
        (this.setTransform, PropertyKey.kPropertyTransform)
        (this.setLayoutDirection, PropertyKey.kPropertyLayoutDirection)
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
        const displayedChildren = this.getDisplayedChildren();
        for (let i = 0; i < displayedChildren.length; i++) {
            const childComponent = displayedChildren[i];
            const child: Component = this.factory(this.renderer, childComponent, this);
            this.container.appendChild(child.container);
            this.children[i] = child;
        }

        const props = this.component.getCalculated() as PropsType;
        this.setProperties(props);
        this.sizeToFit();
        for (const child of this.children) {
            child.init();
        }
    }

    private ensureDisplayedChildren() {
        const newChildren = [];
        const displayedChildren = this.getDisplayedChildren();
        for (let i = 0; i < displayedChildren.length; i++) {
            const childComponent = displayedChildren[i];
            const childInflated =
                this.children.filter((existChild) => existChild.id === childComponent.getUniqueId()).shift();
            if (childInflated !== undefined) {
                newChildren[i] = childInflated;
            } else {
                newChildren[i] = this.factory(this.renderer, childComponent, this, true, i);
            }
        }
        // remove old child which are not displaying.
        this.children.forEach((exitChild) => {
            const isChildInDisplay = newChildren.some((displayedChild) => displayedChild.id === exitChild.id);
            if (!isChildInDisplay) {
                exitChild.destroy();
            }
        });
        this.children = newChildren;
    }

    /**
     * Get all displayed child count
     * @ignore
     */
    public getDisplayedChildCount(): number {
        return this.component.getDisplayedChildCount();
    }

    public getDisplayedChildren() {
        const displayedChildren: APL.Component[] = [];
        const childCount = this.component.getDisplayedChildCount();
        for (let i = 0; i < childCount; i++) {
            const childComponent: APL.Component = this.component.getDisplayedChildAt(i);
            displayedChildren.push(childComponent);
        }
        return displayedChildren;
    }

    protected onPropertiesUpdated(): void {
        // do nothing
    }

    /**
     * @param props
     * @ignore
     */
    public setProperties(props: PropsType) {

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
    public update(stateProp: UpdateType, value: number | string) {
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
    public destroy(destroyComponent: boolean = false) {
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
     * @Deprecated Use GraphicsUtils#numberToColor
     */
    public static numberToColor(val: number): string {
        return numberToColor(val);
    }

    public static getGradientSpreadMethod(gradientSpreadMethod: GradientSpreadMethod): string {
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

    public static getGradientUnits(gradientUnits: GradientUnits): string {
        switch (gradientUnits) {
            case GradientUnits.kGradientUnitsUserSpace:
                return 'userSpaceOnUse';
            case GradientUnits.kGradientUnitsBoundingBox:
            default:
                return 'objectBoundingBox';
        }
    }

    /**
     * @Deprecated Use GraphicsUtils#fillAndStrokeConverter
     */
    // tslint:disable-next-line:max-line-length
    public static fillAndStrokeConverter(value: object, transform: string, parent: Element, logger: ILogger): IValueWithReference | undefined {
        return fillAndStrokeConverter({
            value,
            transform,
            parent,
            logger
        });
    }

    public hasValidBounds(): boolean {
        return this.bounds.width > 0 && this.bounds.width < 1000000;
    }

    public static getClipPathElementId(pathData: string, parent: Element): string {
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

    public inflateAndAddChild(index: number, data: string): Component | undefined {
        const inflated = this.component.inflateChild(data, index);
        let child;
        if (inflated) {
            child = this.factory(this.renderer, inflated, this, true, index);
            this.children.splice(index, 0, child);
        }
        return child;
    }

    public remove(): boolean {
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

    protected isLayout(): boolean {
        return false;
    }

    /**
     * Resizes child component to fit parent component when applicable
     */
    private sizeToFit(): void {
        if (this.renderer && this.renderer.getLegacyClippingEnabled()) {
            return;
        }
        // adjust bounds
        const componentHasBounds = !!this.bounds;
        const componentHasParent = !!this.parent;
        const componentIsLtr = this.layoutDirection === LayoutDirection.kLayoutDirectionLTR;
        const canSizeToFit = componentHasBounds
            && componentHasParent
            && componentIsLtr;

        if (!canSizeToFit) {
            return;
        }

        const parentIsContainerComponent = this.parent.component.getType() === ComponentType.kComponentTypeContainer;
        const componentCanContainOtherItems = this.isLayout();
        const needsSizeToFit = parentIsContainerComponent
            && componentCanContainOtherItems;

        if (!needsSizeToFit) {
            return;
        }

        const boundsFitter = createBoundsFitter({
            containingBounds: this.parent.bounds,
            innerBounds: this.bounds,
            layoutDirection: this.layoutDirection
        });
        const fittedBounds = boundsFitter.fitBounds();

        const isFittedBoundsTheSame = fittedBounds === this.bounds;
        if (isFittedBoundsTheSame) {
            return;
        }

        const {
            width: fittedWidth,
            height: fittedHeight
        } = fittedBounds;

        const {
            width: oldWidth,
            height: oldHeight
        } = this.bounds;

        this.logger.warn(`Component ${this.id} has bounds that is bigger than parent bounds.\n`
            + `Check your template correctness.\n`
            + `Adjusting ${this.id} to parent ${this.parent.id}\n`
            + `WIDTH: ${oldWidth} => ${fittedWidth}\n`
            + `HEIGHT: ${oldHeight} => ${fittedHeight}\n`);

        const boundsDelta = getRectDifference(this.bounds, fittedBounds);
        this.bounds = fittedBounds;

        // Adjust inner bounds
        const canAdjustInnerBounds = !!this.innerBounds;

        if (!canAdjustInnerBounds) {
            return;
        }

        const innerBoundsNeedsAdjustment = this.innerBounds.width > this.bounds.width
            || this.innerBounds.height > this.bounds.height;

        if (innerBoundsNeedsAdjustment) {
            this.innerBounds = getRectDifference(this.innerBounds, boundsDelta);
        }

        // Apply new bounds
        applyAplRectToStyle({
            domElement: this.container,
            rectangle: this.bounds
        });

        applyPaddingToStyle({
            domElement: this.container,
            bounds: this.bounds,
            innerBounds: this.innerBounds
        });

        // bounds update
        this.boundsUpdated();
    }

    /** @deprecated Use SizeToFit
     * If parent is Container component and this component is layout components then limit size of child to
     * offset+size of parent to overcome broken skills
     */
    protected alignSize() {
        return this.sizeToFit();
    }

    protected propExecutor = (executor: () => void, ...props: PropertyKey[]) => {
        for (const prop of props) {
            this.executors.set(prop, (remaining: PropsType) => {
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

    protected getProperties(): PropsType {
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

    protected setLayoutDirection = () => {
        this.layoutDirection = this.props[PropertyKey.kPropertyLayoutDirection];

        if (!SUPPORTED_LAYOUT_DIRECTIONS.hasOwnProperty(this.layoutDirection)) {
            this.logger.warn(`Layout Direction ${this.layoutDirection} is not supported, defaulting to LTR`);
            this.layoutDirection = LayoutDirection.kLayoutDirectionLTR;
        }

        if (!this.parent || this.parent.layoutDirection !== this.layoutDirection) {
            this.container.dir = SUPPORTED_LAYOUT_DIRECTIONS[this.layoutDirection];
        }
    }

    protected isRtl = () => {
        return this.layoutDirection === LayoutDirection.kLayoutDirectionRTL;
    }

    public forceInvisible(doForceInvisible: boolean) {
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

        applyAplRectToStyle({
            domElement: this.container,
            rectangle: this.bounds
        });

        this.innerBounds = this.props[PropertyKey.kPropertyInnerBounds];
        applyPaddingToStyle({
            domElement: this.container,
            bounds: this.bounds,
            innerBounds: this.innerBounds
        });

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
                // empty by design
            } else if (child.action === ChildAction.Remove) {
                if (this.container.children[child.uid] !== undefined) {
                    this.container.children[child.uid].remove();
                }
            } else {
                this.logger.warn(`Invalid action type ${child.action} for child ${child.uid}`);
            }
        }
        this.ensureDisplayedChildren();
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

    protected applyCssShadow = (shadowParams: string) => {
        this.$container.css('box-shadow', shadowParams);
    }

    protected async takeFocus() {
        const focusableAreas = await this.renderer.context.getFocusableAreas();
        const myFocusableArea = focusableAreas[this.id];
        if (myFocusableArea) {
            this.renderer.context.setFocus(FocusDirection.kFocusDirectionNone, myFocusableArea, this.id);
        }
    }

    protected get lang(): string {
        const lang = this.props[PropertyKey.kPropertyLang];
        if (lang) {
            return lang;
        }
        return '';
    }

    /**
     * Enable clipping if version is <= 1.5 or if component is part the legacy-clipping set.
     * Never enable clipping for if component is part of the no-clipping set.
     *
     */
    private checkComponentTypeAndEnableClipping() {
        const componentType = this.component.getType();

        // Don't clip for these components
        if (NO_CLIPPING_COMPONENTS_SET.has(componentType)) {
            return;
        }

        const isParentLegacy = this.parent && LEGACY_CLIPPING_COMPONENTS_SET.has(this.parent.component.getType());
        const isLegacyComponentType: boolean = LEGACY_CLIPPING_COMPONENTS_SET.has(componentType);
        const isLegacyAplVersion: boolean = this.renderer && this.renderer.getLegacyClippingEnabled();

        if (isLegacyComponentType || isParentLegacy || !isLegacyAplVersion) {
            this.enableClipping();
        }
    }

    /**
     * Enable clipping
     */
    protected enableClipping() {
        this.$container.css('overflow', 'hidden');
    }
}
