/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import { IBaseMarker, IFragmentMarker } from '../media/audio/SpeechMarks';
const decode = require('utf8-decode');

/**
 * @ignore
 */
export interface IFragmentCallback {
  (marker : IFragmentMarker);
}

/**
 * @ignore
 */
export class MarkSequencer {
  protected epoch : number;
  protected markers : IBaseMarker[];
  protected timerId : number;
  protected callback : IFragmentCallback;

  constructor(markers : IBaseMarker[], callback : IFragmentCallback) {
    this.epoch = Date.now();
    this.callback = callback;

    this.markers = markers.reduce((markerSet : IBaseMarker[], marker : IBaseMarker) => {
      if (marker.type === 'word') {
        markerSet.push(
          {
            value: decode(marker.value),
            time: marker.time,
            type: marker.type
          }
        );
      }
      return markerSet;
    }, []);

    this.scheduleNext();
  }

  protected onElapsed() {
    this.timerId = null;
    const marker = this.markers.shift();
    this.callback(marker as IFragmentMarker);
    this.scheduleNext();
  }

  protected scheduleNext() {
    const elapsed = Date.now() - this.epoch;
    while (this.markers.length > 0) {
      const t = this.markers[0].time - elapsed;

      if (t >= 0) {
        this.timerId = window.setTimeout(this.onElapsed.bind(this), t);
        break;
      } else {
        this.markers.shift();
      }
    }
  }

  public stop() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
