/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// const hls = require("hls.js/dist/hls.light.min.js");
// const path = require("path");
import * as $ from 'jquery';
import { IMediaEventListener } from '../IMediaEventListener';
import { PlaybackState } from '../Resource';
import { IPlayer } from '../IPlayer';

/**
 * @ignore
 */
export class VideoPlayer implements IPlayer {
    protected player : HTMLVideoElement;
    // private hlsPlayer: any = undefined;
    protected eventListener : IMediaEventListener;
    protected playbackState : PlaybackState;

    private playerEndTime : number;

    constructor(eventListener : IMediaEventListener) {
        this.player = document.createElement('video');
        this.eventListener = eventListener;
    }

    public configure(parent : HTMLElement, scale : 'contain'|'cover') {
        parent.appendChild(this.player);
        this.playbackState = PlaybackState.IDLE;
        Object.assign(this.player.style, {
            'height': '100%',
            'object-fit': scale,
            'width': '100%'
        });
        this.player.onplay = () : any => {
            this.sendPlaying();
            this.playbackState = PlaybackState.PLAYING;
        };
        this.player.onplaying = () : any => {
            this.sendPlaying();
            this.playbackState = PlaybackState.PLAYING;
        };
        this.player.onended = () : any => {
            this.eventListener.onEvent(PlaybackState.ENDED);
            this.playbackState = PlaybackState.ENDED;
        };
        this.player.onpause = () : any =>  {
            this.eventListener.onEvent(PlaybackState.PAUSED);
            this.playbackState = PlaybackState.PAUSED;
        };
        this.player.onerror = () : any => {
            this.eventListener.onEvent(PlaybackState.ERROR);
            this.playbackState = PlaybackState.ERROR;
        };
        this.player.onloadedmetadata = () : any => {
            this.eventListener.onEvent(PlaybackState.LOADED);
            this.playbackState = PlaybackState.LOADED;
        };
        this.player.ontimeupdate = () : any => {
            if (this.playbackState === PlaybackState.PLAYING) {
                this.eventListener.onEvent(PlaybackState.PLAYING);
            }
            this.onVideoTimeUpdated();
        };
    }

    public applyCssShadow = (shadowParams : string) => {
        $(this.player).css('box-shadow', shadowParams);
    }

    public load(id : string, url : string) : Promise<void> {
        this.player.id = id;
        if (this.player.src !== url) {
            this.playbackState = PlaybackState.IDLE;
            this.player.src = url;
            this.player.load();
        } else {
            this.eventListener.onEvent(PlaybackState.LOADED);
            this.playbackState = PlaybackState.LOADED;
        }
        return Promise.resolve();
    }

    public play(id : string, url : string, offset : number) : Promise<void> {
            if (this.playbackState !== PlaybackState.PAUSED && offset > this.player.currentTime) {
                // HTMLVidioElement is using second while offset is milliseconds.
                this.player.currentTime = offset / 1000;
            }
            return this.player.play();
    }

    public pause() : void {
        this.player.pause();
    }

    public mute() : void {
        this.player.muted = true;
    }

    public unmute() : void {
        this.player.muted = false;
    }

    public setVolume(volume : number) : void {
        this.player.volume = volume;
    }

    public flush() : void {
        this.pause();
    }

    public setCurrentTime(offsetInSecond : number) : void {
        this.player.currentTime = offsetInSecond;
    }

    public setEndTime(endTimeInSecond : number) : void {
        this.playerEndTime = endTimeInSecond;
    }

    public getCurrentPlaybackPosition() : number {
        return this.player.currentTime;
    }

    public getDuration() : number {
        // duration is in seconds.
        return this.player.duration;
    }

    public getMediaState() : PlaybackState {
        return this.playbackState;
    }

    public getMediaId() : string {
        return this.player.id;
    }

    private sendPlaying() {
        if (this.playbackState === PlaybackState.IDLE || this.playbackState === PlaybackState.PAUSED
            || this.playbackState === PlaybackState.ENDED || this.playbackState === PlaybackState.LOADED) {
            this.eventListener.onEvent(PlaybackState.PLAYING);
        }
    }

    private onVideoTimeUpdated() {
        if (this.playerEndTime && this.player.currentTime >= this.playerEndTime) {
            this.pause();
        }
    }
}
