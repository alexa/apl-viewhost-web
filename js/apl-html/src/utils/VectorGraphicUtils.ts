/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStatusCodes } from './Constant';
import { MediaRequestArgs } from './MediaRequestUtils';

const promiseMap = new Map();

/**
 * Get a vector graphic via fetch API.
 * @param source Url which contains the source url
 * @param args APLContext methods that notifies core that media has loaded or failed to load
 * @return Promise that returns a Promise with either a string or undefined.
 */
export function fetchVectorGraphic(source: string, args: MediaRequestArgs): Promise<string | undefined> {
    let result: Promise<string | undefined>;

    if (promiseMap.has(source)) {
        // Wait for pending promise instead of fetching again.
        checkMediaLoadedOnCachedVectorGraphicSource(source, args);
        result =  promiseMap.get(source);
    } else {
        const requestPromise = vectorGraphicRequest(source, args);
        promiseMap.set(source, requestPromise);
        result =  requestPromise;
    }
    return result;
}

function checkMediaLoadedOnCachedVectorGraphicSource(mediaSource: string, args?: MediaRequestArgs) {
    const {
        renderer
    } = args;

    const requestPromise: Promise<string> = promiseMap.get(mediaSource);
    requestPromise.then((promise) => {
        if (renderer && renderer.context) {
            if (promise) {
                renderer.context.mediaLoaded(mediaSource);
            } else {
                renderer.context.mediaLoadFailed(mediaSource, HttpStatusCodes.BadRequest, `Bad request on ${mediaSource}`);
            }
        }
    });
}

function vectorGraphicRequest(source: string, args: MediaRequestArgs): Promise<string | undefined> {
    const {
        renderer
    } = args;

    return fetch(source, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        if (response.status === HttpStatusCodes.Ok) {
            if (renderer && renderer.context) {
                renderer.context.mediaLoaded(source);
            }
            return response.text();
        }
        if (renderer && renderer.context) {
            renderer.context.mediaLoadFailed(source, response.status, response.statusText);
        }
        return undefined;
    }).catch((error) => {
        if (renderer && renderer.context) {
            renderer.context.mediaLoadFailed(source, HttpStatusCodes.BadRequest, `Bad request: ${error.message} ${source}`);
        }
        return undefined;
    });
}
