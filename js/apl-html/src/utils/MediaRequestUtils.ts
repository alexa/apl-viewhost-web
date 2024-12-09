/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import APLRenderer from '../APLRenderer';
import {EventMediaType} from '../enums/EventMediaType';
import {ILogger} from '../logging/ILogger';
import {LoggerFactory} from '../logging/LoggerFactory';
import {toUrlRequest} from '../media/IURLRequest';
import {HttpStatusCodes} from './Constant';
import {loadAllImagesFromMediaSource} from './ImageRetrievalUtils';

const mediaRequests = new Map<string, Promise<string>>();

export interface MediaRequestArgs {
    renderer: APLRenderer;
    extractFromResponse?: (response: Response) => Promise<string>;
    logger?: ILogger;
}

export const requestMedia = async (
    mediaEvent: number,
    source: string[],
    headers: Headers[],
    args: MediaRequestArgs) => {
    args = ensureDefaultMediaRequestArgs(args);

    const {
        logger
    } = args;

    if (mediaRequestMap[mediaEvent]) {
        return await mediaRequestMap[mediaEvent](source, headers, args);
    }
    logger.error(`Cannot make a media request with type ${mediaEvent}`);
};

const mediaRequestMap = {
    [EventMediaType.kEventMediaTypeImage]: async (imageSource, headers, args) => {
        const {renderer} = args;
        return await loadAllImagesFromMediaSource(imageSource.map(toUrlRequest), renderer);
    },
    [EventMediaType.kEventMediaTypeVectorGraphic]: async (vectorGraphicSource, headers, args) => {
        const {renderer} = args;
        return await renderer.onRequestGraphic(vectorGraphicSource[vectorGraphicSource.length - 1]
            , headers[vectorGraphicSource.length - 1]);
    }
};

function ensureDefaultMediaRequestArgs(args: MediaRequestArgs) {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('MediaRequestUtils')
    };

    return Object.assign(defaultArgs, args);
}

/**
 * Get a media resource via fetch API.
 * @param source Url which contains the source url
 * @param headers Headers to append to request
 * @param args APLContext methods that notifies core that media has loaded or failed to load
 * @return Promise that returns a Promise with either a string or undefined.
 */
export function fetchMediaResource(source: string,
                                   headers: Headers,
                                   args: MediaRequestArgs): Promise<string | undefined> {
    const key = getRequestKeyFrom(source, headers);
    if (mediaRequests.has(key)) {
        // Wait for pending promise instead of fetching again.
        return getFromCache(source, headers, args);
    } else {
        const requestPromise = getFromFetch(source, headers, args);
        mediaRequests.set(key, requestPromise);
        return requestPromise;
    }
}

function getRequestKeyFrom(url: string, headers: Headers): string {
    let str = url;
    if (!headers) {
        return str;
    }

    headers.forEach((value, key) => str += value + key);
    return str;
}

function getFromCache(sourceUrl: string,
                      headers: Headers,
                      args?: MediaRequestArgs) {
    const {
        renderer
    } = args;

    const requestPromise: Promise<string> = mediaRequests.get(getRequestKeyFrom(sourceUrl, headers));
    requestPromise.then((promise) => {
        if (renderer) {
            if (promise) {
                renderer.mediaLoaded(sourceUrl);
            } else {
                renderer.mediaLoadFailed(sourceUrl, HttpStatusCodes.BadRequest, `Bad request on ${sourceUrl}`);
            }
        }
    });
    return requestPromise;
}

function getFromFetch(sourceUrl: string,
                      headers: Headers,
                      args: MediaRequestArgs): Promise<string | undefined> {
    const {
        renderer
    } = args;

    return fetch(sourceUrl, {
        headers
    }).then((response) => {
        if (response.status === HttpStatusCodes.Ok) {
            if (renderer) {
                renderer.mediaLoaded(sourceUrl);
            }
            return args.extractFromResponse(response);
        }
        if (renderer) {
            renderer.mediaLoadFailed(sourceUrl, response.status, response.statusText);
        }
        return undefined;
    }).catch((error) => {
        if (renderer) {
            renderer.mediaLoadFailed(sourceUrl, HttpStatusCodes.BadRequest,
                `Bad request: ${error.message} ${sourceUrl}`);
        }
        return undefined;
    });
}
