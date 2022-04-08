/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import APLRenderer from '../APLRenderer';
import {ILogger} from '../logging/ILogger';
import {LoggerFactory} from '../logging/LoggerFactory';
import {IURLRequest, parseHeaders} from '../media/IURLRequest';
import {HttpStatusCodes} from './Constant';
import {fetchMediaResource} from './MediaRequestUtils';

const imageElementMap = new Map<string, Promise<HTMLImageElement>>();

const loadImageFromMediaSource = async (sourceUrl: string,
                                        headers: Headers,
                                        imageElement: HTMLImageElement,
                                        renderer: APLRenderer): Promise<HTMLImageElement> => {
    return new Promise<HTMLImageElement>(async (resolve, reject) => {
        imageElement.onload = () => {
            if (renderer) {
                renderer.mediaLoaded(sourceUrl);
            }
            resolve(imageElement);
        };
        imageElement.onerror = reject;
        if (headers.values().next().done) {
            imageElement.src = sourceUrl;
        } else {
            imageElement.src = await fetchMediaResource(sourceUrl, headers, {renderer, extractFromResponse});
        }
    }).catch(() => {
        if (renderer) {
            renderer.mediaLoadFailed(sourceUrl, HttpStatusCodes.BadRequest, `Bad request on ${sourceUrl}`);
        }
        return createUnattachedImageElement();
    });
};

/**
 * Create and load images in html elements. These elements are saved and can be used later for image processing
 * @param sourceUrls array of string URLs
 * @param renderer APLRenderer
 */
export const loadAllImagesFromMediaSource = async (sourceUrls: IURLRequest[],
                                                   renderer: APLRenderer): Promise<void[]> => {
    return await Promise.all(
        sourceUrls
            .map(async (sourceUrl) => {
                const isImageRequested = imageElementMap.has(sourceUrl.url);
                if (isImageRequested) {
                    // use pre-fetched element to trigger media loaded events
                    const imageElementPromise = imageElementMap.get(sourceUrl.url);
                    const imageElement = await imageElementPromise;

                    // Call onMedia events for cached sources
                    if (imageElement.src && renderer) {
                        renderer.mediaLoaded(sourceUrl.url);
                    } else if (renderer) {
                        renderer.mediaLoadFailed(sourceUrl.url, HttpStatusCodes.BadRequest, `Bad request on ${sourceUrl}`);
                    }
                } else {
                    const headers = parseHeaders(sourceUrl.headers);
                    createImageAndInsertIntoMap(sourceUrl.url, headers, renderer);
                }
            })
    );
};

const extractFromResponse = (response: Response) => response.blob().then((imageBlob) => URL.createObjectURL(imageBlob));

const getImageElementFromUtilMap = async (sourceUrl: string,
                                          headers: Headers,
                                          renderer: APLRenderer): Promise<HTMLImageElement> => {
    if (!imageElementMap.has(sourceUrl)) {
        createImageAndInsertIntoMap(sourceUrl, headers, renderer);
    }
    return imageElementMap.get(sourceUrl);
};

const getCorsImageElement =
    async (sourceUrl: string, headers: Headers, renderer: APLRenderer): Promise<HTMLImageElement> => {
        const imageElement: HTMLImageElement = createUnattachedImageElement();
        imageElement.crossOrigin = 'anonymous';
        return loadImageFromMediaSource(sourceUrl, headers, imageElement, renderer);
    };

const createImageAndInsertIntoMap = (sourceUrl: string, headers: Headers, renderer: APLRenderer) => {
    const imageElement = createUnattachedImageElement();
    const imageElementPromise = loadImageFromMediaSource(sourceUrl, headers, imageElement, renderer);
    imageElementMap.set(sourceUrl, imageElementPromise);
};

export const getFetchedBlobUrlFrom = async (sourceUrl: string): Promise<string> => {
    const element = await imageElementMap.get(sourceUrl);
    if (!element) {
        return sourceUrl;
    }
    return element.getAttribute('src');
};

const createUnattachedImageElement = (): HTMLImageElement => {
    return document.createElement('img');
};

export type ImageRetrievalTypes = 'HTML' | 'HTML_CORS';

export interface SupportedRetrievalTypes {
    [key: string]: ImageRetrievalTypes;
}

export const ImageRetrievalType: SupportedRetrievalTypes = {
    HTML: 'HTML',
    HTML_CORS: 'HTML_CORS'
};

type RetrievalFunction = (sourceUrl: string, headers: Headers, renderer: APLRenderer) => Promise<HTMLImageElement>;

interface RetrievalFunctionMap {
    [key: string]: RetrievalFunction;
}

const retrievalFunctionMap: RetrievalFunctionMap = {
    [ImageRetrievalType.HTML]: getImageElementFromUtilMap,
    [ImageRetrievalType.CORS]: getCorsImageElement
};

export interface ImageRetrievalUtilsArgs {
    type: ImageRetrievalTypes;
    renderer: APLRenderer;
    logger?: ILogger;
}

export function getImageRetrievalUtils(args: ImageRetrievalUtilsArgs) {
    const defaultArgs = {
        type: ImageRetrievalType.HTML,
        logger: LoggerFactory.getLogger('ImageRetrievalUtils')
    };

    const {
        type,
        renderer,
        logger
    } = Object.assign(defaultArgs, args);

    return {
        async getImageElement(source: IURLRequest): Promise<HTMLImageElement> {
            if (!retrievalFunctionMap.hasOwnProperty(type)) {
                logger.warn(`Type of image retrieval is invalid: ${type}`);
                return retrievalFunctionMap[ImageRetrievalType.HTML](
                    source.url, parseHeaders(source.headers), renderer);
            }

            return retrievalFunctionMap[type](source.url, parseHeaders(source.headers), renderer);
        }
    };
}
