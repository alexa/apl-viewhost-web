/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

/**
 * A LiveArray is a public class that holds an array of Objects that changes
 * over time.  LiveArrays are created and modified by ViewHosts.
 *
 * Inside of the APL document the LiveArray may be used normally in the
 * data-binding context.  If used as the "data" target for a multi-child component,
 * a LayoutRebuilder will be assigned to add and remove components from the component
 * as the LiveArray changes.
 *
 * For example:
 *
 *     {
 *       "type": "Sequence",
 *       "data": "${MyLiveArray}",
 *       "item": {
 *         "type": "Text",
 *         "text": "${index+1}. ${data}"
 *       }
 *     }
 *
 * As per the above example, when this sequence is first inflated there
 * will be three text components:  "1. Object A", "2. Object B", "3. Object C".
 * After the push_back and remove commands, the text components will now
 * be "1. Object B", "2. Object C", "3. Object D".
 *
 * The same LiveArray may be used by multiple RootContext objects. This allows
 * an application to create a single LiveArray to track a source of changing data
 * and display it in multiple view hosts simultaneously.
 *
 * Please note that changing LiveArray values has a limited effect on the
 * component hierarchy. A component with children bound to a live array will
 * have new children inserted and removed, but changing the value stored in
 * an existing LiveArray index will not cause that child to be re-inflated.
 */
export class LiveArray {

    /**
     * Create a LiveArray with an initial Object vector
     * @param array The vector of objects. Values should be stringified.
     * @return The LiveArray
     */
    public static create(array? : any[]) : LiveArray {
        return new LiveArray(array);
    }
    public liveArray : APL.LiveArray;

    private constructor(array? : any[]) {
        this.liveArray = Module.LiveArray.create(array);
    }

    /**
     * Check to see if there are no elements in the map
     * @return True if the array is empty
     */
    public empty() : boolean {
        return this.liveArray.empty();
    }

    /**
     * Clear all elements from the array
     */
    public clear() : void {
        this.liveArray.clear();
    }

    /**
     * @return The number of elements in the array.
     */
    public size() : number {
        return this.liveArray.size();
    }

    /**
     * Retrieve an object in the array.  If position is out of bounds, a NULL object
     * will be returned.
     * @param position The index of the object to return.
     * @return The object or a null object.
     */
    public at(position : number) : any {
        return this.liveArray.at(position);
    }

    /**
     * Insert a new object into the array.  The position must fall within the range [0,size]
     * @param position The position at which to insert the object.
     * @param value The object to insert.
     * @return True if position was valid and the object was inserted.
     */
    public insert(position : number, value : any) : boolean {
        return this.liveArray.insert(position, value);
    }

    /**
     * Insert a range of objects into the array. The position must fall within the range [0,size]
     * @param position The position at which to insert the objects.
     * @param array array to insert.
     * @return True if the position was valid and at least one object was inserted.
     */
    public insertRange(position : number, array : any[]) : boolean {
        return this.liveArray.insertRange(position, array);
    }

    /**
     * Remove an object from the array.  The position must fall within the range [0,size)
     * @param position The position at which the object will be removed.
     * @param count Number of items to remove.
     * @return True if the position was valid and the object was removed.
     */
    public remove(position : number, count : number = 1) : boolean {
        return this.liveArray.remove(position, count);
    }

    /**
     * Change the value of an object at a position
     * @param position The position where the object will be changed
     * @param value The value it will be changed to.
     * @return True if the position was valid and the object was changed
     */
    public update(position : number, value : any) : boolean {
        return this.liveArray.update(position, value);
    }

    /**
     * Update a range of objects in the array.  The starting position must fall within the range
     * [0,size - count], where count is the number of objects being modified.
     * @tparam InputIt The source iterator type
     * @param position The starting position where objects should be updated
     * @param array array to use in update.
     * @return True if the position was valid and at least one object was updated.
     */
    public updateRange(position : number, array : any[]) : boolean {
        return this.liveArray.updateRange(position, array);
    }

    /**
     * Push an object onto the back of the array.
     * @param value The object to push.
     */
    public push_back(value : any) : void {
        this.liveArray.push_back(value);
    }

    /**
     * Push a range of objects onto the array.
     * @param array array to push.
     * @return True if at least one object was pushed onto the array.
     */
    public push_backRange(array : any[]) : boolean {
        return this.liveArray.push_backRange(array);
    }
}
