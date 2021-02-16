/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import { LoggerFactory } from '../../logging/LoggerFactory';
import { ILogger } from '../../logging/ILogger';

const uuidv4 = require('uuid/v4');
import { Resource } from '../Resource';
import { IAudioEventListener } from './IAudioEventListener';
import { extractTextFrames } from './Id3Parser';
import { Demuxer } from './Demux';
import { CancelablePromise } from '../../utils/PromiseUtils';

export type AudioPlayerFactory = (eventListener : IAudioEventListener) => AudioPlayer;

export abstract class AudioPlayer {
  private eventListener : IAudioEventListener;
  private resourceMap : Map<string, Resource>;
  private currentSource : AudioBufferSourceNode;
  private decodePromise : CancelablePromise<AudioBuffer>;
  private static logger : ILogger = LoggerFactory.getLogger('AudioPlayer');

  constructor(eventListener : IAudioEventListener) {
    if (!eventListener) {
      throw new Error('eventListener is null');
    }
    this.eventListener = eventListener;
    this.resourceMap = new Map<string, Resource>();
  }

  public prepare(url : string, decodeMarkers : boolean) : string {
    const id = uuidv4();
    const resource : Resource = new Resource();
    this.resourceMap.set(id, resource);
    let promiseCancelled = false;

    fetch(url)
    .then((response : Response) => {
      // convert to ArrayBuffer
      if (resource.getDownloadState() === 'cancelled') {
        promiseCancelled = true;
        return Promise.reject(undefined);
      }
      // TODO Will need to use Polyfill library in future
      if (!response.ok) {
        throw new Error(`Provided URL download failed with status code ${response.status}`);
      }

      return response.arrayBuffer();
    })
    .then((arrayBuffer : ArrayBuffer) : PromiseLike<void> => {
      // demux audio and extract markers
      if (resource.getDownloadState() === 'cancelled') {
        promiseCancelled = true;
        return Promise.reject(undefined);
      }

      const demuxed = new Demuxer().demux(arrayBuffer);
      if (decodeMarkers) {
        try {
          const markers = extractTextFrames(arrayBuffer);
          if (markers.length > 0) {
            this.eventListener.onMarker(id, markers);
          }
        } catch (e) {
          // Text frame extraction has failed, we can continue but highlighting will not work
          AudioPlayer.logger.warn('Failed to extract text frames');
        }
      }
      // store audio buffer and call onPrepared()
      resource.setBuffer(demuxed);
      resource.setDownloadState('complete');
      this.eventListener.onPrepared(id);

      return undefined;
    })
    .catch((errorMessage) => {
      // handle errors
      if (!promiseCancelled) {
        this.onError(id, errorMessage);
      }
      this.resourceMap.delete(id);
    });

    return id;
  }

  protected onPlaybackFinished(id : string) {
    this.eventListener.onPlaybackFinished(id);
  }

  protected onError(id : string, reason : string) {
    this.eventListener.onError(id, reason);
  }

  public abstract play(id : string);

  protected playWithContext(id : string, audioContext : AudioContext) : void {
    const resource = this.resourceMap.get(id);
    if (!resource || !resource.getBuffer()) {
      this.onError(id, 'Not prepared');
      return;
    }

    // Only a single resource can be requested at one time
    if (this.decodePromise || this.currentSource) {
      this.onError(id, 'Previous request not complete');
      return;
    }

    const onDecode = (audioBuffer : AudioBuffer) => {
      this.currentSource = audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(audioContext.destination);

      this.currentSource.onended = (event : Event) => {
        this.currentSource.disconnect();
        this.currentSource = null;
        this.onPlaybackFinished(id);
        this.resourceMap.delete(id);
      };

      this.currentSource.start();
      this.eventListener.onPlaybackStarted(id);

      this.decodePromise = null;
    };
    const onDecodeError = (reason) : void => {
      this.onError(id, reason);
      this.decodePromise = null;
    };
    this.decodePromise = new CancelablePromise(
      audioContext.decodeAudioData(resource.getBuffer()),
      onDecode,
      onDecodeError);
  }

  protected cancelPendingAndRemoveCompleted() : void {
    const toDelete : string[] = [];
    this.resourceMap.forEach((resource : Resource, id : string) => {
      const state = resource.getDownloadState();
      if (state === 'pending') {
        resource.setDownloadState('cancelled');
      } else if (state === 'complete') {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id : string) => {
      this.resourceMap.delete(id);
    });
  }

  public flush() : void {
    if (this.decodePromise) {
      this.decodePromise.cancel();
      this.decodePromise = null;
    } else if (this.currentSource) {
      this.currentSource.stop();
    }
    this.cancelPendingAndRemoveCompleted();
  }
}
