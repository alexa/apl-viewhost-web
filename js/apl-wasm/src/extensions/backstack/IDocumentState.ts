/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Content } from 'apl-html';
import { ConfigurationChange } from '../../ConfigurationChange';

 /**
  * The IDocumentState is an object designed to cache the state of an active APL document such that it can
  * be re-inflated and restored.  i.e. as when used in Backstack navigation.
  */
export interface IDocumentState {
    id: string;
    token: string;
    context: APL.Context;
    content: Content;
    background: APL.IBackground;
    configurationChange: ConfigurationChange | undefined;
}

/**
 *
 * @param context The APL.Context to store as state.
 * @param content The Content to store for retrieving settings on state restoration.
 * @param token The presentationToken for the document.
 * @param id The id for the IDocumentState.
 */
export function createDocumentState(
    context: APL.Context,
    content: Content,
    token?: string,
    id?: string): IDocumentState {
    const documentState = {
        id,
        token,
        context,
        content,
        background : Object.assign({} as APL.IBackground, context.getBackground())
    } as IDocumentState;

    return documentState;
}
