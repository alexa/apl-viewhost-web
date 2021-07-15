/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {LayoutDirection} from '../../enums/LayoutDirection';
import {ILogger} from '../../logging/ILogger';
import {LoggerFactory} from '../../logging/LoggerFactory';

export interface BoundsFitterArgs {
    containingBounds: APL.Rect;
    innerBounds: APL.Rect;
    layoutDirection: LayoutDirection;
    logger?: ILogger;
}

export interface BoundsFitter {
    fitBounds(): APL.Rect;
}

export function createBoundsFitter(args: BoundsFitterArgs): BoundsFitter {
    const {
        containingBounds,
        innerBounds,
        layoutDirection
    } = args;

    let {
        logger
    } = args;

    logger = logger || LoggerFactory.getLogger('BoundsFitter');

    function fitBoundsLTR(): APL.Rect {
        const isBeyondBounds = innerBounds.width + innerBounds.left > containingBounds.width
            || innerBounds.height + innerBounds.top > containingBounds.height;

        if (!isBeyondBounds) {
            return innerBounds;
        }

        const {
            left,
            top
        } = innerBounds;

        const width = Math.min(containingBounds.width - innerBounds.left, innerBounds.width);
        const height = Math.min(containingBounds.height - innerBounds.top, innerBounds.height);

        return {
            left,
            top,
            width,
            height
        };
    }

    const fittingAlgorithms = {
        [LayoutDirection.kLayoutDirectionLTR]: fitBoundsLTR
    };

    return {
        fitBounds(): APL.Rect {
            if (!fittingAlgorithms.hasOwnProperty(layoutDirection)) {
                logger.warn(`Layout Direction ${layoutDirection} is not supported. No adjustments made.`);
                return innerBounds; // Sane Default OR throw Error whichever is more prudent
            }
            return fittingAlgorithms[layoutDirection]();
        }
    };
}
