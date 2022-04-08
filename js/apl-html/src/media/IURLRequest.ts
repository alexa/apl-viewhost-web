/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {LoggerFactory} from '../logging/LoggerFactory';

/**
 * URLRequest class stores the common elements required for any media source.
 * @ignore
 */
export interface IURLRequest {
    /**
     * The actual URL to load the media source from
     */
    url: string;

    /**
     * Request headers array
     */
    headers: string[];

}
/*
 * Convert an array of strings of the form "header:value" to a Headers object.
 */
export function parseHeaders(headerArray: string[]): Headers {
    const headers = new Headers();
    if (!headerArray) {
        return headers;
    }
    for (const header of headerArray) {
        const indexOfFirstColon = header.indexOf(':');
        if (indexOfFirstColon === -1) {
            const logger = LoggerFactory.getLogger('HeaderUtil');
            logger.warn('Skip appending header with invalid format');
            continue;
        }

        const headerName = header.substring(0, indexOfFirstColon);
        const headerValue = header.substring(indexOfFirstColon + 1);
        headers.append(headerName, headerValue);
    }
    return headers;
}

export function toUrlRequest(source: IURLRequest | string): IURLRequest {
    if (typeof source === 'string' || source instanceof String) {
        return {
            url: source as string,
            headers: []
        };
    } else {
        return source;
    }
}
