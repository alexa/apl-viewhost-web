/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { ImageAlign } from '../enums/ImageAlign';
import { ImageScale } from '../enums/ImageScale';
import { PropertyKey } from '../enums/PropertyKey';
import { GradientType } from '../enums/GradientType';
import { Component, FactoryFunction, IComponentProperties, SVG_NS } from './Component';

import * as $ from 'jquery';

// This is a temporary shim for jquery so that the image scale
// library works.
// TODO: ARC-110: Find another way to make image scale work on ImageComponent
// https://issues.labcollab.net/browse/ARC-110
(window as any).jQuery = $;
import 'image-scale';
import APLRenderer from '../APLRenderer';
import { Noise } from './filters/Noise';
import { ILogger } from '../logging/ILogger';
import { Filter, generateSVGDefsAndUseElement } from '../utils/FilterUtils';
import { isINoise } from './filters/Noise';

/**
 * @ignore
 */
export interface IGradient {
    angle : number;
    colorRange : number[];
    inputRange : number[];
    type : GradientType;
}

/**
 * @ignore
 */
export interface IImageProperties extends IComponentProperties {
    [PropertyKey.kPropertySource] : string;
    [PropertyKey.kPropertyAlign] : ImageAlign;
    [PropertyKey.kPropertyBorderRadius] : number;
    [PropertyKey.kPropertyBorderWidth] : number;
    [PropertyKey.kPropertyOverlayColor] : number;
    [PropertyKey.kPropertyBorderColor] : number;
    [PropertyKey.kPropertyFilters] : Filter[];
    [PropertyKey.kPropertyOverlayGradient] : IGradient;
    [PropertyKey.kPropertyScale] : ImageScale;
}

/**
 * @ignore
 * TODO: Figure out why two Images constructed with only one Image in APL document
 */
export class Image extends Component<IImageProperties> {

    private imgPlaceHolder : HTMLDivElement = document.createElement('div');
    private $imgPlaceHolder = $(this.imgPlaceHolder);
    private imageOverlay : HTMLDivElement = document.createElement('div');
    private $imageOverlay = $(this.imageOverlay);
    // the original image is used to apply customized filter on canvas and scale the svg images.
    // it shall be hidden from the final render result.
    private originalImageElement : HTMLImageElement = document.createElement('img');
    private $originalImageElement = $(this.originalImageElement);
    // canvasElement is used to modify imageData defined in APL-filter/3P filter extension.
    private canvasElement : HTMLCanvasElement = document.createElement('canvas');
    // the image element inside svg
    private imageElement : SVGElement = document.createElementNS(SVG_NS, 'image');
    private svgDefsElement : SVGDefsElement | undefined = undefined;
    private svgUseElement : SVGUseElement | undefined = undefined;
    private svg : SVGElement = document.createElementNS(SVG_NS, 'svg') as SVGElement;
    private $svg = $(this.svg);
    // this flag indicates if the filter needs to be performed using canvas.
    private hasFiltersInCanvas : boolean = false;
    private setSvgImageHrefTimeout : any;
    private isShadowHolderAdded : boolean = false;

    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.initSvgElement();
        this.$originalImageElement.css({
            'background-clip': 'padding-box',
            'border-style': 'solid',
            'border-width': '0px',
            'display': 'none',
            'overflow': 'hidden',
            'position': 'absolute'
        });

        this.$imgPlaceHolder.css({
            overflow: 'hidden',
            position: 'relative',
            isolation: 'isolate'
        });

