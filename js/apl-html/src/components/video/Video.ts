/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import APLRenderer from '../../APLRenderer';
import { AudioTrack } from '../../enums/AudioTrack';
import { CommandControlMedia } from '../../enums/CommandControlMedia';
import { PropertyKey } from '../../enums/PropertyKey';
import { VideoScale } from '../../enums/VideoScale';
import { IMediaEventListener } from '../../media/IMediaEventListener';
import { IMediaSource } from '../../media/IMediaSource';
import { IMediaResource, PlaybackManager } from '../../media/PlaybackManager';
import { PlaybackState } from '../../media/Resource';
import { HLSVideoPlayer as VideoPlayer } from '../../media/video/HLSVideoPlayer';
import { Component, FactoryFunction } from '../Component';
import { AbstractVideoComponent } from './AbstractVideoComponent';

type CallbackFunction = () => void;

/**
 * @ignore
 */
export class Video extends AbstractVideoComponent {
    protected player = new VideoPlayer(this as IMediaEventListener);
    protected playbackManager : PlaybackManager;
    protected currentMediaResource : IMediaResource;
    protected currentMediaState : APL.IMediaState = {
        currentTime: 0,
        duration: 0,
        ended: false,
        paused: true,
        trackCount: 0,
        trackIndex: 0
    };
    protected audioTrack : AudioTrack;

    private videoState : PlaybackState = PlaybackState.IDLE;

    private playPromise : Promise<void>;
    private pausePromise : Promise<void>;
    private loadPromise : Promise<void>;

    private playCallback : undefined | CallbackFunction;
    private pauseCallback : undefined | CallbackFunction;
    private loadCallback : undefined | CallbackFunction;

