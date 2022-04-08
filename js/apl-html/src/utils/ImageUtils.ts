/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import { INoise, Noise } from '../components/filters/Noise';
import { FilterType } from '../enums/FilterType';
import { GradientType } from '../enums/GradientType';
import { ImageScale } from '../enums/ImageScale';
import { ILogger } from '../logging/ILogger';
import { LoggerFactory } from '../logging/LoggerFactory';
import { IURLRequest } from '../media/IURLRequest';
import { browserIsFirefox } from './BrowserUtils';
import { numberToColor } from './ColorUtils';
import { Filter } from './FilterUtils';
import { getImageRetrievalUtils, ImageRetrievalType } from './ImageRetrievalUtils';

export interface IGradient {
    angle: number;
    colorRange: number[];
    inputRange: number[];
    type: GradientType;
}

export function getCssGradient(gradient: IGradient, logger: ILogger): string {
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
            return `${numberToColor(color)} ${inputRange[idx] * 100}%`;
        }
        return numberToColor(color);
    }).join(',');

    switch (gradient.type) {
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
            logger.warn('Incorrect gradient type');
            break;
        }
    }
    return gradientCss;
}

export function getCssPureColorGradient(color: string) {
    return `linear-gradient(${color}, ${color})`;
}

export interface ImageDimensions {
    width: number;
    height: number;
}

export interface ImageScalerArgs {
    imageSource: IURLRequest;
    renderer: APLRenderer;
    scalingOption?: ImageScale;
    imageDimensions: ImageDimensions;
    logger?: ILogger;
}

export interface CanvasImageScalerArgs extends ImageScalerArgs {
    canvas: HTMLCanvasElement;
    filters: Filter[];
    applyFilterArgs: ApplyFiltersToImageArguments;
}

export interface ImageScaler {
    scaleImage: () => ScaledImageSource;
}

export interface ScaledImageSource {
    scaledImageWidth;
    scaledImageHeight;
    scaledSource;
}

export async function createScaledImageProcessor(args: ImageScalerArgs): Promise<ImageScaler> {
    const defaultArgs = {
        scalingOption: ImageScale.kImageScaleBestFit,
        logger: LoggerFactory.getLogger('ScaledImageRenderer')
    };
    args = Object.assign(defaultArgs, args);

    const {
        imageDimensions,
        renderer,
        logger,
        imageSource
    } = args;

    let {
        scalingOption
    } = args;

    const imageElement: HTMLImageElement =
        await getImageRetrievalUtils({
            type: ImageRetrievalType.HTML,
            renderer,
            logger
        }).getImageElement(imageSource);

    const {
        height: sourceHeight,
        width: sourceWidth
    } = imageElement;

    const {
        height: destinationHeight,
        width: destinationWidth
    } = imageDimensions;

    const scaledImageDimension: ImageDimensions = {
        height: destinationHeight,
        width: destinationWidth
    };

    const xScale = destinationWidth / sourceWidth;
    const yScale = destinationHeight / sourceHeight;

    function renderScaleNone(): void {
        adjustImageDimensions({
            width: sourceWidth,
            height: sourceHeight
        });
    }

    function renderScaleToFill(): void {
        adjustImageDimensions({
            width: destinationWidth,
            height: destinationHeight
        });
    }

    function renderScaleToBestFill(): void {
        const scale = xScale > yScale ? xScale : yScale;
        renderScaled(scale);
    }

    function renderScaleToBestFit(): void {
        const scale = xScale < yScale ? xScale : yScale;
        renderScaled(scale);
    }

    function renderScaleToBestFitDown(): void {
        let scale = 1.0;
        if ((sourceWidth > destinationWidth) || (sourceHeight > destinationHeight)) {
            scale = xScale < yScale ? xScale : yScale;
        }
        renderScaled(scale);
    }

    function renderScaled(scale): void {
        const {
            height,
            width
        } = scaleDimensions(scale);

        adjustImageDimensions({
            width,
            height
        });
    }

    function adjustImageDimensions({width, height}) {
        scaledImageDimension.height = height;
        scaledImageDimension.width = width;
    }

    function scaleDimensions(scale): ImageDimensions {
        return {
            height: Math.round(sourceHeight * scale),
            width: Math.round(sourceWidth * scale)
        };
    }

    const scalingFunctions = {
        [ImageScale.kImageScaleNone]: renderScaleNone,
        [ImageScale.kImageScaleFill]: renderScaleToFill,
        [ImageScale.kImageScaleBestFill]: renderScaleToBestFill,
        [ImageScale.kImageScaleBestFit]: renderScaleToBestFit,
        [ImageScale.kImageScaleBestFitDown]: renderScaleToBestFitDown
    };

    return {
        scaleImage(): ScaledImageSource {
            if (!scalingFunctions.hasOwnProperty(scalingOption)) {
                logger.warn(`unrecognized scaling option ${scalingOption} defaulting to 'best-fit'`);
                scalingOption = ImageScale.kImageScaleBestFit;
            }
            scalingFunctions[scalingOption]();

            return {
                scaledImageHeight: scaledImageDimension.height,
                scaledImageWidth: scaledImageDimension.width,
                scaledSource: imageSource
            };
        }
    };
}

