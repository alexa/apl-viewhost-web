/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack as UnifiedStack } from '../unifiedBackstack/Stack';
import { Stack } from './Stack';

/**
 * The Clear command is used to remove all items from the backstack.
 */
export class ClearCommand {
    public static COMMAND_TYPE: string = 'Clear';
    /**
     * The Clear command has no additional properties.
     */
    constructor() {
    }

    /**
     * Remove all items from the provided backstack.
     * @param backstack the backstack to clear
     */
    public execute(backstack: Stack|UnifiedStack) {
        backstack.clear();
    }
}
