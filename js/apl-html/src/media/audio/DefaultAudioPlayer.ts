/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

'use strict';

import { AudioPlayer } from './AudioPlayer';
import { IAudioEventListener } from './IAudioEventListener';
import { DefaultAudioContextProvider, IAudioContextProvider } from './AudioContextProvider';

export class DefaultAudioPlayer extends AudioPlayer {
  protected contextProvider : IAudioContextProvider = new DefaultAudioContextProvider();

  constructor(eventListener : IAudioEventListener) {
    super(eventListener);
  }

  public play(id : string) {
    this.contextProvider.getAudioContext().then((context : AudioContext) => {
      super.playWithContext(id, context);
    }).catch((reason? : any) => {

    });
  }
}
