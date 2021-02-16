/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

 /**
  * A Live object is a single APL Object that changes over time.  LiveMaps are
  * created and modified by ViewHosts.
  *
  * Inside of the APL document the LiveMap may be used normally in data-binding
  * contexts.  For example:
  *
  *     {
  *       "type": "Text",
  *       "text": "The live object is currently '${MyLiveMap}'"
  *     }
  *
  *  The same LiveMap may be used by multiple Context objects. This allows
  *  an application to create a single LiveMap to track a source of changing
  *  data and display it in multiple view hosts simultaneously.
  *
  *  Changing the key-value pairs in a live map will update all data-bound
  *  values currently in the component hierarchy that depend on those values.
  */
export class LiveMap {

    /**
     * Create a LiveMap with an initial Object
     * @param map The initial Map.
     * @return The LiveMap
     */
    public static create(map? : any) : LiveMap {
        return new LiveMap(map);
    }
    public liveMap : APL.LiveMap;

    private constructor(map? : any) {
        this.liveMap = Module.LiveMap.create(map);
    }

    /**
     * Check to see if there are no elements in the map
     * @return True if the map is empty
     */
    public empty() : boolean {
        return this.liveMap.empty();
    }

    /**
     * Clear all elements from the map
     */
    public clear() : void {
        this.liveMap.clear();
    }

    /**
     * Retrieve a value from the map.  If the key does not exist, a NULL object
     * will be returned.
     * @param key The key of the object to return.
     * @return The internal object.
     */
    public get(key : string) : any {
        return this.liveMap.get(key);
    }

    /**
     * Check to see if a key exists in the map.
     * @param key The key to search for.
     * @return True if the key exists.
     */
    public has(key : string) : boolean {
        return this.liveMap.has(key);
    }

    /**
     * Set a key-value pair in the map.
     * @param key The key to insert
     * @param value The value to store.
     */
    public set(key : string, value : string) : void {
        this.liveMap.set(key, value);
    }

    /**
     * Set a collection of values from a different map
     * @map The object map to copy values from.
     */
    public update(map : any) : void {
        this.liveMap.update(map);
    }

    /**
     * Replace the LiveMap with a new map.
     * @param map The new map to set.
     */
    public replace(map : any) : void {
        this.liveMap.replace(map);
    }

    /**
     * Remove a key from the map
     * @param key The key to remove
     * @return True if the key was found and removed.
     */
    public remove(key : string) : boolean {
        return this.liveMap.remove(key);
    }
}
