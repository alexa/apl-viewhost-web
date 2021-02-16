/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { IDocumentState } from "../IDocumentState";

/**
 * Defines the callback for when a GoBack command is executed.
 */
export interface GoBackListener {
    /**
     * Called with the item to go back to on GoBack.
     * @param itemToGoBackTo the item to go back to
     */
    onGoBack(itemToGoBackTo : IDocumentState);
}