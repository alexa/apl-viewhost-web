/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import {Component} from '../components/Component';
import {Text} from '../components/text/Text';
import {Event} from './Event';
import {EventProperty} from '../enums/EventProperty';
import {IPlaybackEventListener} from '../AudioPlayerWrapper';
import {CommandHighlightMode} from '../enums/CommandHighlightMode';
import {CommandScrollAlign} from '../enums/CommandScrollAlign';
import {HighlightSequencer} from './HighlightSequencer';
import {ComponentType} from '..';

/**
 * @internal
 */
export class Speak extends Event implements IPlaybackEventListener {
  protected component : Component;
  protected highlightMode : CommandHighlightMode;
  protected align : CommandScrollAlign;
  protected highlightSequencer : HighlightSequencer;
  protected textComponent : Text;

  public onPlaybackStarted() {
    this.renderer.onSpeakEventStart(this.type);
    const markers = this.renderer.audioPlayer.getLatestMarkers();
    const componentType = this.component.component.getType();
    const useSequencer = HighlightSequencer.shouldUseSequencer(markers,
      componentType,
      this.highlightMode
    );
    if (useSequencer) {
      this.highlightSequencer = new HighlightSequencer(this.component as Text,
        this.align,
        markers,
        this.renderer
      );
    } else if (this.highlightMode === CommandHighlightMode.kCommandHighlightModeBlock &&
        componentType === ComponentType.kComponentTypeText) {
      this.textComponent = (this.component as Text);
      this.textComponent.highlight();
    }
  }

  public onPlaybackFinished() {
    if (this.highlightSequencer) {
      this.highlightSequencer.stop();
    } else if (this.textComponent) {
      this.textComponent.unhighlight();
    }
    if (!this.isTerminated) {
      this.renderer.onSpeakEventEnd(this.type);
      this.resolve();
      super.terminate();
    }
  }

  public async execute() {
    this.component = this.renderer.componentMap[this.event.getComponent().getUniqueId()];
    this.align = this.event.getValue<CommandScrollAlign>(EventProperty.kEventPropertyAlign);
    this.highlightMode = this.event.getValue<CommandHighlightMode>(EventProperty.kEventPropertyHighlightMode);

    this.renderer.audioPlayer.playLatest(this);
  }

  public terminate() {
    this.renderer.onSpeakEventEnd(this.type);
    super.terminate();
    if (this.highlightSequencer) {
      this.highlightSequencer.stop();
    } else if (this.textComponent) {
      this.textComponent.unhighlight();
    }
    this.renderer.audioPlayer.stop();
    this.destroy();
  }
}
