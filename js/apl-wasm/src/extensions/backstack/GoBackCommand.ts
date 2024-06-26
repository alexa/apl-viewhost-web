/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILogger, LoggerFactory } from '../..';
import { SavedDocument } from '../unifiedBackstack/SavedDocument';
import { Stack as UnifiedStack } from '../unifiedBackstack/Stack';
import { GoBackListener } from './GoBackListener';
import { IDocumentState } from './IDocumentState';
import { Stack } from './Stack';

/**
 * The GoBack command is used to return to a previous document in the backstack.
 */
export class GoBackCommand {
    private static logger: ILogger = LoggerFactory.getLogger('GoBackCommand');
    private goBackListener: GoBackListener;
    public static COMMAND_TYPE: string = 'GoBack';
    public static BACK_TYPE_KEY: string = 'backType';
    public static BACK_VALUE_KEY: string = 'backValue';
    public static COUNT_BACK_TYPE: string = 'count';
    public static INDEX_BACK_TYPE: string = 'index';
    public static ID_BACK_TYPE: string = 'id';
    public readonly type: string = GoBackCommand.COMMAND_TYPE;
    public readonly requireResolution: boolean = false;
    public readonly allowFastMode: boolean = false;
    public readonly backType: 'count' | 'index' | 'id';
    public readonly backValue: string | number;

    public constructor(params: object, goBackListener: GoBackListener) {
        this.backType = params[GoBackCommand.BACK_TYPE_KEY];
        this.backValue = params[GoBackCommand.BACK_VALUE_KEY];
        this.goBackListener = goBackListener;
    }

    /**
     * Execute this command instance on the current backstack.
     * @param backstack the current backstack.
     */
    public execute(backstack: Stack|UnifiedStack): void {
        let itemToGoBackTo: IDocumentState | SavedDocument | undefined;
        switch (this.backType) {
            case GoBackCommand.COUNT_BACK_TYPE:
                itemToGoBackTo = this.goBackCount(this.backValue as number, backstack);
                break;
            case GoBackCommand.INDEX_BACK_TYPE:
                itemToGoBackTo = this.goBackToIndex(this.backValue as number, backstack);
                break;
            case GoBackCommand.ID_BACK_TYPE:
                itemToGoBackTo = this.goBackToId(this.backValue as string, backstack);
                break;
            default:
                GoBackCommand.logger.warn(`Cannot execute unknown backType: ${this.backType}`);
        }
        if (itemToGoBackTo) {
            this.goBackListener.onGoBack(itemToGoBackTo);
        }
    }

    /**
     * Returns to the document that is the given number of documents behind the current document in the backstack.
     * @param count the number of documents to go back
     * @param backstack the current backstack
     */
    private goBackCount(count: number, backstack: Stack|UnifiedStack) {
        if (count > backstack.size() || count <= 0) {
            return undefined;
        }

        const index: number = backstack.size() - count;
        return this.goBackToIndex(index, backstack);
    }

    /**
     * Returns to the document with the given index in the backstack.
     * @param index the index in the backstack to go back to
     * @param backstack the current backstack
     */
    private goBackToIndex(index: number, backstack: Stack|UnifiedStack) {
        const initialSize = backstack.size();
        // Passing a negative index counts backwards through the array
        if (index < 0) {
            index += initialSize;
        }
        // When index doesn't match an existing element in the backstack
        // because of an out-of-bounds integer value, the GoBack command is ignored
        if (index >= initialSize || index < 0) {
            return undefined;
        } else {
            let documentAtIndex: IDocumentState | SavedDocument | undefined;
            do {
                documentAtIndex = backstack.pop();
                if (documentAtIndex instanceof SavedDocument && backstack.size() > index) {
                    documentAtIndex.destroy();
                }
            } while (backstack.size() > index);
            return documentAtIndex;
        }
    }

    /**
     * Returns to the document with the given backstackId in the backstack.
     * @param id the backstackId to go back to
     * @param backstack the current backstack
     */
    private goBackToId(id: string, backstack: Stack|UnifiedStack) {
        const index: number = backstack.getIds().lastIndexOf(id);
        // When the if doesn’t match an existing element in the backstack array
        // because of a non-existing string, the GoBack command is ignored
        if (index === -1) {
            return undefined;
        }
        return this.goBackToIndex(index, backstack);
    }
}
