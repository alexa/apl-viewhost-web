/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

/**
 * @ignore
 */
export type DownloadState = 'pending' | 'complete' | 'cancelled';

/**
 * @ignore
 */
export class Resource {
  private downloadState : DownloadState;
  private buffer : ArrayBuffer;

  constructor() {
    this.downloadState = 'pending';
  }

  public setDownloadState(downloadState : DownloadState) : void {
    this.downloadState = downloadState;
  }

  public getDownloadState() : DownloadState {
    return this.downloadState;
  }

  public getBuffer() : ArrayBuffer {
    return this.buffer;
  }

  public setBuffer(buffer : ArrayBuffer) : void {
    this.buffer = buffer;
  }
}

/**
 * Resource State of the audio
 * @ignore
 */
export enum ResourceState {
  PENDING = 'pending',

  PREPARED = 'prepared',

  PLAYING = 'playing',

  PAUSED = 'paused'
}

/**
 * Resource for play media command, command name
 * @ignore
 */
export enum ControlMediaCommandName {
   PLAY = 'play',
   PAUSE = 'pause',
   NEXT = 'next',
   PREVIOUS = 'previous',
   REWIND = 'rewind',
   SEEK = 'seek',
   SETTRACK = 'setTrack'
}

/**
 * Playback state IDLE, PLAYING, ENDED, PAUSED, BUFFERING, ERROR
 * @ignore
 */
export enum PlaybackState {
  IDLE = 'idling',
  LOADED = 'loaded',
  PLAYING = 'playing',
  ENDED = 'ended',
  PAUSED = 'paused',
  BUFFERING = 'buffering',
  ERROR = 'error'
}
