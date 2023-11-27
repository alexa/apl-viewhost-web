/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is a singleton class that controls the cue style in APL vidoes
 * The settings will persist between APL Renderer sessions.
 */
export class CueControl {
    private style = document.createElement('style');
    private showing = true;
    private textColor: string;
    private textOpacity = 1;
    private fontSize: string;
    private fontFamily: string;
    private fontStyle: string;
    private backGroundColor: string;

    constructor() {
        const style = document.getElementById('apl-video-cue') as HTMLStyleElement;
        if (style) {
            this.style = style;
            return;
        }
        this.style.setAttribute('id', 'apl-video-cue');
        document.getElementsByTagName('head')[0].appendChild(this.style);
        this._update();
    }

    private _update(): void {
        const cssText = '.apl-video::cue { '
            + ( this.textColor ? `color: ${this.textColor}; ` : '' )
            + ( this.textOpacity ? `opacity: ${this.textOpacity}; ` : '' )
            + ( this.fontSize ? `font-size: ${this.fontSize}; ` : '' )
            + ( this.fontFamily ? `font-family: ${this.fontFamily}; ` : '' )
            + ( this.fontStyle ? `font-style: ${this.fontStyle}; ` : '' )
            + ( this.backGroundColor ? `background-color: ${this.backGroundColor}; ` : '' )
            + '}';
        this.style.innerHTML = cssText;
    }

    /**
     * Reset the cue style to default
     */
    public reset(): void {
        this.textColor = '';
        this.textOpacity = 1;
        this.fontSize = '';
        this.fontFamily = '';
        this.fontStyle = '';
        this.backGroundColor = '';
        this._update();
    }

    /**
     * Set the cue text color
     */
    public setColor(color: string): void {
        this.textColor = color;
        this._update();
    }

    /**
     * Set the cue text opacity
     */
    public setOpacity(opacity: number): void {
        this.textOpacity = opacity;
        this._update();
    }

    /**
     * Set the cue font size
     */
    public setFontSize(size: string): void {
        this.fontSize = size;
        this._update();
    }

    /**
     * Set the cue font family
     */
    public setFontFamily(family: string): void {
        this.fontFamily = family;
        this._update();
    }

    /**
     * Set the cue font style
     */
    public setFontStyle(style: string): void {
        this.fontStyle = style;
        this._update();
    }

    /**
     * Set the background color. Note: this is not supported by Chromium
     */
    public setBackgroundColor(color: string): void {
        this.backGroundColor = color;
        this._update();
    }

    /**
     * Make all cues in APL videos visible.
     */
    public show(): void {
        this.showing = true;
        const videos = document.querySelectorAll('video.apl-video');
        for (const video of videos) {
            this._showCue(video as HTMLVideoElement);
        }
    }

    /**
     * Hide all cues in APL videos.
     */
    public hide(): void {
        this.showing = false;
        const videos = document.querySelectorAll('video.apl-video');
        for (const video of videos) {
            this._hideCue(video as HTMLVideoElement);
        }
    }

    public isShowing(): boolean {
        return this.showing;
    }

    private _hideCue(video: HTMLVideoElement): void {
        const tracks = video.querySelectorAll('track');
        for (let i = 0; i < tracks.length; i++) {
            video.textTracks[i].mode = 'hidden';
        }
    }

    private _showCue(video: HTMLVideoElement): void {
        const tracks = video.querySelectorAll('track');
        for (let i = 0; i < tracks.length; i++) {
            video.textTracks[i].mode = 'showing';
            break;
        }
    }
}

export const cueControl: CueControl = new CueControl();
