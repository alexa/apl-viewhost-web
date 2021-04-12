/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * These properties are added to the environment under the common name of the backstack extension.
 */
export interface BackstackEnvironment {
    /**
     * True if the document is responsible for drawing a back button.
     */
    responsibleForBackButton: boolean;
    /**
     * The ids of the documents in the backstack.
     */
    backstack: string[];
}