    private fromEvent : boolean = false;
    private trackCurrentTime : number = 0;
    constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
        super(renderer, component, factory, parent);
        this.player = new VideoPlayer(this as IMediaEventListener);
        this.playbackManager = new PlaybackManager();
    }

    public onEvent(event : PlaybackState) : void {
        switch (event) {
            case PlaybackState.PLAYING:
                this.currentMediaState.ended = false;
                this.currentMediaState.paused = false;
                break;
            case PlaybackState.PAUSED:
                this.currentMediaState.paused = true;
                break;
            case PlaybackState.ENDED:
                if (this.playbackManager.repeat()) {
                    // Just rewind and play it again
                    this.rewind().then(() => this.play());
                } else if (this.playbackManager.hasNext()) {
                    this.next().then(() => this.play());
                } else {
                    this.currentMediaState.ended = true;
                }
                break;
            case PlaybackState.ERROR:
                this.logger.error('Playback error.');
                this.currentMediaState.ended = true;
                this.currentMediaState.paused = true;
                break;
            case PlaybackState.LOADED:
                this.currentMediaResource.loaded = true;
                break;
            case PlaybackState.BUFFERING: // FALLTHROUGH
            case PlaybackState.IDLE: // FALLTHROUGH
            default:
                return;
        }
        this.videoState = event;
        this.updateMediaState();
    }

    protected applyCssShadow = (shadowParams : string) => {
        if (this.player) {
            this.player.applyCssShadow(shadowParams);
        }
    }

    public async playMedia(source : IMediaSource | IMediaSource[], audioTrack : AudioTrack) {
        this.fromEvent = true;
        this.playbackManager.setup(source);
        this.audioTrack = audioTrack;
        this.currentMediaResource = this.playbackManager.getCurrent();
        await this.seek(this.currentMediaResource.offset);
        await this.play(this.audioTrack === AudioTrack.kAudioTrackForeground);
        this.fromEvent = false;
    }

    public async controlMedia(operation : CommandControlMedia, optionalValue : number) {
        this.fromEvent = true;
        switch (operation) {
            case CommandControlMedia.kCommandControlMediaPlay:
                await this.play();
                break;
            case CommandControlMedia.kCommandControlMediaPause:
                await this.pause();
                break;
            case CommandControlMedia.kCommandControlMediaNext:
                await this.next();
                break;
            case CommandControlMedia.kCommandControlMediaPrevious:
                await this.previous();
                break;
            case CommandControlMedia.kCommandControlMediaRewind:
                await this.rewind();
                break;
            case CommandControlMedia.kCommandControlMediaSeek:
                await this.seek(optionalValue);
                break;
            case CommandControlMedia.kCommandControlMediaSetTrack:
                await this.setTrack(optionalValue);
                break;
            default:
                this.logger.warn('Incorrect CommandControlMedia operation type');
                break;
        }
        this.fromEvent = false;
    }

    public async play(waitForFinish : boolean = false) {
        this.currentMediaResource = this.playbackManager.getCurrent();
        if (this.audioTrack === AudioTrack.kAudioTrackNone) {
            this.player.mute();
        } else {
            this.player.unmute();
        }

        this.resetPlayPromise();

        await this.ensureLoaded();

        if (this.currentMediaResource.duration > 0) {
            this.player.setEndTime((this.currentMediaResource.offset + this.currentMediaResource.duration) / 1000);
        }
        await this.player.play(this.currentMediaResource.id, this.currentMediaResource.url,
            this.currentMediaResource.offset);
        await this.playPromise;
        if (waitForFinish) {
            this.resetPausePromise();
            await this.pausePromise;
        }
    }

    public async pause() {
        if (this.videoState === PlaybackState.PLAYING || this.videoState === PlaybackState.BUFFERING) {
            this.resetPausePromise();
            this.player.pause();
            await this.pausePromise;
        }
    }

    public async next() {
        await this.pause();
        if (!this.playbackManager.hasNext()) {
            await this.player.setCurrentTime(this.player.getDuration() - 0.001);
            this.updateMediaState();
        } else {
            this.currentMediaResource = this.playbackManager.next();
            await this.ensureLoaded();
        }
    }

    public async previous() {
        await this.pause();
        this.currentMediaResource = this.playbackManager.previous();
        await this.ensureLoaded();
    }

    public async rewind() {
        await this.seek(this.currentMediaResource.offset);
    }

    public async seek(offset : number) {
        await this.pause();
        const mediaResource : IMediaResource = this.playbackManager.getCurrent();
        const startOffset : number = mediaResource.offset;
        const desireOffset : number = startOffset + offset;

        await this.ensureLoaded();

        if (this.player.getDuration() <= desireOffset / 1000) {
            // minus unit time otherwise will rollover to start
            this.player.setCurrentTime(this.player.getDuration() - 0.001);
        } else {
            this.player.setCurrentTime(desireOffset / 1000);
        }
        // video restore from back stack, check whether we should start play or remain pause
        if (this.props[PropertyKey.kPropertyAutoplay]) {
            await this.play();
        }
        this.updateMediaState();
    }

    public async setTrack(trackIndex : number) {
        await this.pause();
        this.playbackManager.setCurrent(trackIndex);
        this.currentMediaResource = this.playbackManager.getCurrent();
        await this.ensureLoaded();
    }

    protected setScale(scale : VideoScale) {
        let scaleType : 'contain' | 'cover' = 'contain';
        switch (scale) {
            case VideoScale.kVideoScaleBestFit:
                scaleType = 'contain';
                break;
            case VideoScale.kVideoScaleBestFill:
                scaleType = 'cover';
                break;
            default:
                this.logger.warn('Incorrect VideoScale type');
                break;
        }
        this.player.configure(this.container, scaleType);
    }

    protected setAudioTrack(audioTrack : AudioTrack) {
        this.audioTrack = audioTrack;
    }

    protected async setSource(source : IMediaSource | IMediaSource[]) {
        this.playbackManager.setup(source);
        if (this.props[PropertyKey.kPropertyAutoplay]) {
            await this.play();
        }
        if (this.props[PropertyKey.kPropertyTrackCurrentTime]) {
            await this.seek(this.trackCurrentTime);
        }
    }

    protected setTrackCurrentTime(trackCurrentTime : number) {
        this.trackCurrentTime = trackCurrentTime;
    }

    protected setTrackIndex(trackIndex : number) {
        if (this.props[PropertyKey.kPropertyTrackIndex]) {
            this.setTrack(trackIndex);
        }
    }

    /**
     * extract currentTime value in integer value since Medici parse this value as int
     */
    protected extractCurrentTime(currentTime : number) : number {
        const currentTimeString = currentTime.toString();
        const parts : string[] = currentTimeString.split('.');
        // return the part before decimal
        if (parts[0]) {
            return Number(parts[0]);
        }
        return 0;
    }

    protected updateMediaState() {
        this.currentMediaState.currentTime = this.extractCurrentTime(this.player.getCurrentPlaybackPosition() * 1000);
        this.currentMediaState.duration = this.player.getDuration();
        this.currentMediaState.trackCount = this.playbackManager.getTrackCount();
        this.currentMediaState.trackIndex = this.playbackManager.getCurrentIndex();
        this.component.updateMediaState(this.currentMediaState, this.fromEvent);
        this.emit('onUpdateMediaState', this.currentMediaState, this.fromEvent);

        if (this.loadPromise &&
            this.currentMediaResource.loaded) {
            this.loadPromise = undefined;
            this.loadCallback();
        }

        if (this.playPromise &&
            (this.currentMediaState.ended === false && this.currentMediaState.paused === false)) {
            this.playPromise = undefined;
            this.playCallback();
        }

        if (this.pausePromise &&
            (this.currentMediaState.paused === true || this.currentMediaState.ended === true)) {
            this.pausePromise = undefined;
            this.pauseCallback();
        }
    }

    private resetPausePromise() {
        if (this.pausePromise) {
            this.pauseCallback();
        }
        this.pausePromise = new Promise<void>((res) => {
            this.pauseCallback = res;
        });
    }

    private resetPlayPromise() {
        if (this.playPromise) {
            this.playCallback();
        }
        this.playPromise = new Promise<void>((res) => {
            this.playCallback = res;
        });
    }

    private resetLoadPromise() {
        if (this.loadPromise) {
            this.loadCallback();
        }
        this.loadPromise = new Promise<void>((res) => {
            this.loadCallback = res;
        });
    }

    private async ensureLoaded() {
        if (!this.currentMediaResource.loaded) {
            this.resetLoadPromise();
            await this.player.load(this.currentMediaResource.id, this.currentMediaResource.url);
            await this.loadPromise;
        } else {
            this.updateMediaState();
        }
    }

    public destroy() {
        super.destroy();
        // to prevent component go destroy before saving media state
        this.updateMediaState();
    }
}
