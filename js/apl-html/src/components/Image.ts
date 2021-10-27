/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { FilterType } from '../enums/FilterType';
import { ImageAlign } from '../enums/ImageAlign';
import { ImageScale } from '../enums/ImageScale';
import { PropertyKey } from '../enums/PropertyKey';
import { arrayEquals, last } from '../utils/ArrayUtils';
import { numberToColor } from '../utils/ColorUtils';
import { createSVGImageFiltersApplier, Filter } from '../utils/FilterUtils';
import {
    loadAllImagesFromMediaSource
} from '../utils/ImageRetrievalUtils';
import {
    createCanvasScaledImageProcessor,
    createScaledImageProcessor,
    getCssGradient,
    IGradient,
    ImageDimensions, ScaledImageSource
} from '../utils/ImageUtils';
import { isSomething, Maybe, Nothing } from '../utils/Maybe';
import { Component, FactoryFunction, IComponentProperties, SVG_NS, uuidv4 } from './Component';
import { createAligner } from './helpers/ImageAligner';
import { createStylesApplier, CssUnitType, ElementType } from './helpers/StylesApplier';

/**
 * @ignore
 */
export interface IImageProperties extends IComponentProperties {
    [PropertyKey.kPropertySource]: string | string [];
    [PropertyKey.kPropertyAlign]: ImageAlign;
    [PropertyKey.kPropertyBorderRadius]: number;
    [PropertyKey.kPropertyBorderWidth]: number;
    [PropertyKey.kPropertyOverlayColor]: number;
    [PropertyKey.kPropertyBorderColor]: number;
    [PropertyKey.kPropertyFilters]: Filter[];
    [PropertyKey.kPropertyOverlayGradient]: IGradient;
    [PropertyKey.kPropertyScale]: ImageScale;
}

/**
 * @ignore
 */
interface ImageProperties {
    borderRadius: number;
    borderColor: string;
    borderWidth: number;
    overlayColor: string;
    overlayGradient: string;
    imageScale: ImageScale;
    imageFilters: Filter[];
    imageAlignment: ImageAlign;
}

/**
 * @ignore
 */
