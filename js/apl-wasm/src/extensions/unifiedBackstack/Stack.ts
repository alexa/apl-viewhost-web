/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { LiveArray } from 'apl-html';
import { SavedDocument } from './SavedDocument';

/**
 * A stack which keeps track of the ids of all constituent items.
 */
export class Stack {
    private stackedItems: SavedDocument[];
    private idStack: LiveArray;

    public constructor() {
        this.idStack = LiveArray.create();
        this.stackedItems = [];
    }

    /**
     * Add an item to the top of the stack
     * @param item the item to add
     */
    public push(id: string, item: SavedDocument) {
        this.idStack.push_back(id);
        this.stackedItems.push(item);
    }

    /**
     * Remove the top item from the stack.
     */
    public pop(): SavedDocument | undefined {
        this.idStack.remove(this.idStack.size() - 1, 1);
        return this.stackedItems.pop();
    }

    /**
     * Returns the current size of the stack.
     */
    public size(): number {
        return this.stackedItems.length;
    }

    /**
     * Clears all items from the stack.
     */
    public clear(): void {
        this.stackedItems = [];
        this.idStack.clear();
    }

    /**
     * The ids for all items currently in the stack.
     */
    public getIds(): string[] {
        const ids: string[] = [];
        for (const item of this.stackedItems) {
            ids.push(item.getId());
        }
        return ids;
    }

    public getLiveIds(): LiveArray {
        return this.idStack;
    }

    public getStackedItems(): SavedDocument[] {
        return this.stackedItems;
    }
}
