/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import APLRenderer from '../APLRenderer';
import { EventMediaType } from '../enums/EventMediaType';
import { ILogger } from '../logging/ILogger';
import { LoggerFactory } from '../logging/LoggerFactory';
import { loadAllImagesFromMediaSource } from './ImageRetrievalUtils';

export interface MediaRequestArgs {
    renderer: APLRenderer;
    logger?: ILogger;
}

export const requestMedia = async (
    mediaEvent: number,
    source: string[],
    args: MediaRequestArgs) => {
    args = ensureDefaultMediaRequestArgs(args);

    const {
        logger
    } = args;

    if (mediaRequestMap[mediaEvent]) {
        return await mediaRequestMap[mediaEvent](source, args);
    }
    logger.error(`Cannot make a media request with type ${mediaEvent}`);
};

const mediaRequestMap = {
    [EventMediaType.kEventMediaTypeImage]: async (imageSource, args) => {
            const { renderer } = args;
            return await loadAllImagesFromMediaSource(imageSource, renderer);
        },
    [EventMediaType.kEventMediaTypeVectorGraphic]: async (vectorGraphicSource, args) => {
            const { renderer } = args;
            return await renderer.onRequestGraphic(vectorGraphicSource[vectorGraphicSource.length - 1]);
        },
    [EventMediaType.kEventMediaTypeVideo]:  () => {
    }
};

function ensureDefaultMediaRequestArgs(args: MediaRequestArgs) {
    const defaultArgs = {
        logger: LoggerFactory.getLogger('MediaRequestUtils')
    };

    return Object.assign(defaultArgs, args);
}