export class Image extends Component<IImageProperties> {
    private uuid = uuidv4();
    private imageSourcesArray: Maybe<string[]>;
    private imageProperties: ImageProperties = {} as ImageProperties;
    private canvasElement: HTMLCanvasElement = document.createElement('canvas');
    private svgElement: SVGElement = document.createElementNS(SVG_NS, 'svg') as SVGElement;
    private imageSVGElement: SVGElement = document.createElementNS(SVG_NS, 'image');
    private imageOverlay: HTMLDivElement = document.createElement('div');
    private imageView: HTMLDivElement = document.createElement('div');
    private imageViewProperties = {
        position: 'relative',
        overflow: 'hidden'
    };
    private imageOverlayProperties = {
        'position': 'absolute',
        'z-index': 1,
        'top': '0px',
        'left': '0px'
    };
    private svgImageElementProperties = {
        position: 'relative'
    };

    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);

        this.propExecutor
        (this.setBorderRadius, PropertyKey.kPropertyBorderRadius)
        (this.setOverlayColor, PropertyKey.kPropertyOverlayColor)
        (this.setOverlayGradient, PropertyKey.kPropertyOverlayGradient)
        (this.setImageScale, PropertyKey.kPropertyScale)
        (this.setImageAlignment, PropertyKey.kPropertyAlign)
        (this.setFilters, PropertyKey.kPropertyFilters)
        (this.fetchSource, PropertyKey.kPropertySource);
    }

    public init() {
        super.init();
        this.prepareImageView();
        this.prepareImageOverlay();
        this.draw();
    }

    protected boundsUpdated() {
        if (!this.hasValidBounds()) {
            return;
        }
    }

    protected onPropertiesUpdated() {
        if (this.hasSourceChanged()) {
            this.imageSourcesArray = Nothing;
        }
        this.draw();
    }

    protected applyCssShadow = (shadowParams: string) => {
        createStylesApplier({
            element: this.imageView,
            properties: {
                'box-shadow': shadowParams
            },
            elementType: ElementType.HTML
        }).applyStyle();
    }

    private hasSourceChanged(): boolean {
        const sourceArray = this.getSourceArrayFromProperty();
        if (isSomething(this.imageSourcesArray)) {
            return !arrayEquals(sourceArray, this.imageSourcesArray);
        }
        return true;
    }

    private getSourceArrayFromProperty = (): string[] => {
        let sourceArray = this.props[PropertyKey.kPropertySource];
        sourceArray = sourceArray instanceof Array ? sourceArray : [sourceArray];
        return sourceArray;
    }

    private draw = () => {
        // Render Pipeline
        this.fetchSource()
            .then(() => {
                // Ensure Dynamic Properties are set
                this.setImageAlignment();
                this.setBorderRadius();
                this.setOverlayColor();
                this.setOverlayGradient();
                this.setImageScale();
                // Paint
                this.renderImage()
                    .catch((error) => {
                        this.logger.error(`Error rendering image: ${error}`);
                    });
            });
    }

    private fetchSource = async () => {
        if (isSomething(this.imageSourcesArray)) {
            return;
        }
        this.imageSourcesArray = this.getSourceArrayFromProperty();
        await loadAllImagesFromMediaSource(this.imageSourcesArray, this.renderer);
    }

    private async renderImage() {
        if (!isSomething(this.imageSourcesArray)) {
            return;
        }

        const mainImageSource = last(this.imageSourcesArray);

        if (!isSomething(mainImageSource)) {
            this.logger.warn('Attempted to render image without image url.');
            return;
        }

        // Set updated bounds
        const {
            height,
            width
        } = this.innerBounds;

        const imageDimensions: ImageDimensions = {
            width,
            height
        };
        const useCanvas = this.hasNoiseFilter || this.imageScale === ImageScale.kImageScaleNone;

        const lastIndex = this.imageSourcesArray.length - 1;
        // Scale all images
        const scaledImageSources: ScaledImageSource[] = await Promise.all(
            this.imageSourcesArray.map(async (imageSourceUrl, index) => {

                let imageProcessor;

                // Select the corresponding image processor
                if (useCanvas) {
                    imageProcessor = await createCanvasScaledImageProcessor({
                        imageSourceUrl,
                        canvas: this.canvasElement,
                        imageDimensions,
                        renderer: this.renderer,
                        filters: this.imageFilters,
                        applyFilterArgs: {
                            currentImageIndex: index,
                            isLastIndex: (index === lastIndex)
                        },
                        scalingOption: this.imageScale
                    });
                } else {
                    imageProcessor = await createScaledImageProcessor({
                        imageSourceUrl,
                        imageDimensions,
                        renderer: this.renderer,
                        scalingOption: this.imageScale
                    });
                }

                return imageProcessor.scaleImage();
            })
        );

        const {
            scaledImageWidth,
            scaledImageHeight,
            scaledSource
        } = last(scaledImageSources) as ScaledImageSource;

        // Apply SVG Filters
        createSVGImageFiltersApplier({
            uuid: this.uuid,
            svgElement: this.svgElement,
            imageElement: this.imageSVGElement,
            filters: this.imageFilters,
            imageSources: scaledImageSources.map((imageSource) => imageSource.scaledSource)
        }).applyFiltersToSVGImage();

        // Update Image
        this.imageSVGElement.setAttribute('href', scaledSource);

        // Sizing
        createStylesApplier({
            element: this.svgElement,
            properties: {
                height: scaledImageHeight,
                width: scaledImageWidth
            },
            elementType: ElementType.SVG
        }).applyStyle();

        const viewHeight = Math.min(height, scaledImageHeight);
        const viewWidth = Math.min(width, scaledImageWidth);

        createStylesApplier({
            element: this.imageOverlay,
            properties: {
                height: viewHeight,
                width: viewWidth
            },
            cssUnitType: CssUnitType.Pixels
        }).applyStyle();

        createStylesApplier({
            element: this.imageView,
            properties: {
                height: viewHeight,
                width: viewWidth
            },
            cssUnitType: CssUnitType.Pixels
        }).applyStyle();

        // Alignment
        const imageViewAlignment = createAligner({
            parentBounds: this.innerBounds,
            element: {
                width: scaledImageWidth,
                height: scaledImageHeight
            },
            layoutDirection: this.layoutDirection,
            imageAlign: this.imageAlignment
        }).getAlignment();

        createStylesApplier({
            element: this.imageView,
            properties: imageViewAlignment,
            cssUnitType: CssUnitType.Pixels
        }).applyStyle();

        const imageViewInnerHTMLAlignment = createAligner({
            parentBounds: {
                height: viewHeight,
                width: viewWidth
            },
            element: {
                width: scaledImageWidth,
                height: scaledImageHeight
            },
            boundLimits: {
                maxTop: Number.NEGATIVE_INFINITY,
                maxLeft: Number.NEGATIVE_INFINITY,
                minLeft: Number.POSITIVE_INFINITY
            },
            layoutDirection: this.layoutDirection,
            imageAlign: this.imageAlignment
        }).getAlignment();

        createStylesApplier({
            element: this.svgElement,
            properties: imageViewInnerHTMLAlignment,
            cssUnitType: CssUnitType.Pixels
        }).applyStyle();

        // Display Image
        this.insertIntoDOM({
            element: this.imageView,
            properties: this.imageViewProperties
        });
    }

    private insertIntoDOM({element, properties}) {
        const isAlreadyInDOM = !!document.getElementById(element.id);
        if (!isAlreadyInDOM) {
            createStylesApplier({
                element,
                properties
            }).applyStyle();

            this.container.appendChild(element);
        }
    }

    private prepareImageView() {
        // Prep SVGImage
        const svgImageInSVGElement = this.svgElement.getElementsByTagName('image').length > 0;
        if (!svgImageInSVGElement) {
            createStylesApplier({
                element: this.imageSVGElement,
                properties: {
                    preserveAspectRatio: 'none',
                    x: '0%',
                    y: '0%',
                    width: '100%',
                    height: '100%'
                },
                elementType: ElementType.SVG
            }).applyStyle();
            this.imageSVGElement.id = `svg-image-element-${this.uuid}`;

            this.svgElement.appendChild(this.imageSVGElement);
        }

        // Prep SVG
        const svgInImageView = this.imageView.getElementsByTagName('svg').length > 0;
        if (!svgInImageView) {
            createStylesApplier({
                element: this.svgElement,
                properties: this.svgImageElementProperties
            }).applyStyle();

            this.svgElement.id = `svg-element-${this.uuid}`;
            this.imageView.appendChild(this.svgElement);
        }

        // Prep Overlay
        const overlayInView = this.imageView.getElementsByTagName('div').length > 0;
        if (!overlayInView) {
            createStylesApplier({
                element: this.imageOverlay,
                properties: this.imageOverlayProperties
            }).applyStyle();

            this.imageOverlay.id = `image-overlay-${this.uuid}`;
            this.imageView.appendChild(this.imageOverlay);
        }
    }

    private prepareImageOverlay() {
        this.imageOverlay.id = `overlay-${this.uuid}`;
    }

    private setFilters = () => {
        this.imageFilters = this.props[PropertyKey.kPropertyFilters];
    }

    private setBorderRadius = () => {
        this.borderRadius = this.props[PropertyKey.kPropertyBorderRadius];
        createStylesApplier({
            element: this.imageView,
            properties: {
                'border-radius': this.borderRadius
            },
            cssUnitType: CssUnitType.Pixels,
            elementType: ElementType.HTML
        }).applyStyle();
    }

    private setOverlayColor = () => {
        this.overlayColor = numberToColor(this.props[PropertyKey.kPropertyOverlayColor]);
        createStylesApplier({
            element: this.imageOverlay,
            properties: {
                'background-color': this.overlayColor
            }
        }).applyStyle();
    }

    private setOverlayGradient = () => {
        this.overlayGradient = getCssGradient(this.props[PropertyKey.kPropertyOverlayGradient], this.logger);
        createStylesApplier({
            element: this.imageOverlay,
            properties: {
                'background-image': this.overlayGradient
            }
        }).applyStyle();
    }

    private setImageScale = () => {
        this.imageScale = this.props[PropertyKey.kPropertyScale];
    }

    private setImageAlignment = () => {
        this.imageAlignment = this.props[PropertyKey.kPropertyAlign];
    }

    // Setters / Getters
    set borderRadius(value: number) {
        this.imageProperties.borderRadius = value;
    }

    get borderRadius() {
        return this.imageProperties.borderRadius;
    }

    set borderColor(value: string) {
        this.imageProperties.borderColor = value;
    }

    get borderColor() {
        return this.imageProperties.borderColor;
    }

    set borderWidth(value: number) {
        this.imageProperties.borderWidth = value;
    }

    get borderWidth() {
        return this.imageProperties.borderWidth;
    }

    set overlayColor(value: string) {
        this.imageProperties.overlayColor = value;
    }

    get overlayColor() {
        return this.imageProperties.overlayColor;
    }

    set overlayGradient(value: string) {
        this.imageProperties.overlayGradient = value;
    }

    get overlayGradient() {
        return this.imageProperties.overlayGradient;
    }

    get hasNoiseFilter(): boolean {
        const filtersArray = this.props[PropertyKey.kPropertyFilters];
        const isNoiseFilter = (filter) => filter.type === FilterType.kFilterTypeNoise;
        return filtersArray.some(isNoiseFilter);
    }

    set imageScale(value: ImageScale) {
        this.imageProperties.imageScale = value;
    }

    get imageScale() {
        return this.imageProperties.imageScale;
    }

    set imageAlignment(value: ImageAlign) {
        this.imageProperties.imageAlignment = value;
    }

    get imageAlignment() {
        return this.imageProperties.imageAlignment;
    }

    set imageFilters(value: Filter[]) {
        this.imageProperties.imageFilters = value;
    }

    get imageFilters() {
        return this.imageProperties.imageFilters;
    }

    get canvasRenderingContext() {
        return this.canvasElement.getContext('2d');
    }
}