        this.$imageOverlay.css('position', 'absolute');
        this.imgPlaceHolder.classList.add('imageHolder');
        this.imageOverlay.classList.add('imageOverlay');
        this.imgPlaceHolder.appendChild(this.svg);
        this.imgPlaceHolder.appendChild(this.originalImageElement);
        this.imgPlaceHolder.appendChild(this.imageOverlay);
        this.container.appendChild(this.imgPlaceHolder);
        this.propExecutor
            (this.setBorderRadius, PropertyKey.kPropertyBorderRadius)
            (this.setBorderColor, PropertyKey.kPropertyBorderColor)
            (this.setBorderWidth, PropertyKey.kPropertyBorderWidth)
            (this.setOverlayColor, PropertyKey.kPropertyOverlayColor)
            (this.setOverlayGradient, PropertyKey.kPropertyOverlayGradient)
            (this.setSourceAndFilter, PropertyKey.kPropertySource,
                PropertyKey.kPropertyScale, PropertyKey.kPropertyFilters);
    }

    protected boundsUpdated() {
        if (this.hasValidBounds()) {
            this.$imgPlaceHolder.css({
                height: this.innerBounds.height,
                width: this.innerBounds.width
            });
            this.setSourceAndFilter();
        }
    }

    private initSvgElement = () => {
        this.$svg.html('');
        this.$svg.css({
            'background-clip': 'padding-box',
            'border-style': 'solid',
            'border-width': '0px',
            'display': 'none',
            'overflow': 'hidden',
            'position': 'absolute'
        });
        this.imageElement.setAttribute('preserveAspectRatio', 'none');
        this.imageElement.setAttribute('x', '0%');
        this.imageElement.setAttribute('y', '0%');
        this.imageElement.setAttribute('width', '100%');
        this.imageElement.setAttribute('height', '100%');
        this.svg.appendChild(this.imageElement);
    }

    private setBorderRadius = () => {
        const borderRadius = this.props[PropertyKey.kPropertyBorderRadius];
        this.$imgPlaceHolder.css('border-radius', borderRadius);
    }

    protected applyCssShadow = (shadowParams : string) => {
        if (ImageScale.kImageScaleNone === this.props[PropertyKey.kPropertyScale]) {
            this.$originalImageElement.css('box-shadow', shadowParams);
        }
    }

    private setBorderColor = () => {
        const css = Component.numberToColor(this.props[PropertyKey.kPropertyBorderColor]);
        this.$originalImageElement.css('border-color', css);
        this.$svg.css('border-color', css);
    }

    private setBorderWidth = () => {
        const css = this.props[PropertyKey.kPropertyBorderWidth];
        this.$originalImageElement.css('border-color', css);
        this.$svg.css('border-width', css);
    }

    private setFilters = (imageArray : string[]) => {
        const filters : Filter[] = this.props[PropertyKey.kPropertyFilters];
        this.checkFilters(filters);
        if (this.hasFiltersInCanvas) {
            // If implementing any filter in canvas, we draw image onto a canvas 2D context and invoke
            // getImageData(), if image is from another origin then two requirements need to be met:
            // 1. image's crossOrigin attribute is set to 'anonymous'
            // 2. server that's configured to host images with the Access-Control-Allow-Origin
            //    header configured to permit cross-origin access to image files
            // reference: https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
            this.originalImageElement.crossOrigin = 'anonymous';
        }
        this.addSVGFilters(filters, imageArray);
    }

    private setOverlayColor = () => {
        this.$imageOverlay.css('background-color',
            Component.numberToColor(this.props[PropertyKey.kPropertyOverlayColor]));
    }

    private setOverlayGradient = () => {
        this.$imageOverlay.css('background-image',
            Image.getCssGradient(this.props[PropertyKey.kPropertyOverlayGradient], this.logger));
    }

    private setSourceAndFilter = () => {
        if (this.hasValidBounds()) {
            // reset svg
            this.initSvgElement();
            // get images from source.
            let imageSrcArray : string[] | string = this.props[PropertyKey.kPropertySource];
            imageSrcArray = imageSrcArray instanceof Array ? imageSrcArray : [imageSrcArray];
            // Need make a copy of source image array, otherwise it will be mutated by filter operations
            const imageArray : string [] = imageSrcArray.slice(0);
            this.setFilters(imageArray);
            // the original image is used to apply customized filter and will be hidden from the final render result.
            // workaround for firefox to draw on canvas : image's crossOrigin attribute is set to 'anonymous'
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && this.hasFiltersInCanvas) {
                this.originalImageElement.crossOrigin = 'anonymous';
            }
            this.originalImageElement.src = this.getImageSource(imageSrcArray[imageSrcArray.length - 1],
                this.originalImageElement.crossOrigin === 'anonymous');
            $(this.originalImageElement).on('load', () => {
                this.setImageScale();
                // hide the original image after everything is loaded. and add svg
                this.$originalImageElement.css('display', 'none');
                // onLoad can be triggered 5~6 times due to image resizing and other reasons.
                // using debounce can avoid unnecessary calls and improve performance.
                clearTimeout(this.setSvgImageHrefTimeout);
                this.setSvgImageHrefTimeout = setTimeout(() => {
                    this.setSvgImageHref();
                    $(this.svg).html($(this.svg).html());
                }, 10);
                // setup shadow
                if (this.originalImageElement.complete
                    && !this.isShadowHolderAdded
                    && this.hasShadowPropertyDefined()) {
                    this.isShadowHolderAdded = true;
                    this.applyShadowEffectWhenScaled();
                }
            });
        }
    }

    private getImageSource = (source : string, cors : boolean) : string => {
        if (!cors) {
            return source;
        }
        // for cors requested image, we do not want to load from cache.
        return source.includes('?') ? source + '&_' : source + '?_';
    }

    private setSvgImageHref = () => {
        if (this.hasFiltersInCanvas) {
            this.applyFiltersToSvgImageHref();
        } else {
            // no filter need to perform on canvas, directly set image source.
            let imageSrcArray : string[] | string = this.props[PropertyKey.kPropertySource];
            imageSrcArray = imageSrcArray instanceof Array ? imageSrcArray : [imageSrcArray];
            // per specs, the last one from image array should be rendered.
            this.imageElement.setAttribute('href', imageSrcArray[imageSrcArray.length - 1]);
        }
    }

    private applyShadowEffectWhenScaled = () => {
        // shallow copy imgPlaceHolder and the shadow will be applied on the copied div element
        const imgShadowHolder = $(this.imgPlaceHolder.cloneNode(false)).attr('class', 'imgShadowHolder');
        // set the css properties of the cloned div and make it cover imgPlaceHolder
        imgShadowHolder.css('overflow', 'unset');
        imgShadowHolder.css('margin-top', -this.$imgPlaceHolder.height());
        const DEFAULT_ZINDEX : number = -1;
        imgShadowHolder.css('z-index', DEFAULT_ZINDEX);
        imgShadowHolder.appendTo(this.$imgPlaceHolder.parent());
        imgShadowHolder.css('box-shadow', this.getCssShadow());
    }

    private hasShadowPropertyDefined = () : boolean => {
        return (this.props[PropertyKey.kPropertyShadowHorizontalOffset] !== 0
            || this.props[PropertyKey.kPropertyShadowVerticalOffset] !== 0
            || this.props[PropertyKey.kPropertyShadowRadius] > 0
            || this.props[PropertyKey.kPropertyShadowColor] > 0);
    }

    /**
     * Check filters.
     * If there is any filter to be implemented in canvas, set hasFiltersInCanvas to true.
     */
    private checkFilters = (filters : Filter[]) => {
        filters.forEach((filter) => {
            // Noise filter is performed using canvas.
            if (isINoise(filter)) {
                this.hasFiltersInCanvas = true;
            }
        });
    }

    private addSVGFilters(filters : Filter[], imageSourceArray : string[]) : void {
        // substring the CORE ID from :1000 -> 1000, otherwise, HTML will not recognize.
        // this id will map to filter id in the definition
        const filterId = this.component.getUniqueId().substring(1);
        const svgDefsAndUseElement = generateSVGDefsAndUseElement(filters, imageSourceArray, filterId);
        if (svgDefsAndUseElement) {
            this.svgDefsElement = svgDefsAndUseElement.svgDefsElement;
            this.svgUseElement = svgDefsAndUseElement.svgUseElement;
            if (this.svgUseElement) {
                this.svg.appendChild(this.svgUseElement);
            }
            if (this.svgDefsElement) {
                this.svg.appendChild(this.svgDefsElement);
                this.imageElement.setAttribute('filter', `url(#${filterId})`);
            }
        }
    }

    /**
     * Apply filters one by one based on their order.
     * Skip blur if blur is implemented in CSS.
     */
    private applyFiltersToSvgImageHref = () => {
        const w = this.canvasElement.width;
        const h = this.canvasElement.height;
        if (w <= 0 || h <= 0) { return; }

        const ctx = this.canvasElement.getContext('2d');
        const filters : Filter[] = this.props[PropertyKey.kPropertyFilters];
        ctx.drawImage(this.originalImageElement, 0, 0, w, h);
        let imageData : ImageData;
        try {
            imageData = ctx.getImageData(0, 0, w, h);
        } catch (e) {
            this.logger.error('Failed to apply filters in Canvas, removing canvas element.');
        }
        if (!imageData) { return; }

        filters.forEach((filter) => {
            // skip other filters because it will leverage SVG filter.
            if (isINoise(filter)) {
                const noise : Noise = new Noise(filter.useColor, filter.kind, filter.sigma);
                noise.addNoise(imageData);
            } else {
                this.logger.warn('unknown filter for canvas');
            }
        });
        ctx.putImageData(imageData, 0, 0);
        // update the render image element with raw ImageData.
        this.imageElement.setAttribute('href', this.canvasElement.toDataURL());
    }

    public static getCssGradient(gradient : IGradient, logger : ILogger) : string {
        if (!gradient) {
            return '';
        }

        let gradientCss = '';

        // All gradients use color stops, colors are mandatory, stop positions are not
        const inputRange = gradient.inputRange || [];
        const colorStops = gradient.colorRange.map((color, idx) => {
            // if the color already in css rgba format string, do not need convert.
            if (typeof color !== 'number') {
                if (inputRange.length > idx) {
                    return `${color} ${inputRange[idx] * 100}%`;
                }
                return color;
            }
            // else color is a number, convert to rgba format.
            if (inputRange.length > idx) {
                return `${this.numberToColor(color)} ${inputRange[idx] * 100}%`;
            }
            return this.numberToColor(color);
        }).join(',');

        switch ( gradient.type ) {
            case GradientType.LINEAR: {
                const angle = gradient.angle || 0;
                gradientCss = `linear-gradient(${angle}deg, ${colorStops})`;
                break;
            }
            case GradientType.RADIAL: {
                gradientCss = `radial-gradient(${colorStops})`;
                break;
            }
            default: {
                logger.warn('Incorrect gardient type');
                break;
            }
        }
        return gradientCss;
    }

    public static getCssPureColorGradient(color : string) {
        return `linear-gradient(${color}, ${color})`;
    }

    private setImageScale() {
        const width : number = this.originalImageElement.naturalWidth as number;
        const height : number = this.originalImageElement.naturalHeight as number;
        this.$originalImageElement.css('width', width);
        this.$originalImageElement.css('height', height);
        this.$originalImageElement.css('display', '');
        ($(this.originalImageElement) as any).imageScale({
            scale: this.getImageScale()
        });
        const imageEleWidth = $(this.originalImageElement).width();
        const imageEleHeight =  $(this.originalImageElement).height();
        this.$svg.css('display', '');
        this.$svg.css({
            top: this.originalImageElement.offsetTop,
            left: this.originalImageElement.offsetLeft
        });
        this.svg.setAttribute('width', imageEleWidth.toString());
        this.svg.setAttribute('height', imageEleHeight.toString());
        this.$imageOverlay.css('width', Math.min(this.innerBounds.width, imageEleWidth));
        this.$imageOverlay.css('height', Math.min(this.innerBounds.height, imageEleHeight));
        this.$imgPlaceHolder.css('width', Math.min(this.innerBounds.width, imageEleWidth));
        this.$imgPlaceHolder.css('height', Math.min(this.innerBounds.height, imageEleHeight));
        this.setImageHolderAlignment();
        if (this.props[PropertyKey.kPropertyScale] === ImageScale.kImageScaleBestFill) {
            this.setImageAndSvgAlignment();
        }
    }

    private getImageScale() : string {
        // tslint:disable-next-line:switch-default
        switch (this.props[PropertyKey.kPropertyScale]) {
            case ImageScale.kImageScaleBestFill:
                return 'best-fill';
            case ImageScale.kImageScaleBestFit:
                return 'best-fit';
            case ImageScale.kImageScaleBestFitDown:
                return 'best-fit-down';
            case ImageScale.kImageScaleFill:
                return 'fill';
            case ImageScale.kImageScaleNone:
                return 'none';
            default:
                this.logger.error('bad image scale property enum', this.props[PropertyKey.kPropertyScale]);
                return 'best-fit';
        }
    }

    private setImageHolderAlignment() {
        const parentWidth = this.innerBounds.width;
        const parentHeight = this.innerBounds.height;
        const imageWidth = $(this.originalImageElement).width();
        const imageHeight = $(this.originalImageElement).height();
        let left = (parentWidth - imageWidth) / 2;
        let top = (parentHeight - imageHeight) / 2;
        switch (this.props[PropertyKey.kPropertyAlign]) {
            case ImageAlign.kImageAlignBottom: {
                top = parentHeight - imageHeight;
                break;
            }
            case ImageAlign.kImageAlignBottomLeft: {
                top = parentHeight - imageHeight;
                left = 0;
                break;
            }
            case ImageAlign.kImageAlignBottomRight: {
                top = parentHeight - imageHeight;
                left = parentWidth - imageWidth;
                break;
            }
            case ImageAlign.kImageAlignCenter: {
                break;
            }
            case ImageAlign.kImageAlignLeft: {
                left = 0;
                break;
            }
            case ImageAlign.kImageAlignRight: {
                left = parentWidth - imageWidth;
                break;
            }
            case ImageAlign.kImageAlignTop: {
                top = 0;
                break;
            }
            case ImageAlign.kImageAlignTopLeft: {
                top = 0;
                left = 0;
                break;
            }
            case ImageAlign.kImageAlignTopRight: {
                top = 0;
                left = parentWidth - imageWidth;
                break;
            }
            default: {
                this.logger.error('Bad image alignment property key', this.props[PropertyKey.kPropertyAlign]);
                break;
            }
        }
        top = Math.max(top, 0);
        left = Math.max(left, 0);
        $(this.imgPlaceHolder).css({top, left});
    }

    private setImageAndSvgAlignment() {
        let top = this.originalImageElement.offsetTop;
        let left = this.originalImageElement.offsetLeft;
        switch (this.props[PropertyKey.kPropertyAlign]) {
            case ImageAlign.kImageAlignBottom: {
                top *= 2;
                break;
            }
            case ImageAlign.kImageAlignBottomLeft: {
                top *= 2;
                left = 0;
                break;
            }
            case ImageAlign.kImageAlignBottomRight: {
                top *= 2;
                left *= 2;
                break;
            }
            case ImageAlign.kImageAlignCenter: {
                // Do nothing, current top and left are for center.
                break;
            }
            case ImageAlign.kImageAlignLeft: {
                left = 0;
                break;
            }
            case ImageAlign.kImageAlignRight: {
                left *= 2;
                break;
            }
            case ImageAlign.kImageAlignTop: {
                top = 0;
                break;
            }
            case ImageAlign.kImageAlignTopLeft: {
                top = 0;
                left = 0;
                break;
            }
            case ImageAlign.kImageAlignTopRight: {
                top = 0;
                left *= 2;
                break;
            }
            default: {
                this.logger.error('Bad image alignment property key', this.props[PropertyKey.kPropertyAlign]);
                break;
            }
        }
        this.$originalImageElement.css({top, left});
        this.$svg.css({top, left});
    }
}
