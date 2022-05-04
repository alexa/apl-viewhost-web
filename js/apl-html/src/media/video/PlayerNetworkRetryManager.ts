/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

const hls = require('hls.js/dist/hls.light.min.js');

export interface PlayerNetworkRetryManagerArgs {
    player: HTMLVideoElement | any;
    numberOfRetries?: number;
    errorCallback?: () => void;
}

export interface PlayerNetworkRetryManager {
    fail: () => void;
    shouldRetry: () => boolean;
    retry: (url: string, errorDetails: string) => void;
}

export function createPlayerNetworkRetryManager(args: PlayerNetworkRetryManagerArgs): PlayerNetworkRetryManager {
    const defaultArgs = {
        numberOfRetries: 3,
        errorCallback: () => {}
    };

    args = Object.assign(defaultArgs, args);

    const {
        player,
        errorCallback
    } = args;

    let remainingTries = args.numberOfRetries;

    return {
        fail(): void {
            errorCallback();
        },
        retry(url, errorDetails): void {
            remainingTries -= 1;

            if (errorDetails === hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                errorDetails === hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
                errorDetails === hls.ErrorDetails.MANIFEST_PARSING_ERROR) {
                player.loadSource(url);
            } else {
                player.startLoad();
            }
        },
        shouldRetry(): boolean {
            return remainingTries > 0;
        }
    };
}