export async function createCanvasScaledImageProcessor(args: CanvasImageScalerArgs): Promise<ImageScaler> {
    const defaultArgs = {
        scalingOption: ImageScale.kImageScaleBestFit,
        logger: LoggerFactory.getLogger('ScaledImageRenderer')
    };
    args = Object.assign(defaultArgs, args);

    const {
        logger,
        canvas,
        filters,
        renderer,
        imageDimensions,
        imageSource,
        applyFilterArgs
    } = args;

    let {
        scalingOption
    } = args;

    const prefetchedImageElement: HTMLImageElement =
        await getImageRetrievalUtils({
            type: ImageRetrievalType.HTML,
            renderer,
            logger
        }).getImageElement(imageSource);

    const {
        height: sourceHeight,
        width: sourceWidth
    } = prefetchedImageElement;

    const {
        height: destinationHeight,
        width: destinationWidth
    } = imageDimensions;

    // if source fits inside destination
    if (sourceWidth <= destinationWidth && sourceHeight <= destinationHeight) {
        return createScaledImageProcessor({
            logger,
            imageDimensions,
            renderer,
            imageSource,
            scalingOption
        });
    }

    const imageElement: HTMLImageElement =
        await getImageRetrievalUtils({
            type: ImageRetrievalType.CORS,
            renderer,
            logger
        }).getImageElement(imageSource);

    const xScale = destinationWidth / sourceWidth;
    const yScale = destinationHeight / sourceHeight;

    // Clear canvas
    const canvasRenderingContext = canvas.getContext('2d');
    canvasRenderingContext.clearRect(0, 0, destinationWidth, destinationHeight);

    function renderScaleNone(): void {
        const targetWidth = (sourceWidth > destinationWidth) ? destinationWidth : sourceWidth;
        const targetHeight = (sourceHeight > destinationHeight) ? destinationHeight : sourceHeight;

        adjustCanvasDimensions({
            width: targetWidth,
            height: targetHeight
        });

        const {
            xCoordinate,
            yCoordinate
        } = calculateOffset({
            width: sourceWidth,
            height: sourceHeight
        });

        const destinationX = 0;
        const destinationY = 0;

        const leftOffset = Math.abs(xCoordinate);
        const topOffset = Math.abs(yCoordinate);

        const sourceClippingWidth = (sourceWidth > destinationWidth) ? destinationWidth : sourceWidth - leftOffset;
        const sourceClippingHeight = (sourceHeight > destinationHeight) ? destinationHeight : sourceHeight - topOffset;

        canvasRenderingContext.drawImage(
            imageElement,
            leftOffset,
            topOffset,
            sourceClippingWidth,
            sourceClippingHeight,
            destinationX,
            destinationY,
            targetWidth,
            targetHeight
         );
    }

    function renderScaleToFill(): void {
        const newWidth = destinationWidth;
        const newHeight = destinationHeight;

        adjustCanvasDimensions({
            width: newWidth,
            height: newHeight
        });

        const {
            xCoordinate,
            yCoordinate
        } = calculateOffset({
            width: newWidth,
            height: newHeight
        });

        canvasRenderingContext.drawImage(imageElement, xCoordinate, yCoordinate, newWidth, newHeight);
    }

    function renderScaleToBestFill(): void {
        const scale = xScale > yScale ? xScale : yScale;
        renderScaled(scale);
    }

    function renderScaleToBestFit(): void {
        const scale = xScale < yScale ? xScale : yScale;
        renderScaled(scale);
    }

    function renderScaleToBestFitDown(): void {
        let scale = 1.0;
        if ((sourceWidth > destinationWidth) || (sourceHeight > destinationHeight)) {
            scale = xScale < yScale ? xScale : yScale;
        }
        renderScaled(scale);
    }

    function renderScaled(scale): void {
        const {
            height,
            width
        } = scaleDimensions(scale);

        adjustCanvasDimensions({
            width,
            height
        });

        const sourceX = 0;
        const sourceY = 0;

        const destinationX = 0;
        const destinationY = 0;

        canvasRenderingContext.drawImage(
            imageElement,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            destinationX,
            destinationY,
            width,
            height
        );
    }

    function setCanvasImageSmoothingQualityToHigh() {
        if (!browserIsFirefox(window.navigator.userAgent)) {
            (canvasRenderingContext as any).imageSmoothingQuality = 'high';
        }
    }

    function adjustCanvasDimensions({width, height}) {
        canvas.height = height;
        canvas.width = width;

        setCanvasImageSmoothingQualityToHigh();
    }

    function calculateOffset({width, height}) {
        const xOffset = (destinationWidth - width) / 2;
        const yOffset = (destinationHeight - height) / 2;

        return {
            xCoordinate: Math.min(xOffset, 0),
            yCoordinate: Math.min(yOffset, 0)
        };
    }

    function scaleDimensions(scale) {
        return {
            height: Math.round(sourceHeight * scale),
            width: Math.round(sourceWidth * scale)
        };
    }

    const scalingFunctions = {
        [ImageScale.kImageScaleNone]: renderScaleNone,
        [ImageScale.kImageScaleFill]: renderScaleToFill,
        [ImageScale.kImageScaleBestFill]: renderScaleToBestFill,
        [ImageScale.kImageScaleBestFit]: renderScaleToBestFit,
        [ImageScale.kImageScaleBestFitDown]: renderScaleToBestFitDown
    };

    return {
        scaleImage(): ScaledImageSource {
            if (!scalingFunctions.hasOwnProperty(scalingOption)) {
                logger.warn(`unrecognized scaling option ${scalingOption} defaulting to 'best-fit'`);
                scalingOption = ImageScale.kImageScaleBestFit;
            }
            scalingFunctions[scalingOption]();

            // Apply filters
            createCanvasImageFiltersApplier({
                canvas,
                canvasRenderingContext,
                filters
            }).applyFiltersToImage(applyFilterArgs);

            return {
                scaledSource: {url: canvas.toDataURL('image/png', 1.0)},
                scaledImageWidth: canvas.width,
                scaledImageHeight: canvas.height
            };
        }
    };
}

