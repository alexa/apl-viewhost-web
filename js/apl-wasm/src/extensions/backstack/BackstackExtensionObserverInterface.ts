/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { IDocumentState } from "../IDocumentState";

/**
 * Defines the callback for when a GoBack command is executed.
 */
export interface BackstackExtensionObserverInterface {
    /**
     * Used to notify the observer when the extension has successfully popped a documentState
     * @param documentState the document to go back to
     */
    onRestoreDocumentState(documentState : IDocumentState);
}
