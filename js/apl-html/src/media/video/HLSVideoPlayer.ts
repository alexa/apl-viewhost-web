/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

const hls = require('hls.js/dist/hls.light.min.js');
const path = require('path');
import { IMediaEventListener } from '../IMediaEventListener';
import { VideoPlayer } from './VideoPlayer';

/**
 * @ignore
 */
export class HLSVideoPlayer extends VideoPlayer {

    private hlsPlayer : any = undefined;

    constructor(eventListener : IMediaEventListener) {
        super(eventListener);
    }

    public load(id : string, url : string) : Promise<void> {
        this.player.id = id;
        const ext = path.extname(url);
        if (ext.includes('m3u8') || ext.includes('hls')) {
            return this.playHls(url, true);
        }
        return super.load(id, url);
    }

    public play(id : string, url : string, offset : number) : Promise<void> {
        this.player.id = id;
        const ext = path.extname(url);
        if (ext.includes('m3u8') || ext.includes('hls')) {
            return this.playHls(url, false);
        }
        return super.play(id, url, offset);
    }

    private playHls(url : string, loadMetadataOnly? : boolean) : Promise<void> {
        let playPromise : Promise<void>;
        if (this.hlsPlayer === undefined) {
            if (hls.isSupported()) {
                this.hlsPlayer = new hls();
            }
        }
        if (this.hlsPlayer !== undefined) {
            if (!loadMetadataOnly) {
                this.hlsPlayer.stopLoad();
                this.hlsPlayer.detachMedia();
            }
            this.hlsPlayer.loadSource(url);
            this.hlsPlayer.attachMedia(this.player);
            if (!loadMetadataOnly) {
                this.hlsPlayer.on(hls.Events.MANIFEST_PARSED, () => this.player.play());
            }
            playPromise = Promise.resolve();
        } else if (this.player.canPlayType('application/vnd.apple.mpegurl')) {
            this.player.src = url;
            if (!loadMetadataOnly) {
                this.player.addEventListener('loadedmetadata', () => this.player.play());
            }
            playPromise = Promise.resolve();
        }  else {
            playPromise = Promise.reject('The provided media format is not supported.');
        }
        return playPromise;
    }
}
