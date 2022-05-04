/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
const uuidv4 = require('uuid/v4');
import { IMediaSource } from './IMediaSource';

/**
 * Media resource state
 * @ignore
 */
export interface IMediaResource {
    toRepeat: number;
    description: string;
    offset: number;
    repeatCount: number;
    trackIndex: number;
    url: string;
    id: string;
    loaded: boolean;
    duration: number;
}

/**
 * @ignore
 */
export class PlaybackManager {
    private current: number;
    private resources: Map<number, IMediaResource> = new Map<number, IMediaResource>();

    public setup(sources: IMediaSource | IMediaSource[]) {
        this.resources.clear();
        if (Array.isArray(sources)) {
            let idx = 0;
            for (const source of (sources as IMediaSource[])) {
                this.addToPlaylist(idx, source);
                idx++;
            }
        } else {
            this.addToPlaylist(0, sources);
        }
        this.current = 0;
    }

    public getCurrentIndex() {
        return this.current;
    }

    public getTrackCount() {
        return this.resources.size;
    }

    public getCurrent(): IMediaResource {
        const currentResource = this.resources.get(this.current);
        if (!currentResource) {
            throw new Error('Sources misconfigured.');
        }
        return currentResource;
    }

    public next(): IMediaResource {
        if (this.current < this.resources.size - 1) {
            const currentResource = this.resources.get(this.current);
            currentResource.loaded = false;
            this.current++;
        }
        this.reset();
        return this.getCurrent();
    }

    public previous(): IMediaResource {
        if (this.current > 0) {
            const currentResource = this.resources.get(this.current);
            currentResource.loaded = false;
            this.current--;
        }
        this.reset();
        return this.getCurrent();
    }

    public setCurrent(index: number) {
        if (this.current !== index) {
            const currentResource = this.resources.get(this.current);
            currentResource.loaded = false;
        }
        this.current = index;
        this.reset();
    }

    public hasNext(): boolean {
        const currentResource = this.resources.get(this.current);
        return !!(currentResource && this.resources.get(this.current + 1));
    }

    public hasPrevious(): boolean {
        const currentResource = this.resources.get(this.current);
        return !!(currentResource && this.resources.get(this.current - 1));
    }

    public repeat(): boolean {
        const currentResource = this.resources.get(this.current);
        if (currentResource && currentResource.repeatCount === -1) {
            return true;
        }
        if (currentResource && currentResource.toRepeat > 0) {
            currentResource.toRepeat--;
            return true;
        }
        return false;
    }

    private addToPlaylist(index: number, track: IMediaSource) {
        const mediaResource: IMediaResource = {
            description : track.description,
            id : uuidv4(),
            offset : track.offset,
            repeatCount : track.repeatCount,
            toRepeat : track.repeatCount,
            trackIndex : index,
            url : track.url,
            loaded : false,
            duration : track.duration
        };

        this.resources.set(index, mediaResource);
    }

    private reset() {
        const currentResource = this.resources.get(this.current);
        if (currentResource) {
            currentResource.toRepeat = currentResource.repeatCount;
        }
    }
}
