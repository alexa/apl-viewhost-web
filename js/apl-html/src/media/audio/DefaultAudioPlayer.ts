/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { DefaultAudioContextProvider, IAudioContextProvider } from './AudioContextProvider';
import { AudioPlayer } from './AudioPlayer';
import { IAudioEventListener } from './IAudioEventListener';

export class DefaultAudioPlayer extends AudioPlayer {
  protected contextProvider: IAudioContextProvider = new DefaultAudioContextProvider();

  constructor(eventListener: IAudioEventListener) {
    super(eventListener);
  }

  public play(id: string) {
    this.contextProvider.getAudioContext().then((context: AudioContext) => {
      super.playWithContext(id, context);
    }).catch((reason?: any) => {
    });
  }
}