export interface CanvasImageFiltersApplierArgs {
    canvas: HTMLCanvasElement;
    canvasRenderingContext: CanvasRenderingContext2D;
    filters: Filter[];
    logger?: ILogger;
}

export interface ApplyFiltersToImageArguments {
    currentImageIndex: number;
    isLastIndex: boolean;
}

export interface CanvasImageFiltersApplier {
    applyFiltersToImage: (args: ApplyFiltersToImageArguments) => void;
}

function createCanvasImageFiltersApplier(args: CanvasImageFiltersApplierArgs): CanvasImageFiltersApplier {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('CanvasImageFiltersApplier')
    };
    args = Object.assign(defaultArgs, args);

    const {
        filters,
        canvas,
        canvasRenderingContext,
        logger
    } = args;

    function applyNoise(filter: INoise) {
        const {
            width,
            height
        } = canvas;
        const xCoordinate = 0;
        const yCoordinate = 0;

        const imageData = canvasRenderingContext.getImageData(xCoordinate, yCoordinate, width, height);
        if (!imageData) {
            logger.warn(`No image data to apply filter to, skipping noise filter.`);
            return;
        }
        const noise = new Noise(filter.useColor, filter.kind, filter.sigma);
        noise.addNoise(imageData);
        canvasRenderingContext.putImageData(imageData, xCoordinate, yCoordinate);
    }

    const canvasSupportedFilter = {
        [FilterType.kFilterTypeNoise]: applyNoise
    };

    return {
        applyFiltersToImage(applyFilterArgs: ApplyFiltersToImageArguments): void {
            const defaultApplyFilterArgs = {
                currentImageIndex: Infinity,
                isLastIndex: false
            };
            applyFilterArgs = Object.assign(defaultApplyFilterArgs, applyFilterArgs);

            const {
                currentImageIndex,
                isLastIndex
            } = applyFilterArgs;

            const canvasFilters = filters.filter((filter) => {
                return canvasSupportedFilter.hasOwnProperty(filter.type);
            });

            canvasFilters.forEach((filter) => {
                const sourceIndex = (filter as INoise).source;
                if (sourceIndex === currentImageIndex || (isLastIndex && sourceIndex === -1)) {
                    canvasSupportedFilter[filter.type](filter);
                }
            });
        }
    };
}
