/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { IFragmentMarker, IBaseMarker } from '../media/audio/SpeechMarks';
import { ILineRange } from '../components/text/Geometry';
import { MarkSequencer } from './MarkSequencer';
import { ComponentType } from '../enums/ComponentType';

import { CommandHighlightMode } from '../enums/CommandHighlightMode';
import { CommandScrollAlign } from '../enums/CommandScrollAlign';

import { Text } from '../components/text/Text';
import APLRenderer from '../APLRenderer';

/**
 * @internal
 */
export class HighlightSequencer {
  protected align: CommandScrollAlign;
  protected markSequencer: MarkSequencer;
  protected textComponent: Text;
  protected lookAheadOffset: number = 0;
  protected lineRanges: ILineRange[];
  protected renderer: APLRenderer;

  public static shouldUseSequencer(
    markers: IBaseMarker[],
    componentType: number,
    highlightMode: CommandHighlightMode) {
    return markers
      && componentType === ComponentType.kComponentTypeText
      && highlightMode === CommandHighlightMode.kCommandHighlightModeLine;
  }

  constructor(
    textComponent: Text,
    align: CommandScrollAlign,
    markers: IBaseMarker[],
    renderer: APLRenderer) {
    this.textComponent = textComponent;
    this.lineRanges = textComponent.getLineRanges();
    this.align = align;
    this.renderer = renderer;
    this.markSequencer = new MarkSequencer(markers, this.onMarker.bind(this));
  }

  public stop() {
    this.markSequencer.stop();
    this.textComponent.unhighlight();
  }

  protected onMarker(marker: IFragmentMarker) {
    const plainText = this.textComponent.getPlainText();
    const plainTextIndex = plainText.indexOf(
      marker.value,
      this.lookAheadOffset
    );

    // phantom word (for e.g. markup that is not rendered)
    if (plainTextIndex === -1) {
      return;
    }

    this.lookAheadOffset = plainTextIndex + marker.value.length;
    const line = this.lineRanges.findIndex((lineRange: ILineRange) => {
      return (plainTextIndex >= lineRange.start) && (plainTextIndex <= lineRange.end);
    });

    if (line < 0) {
      return;
    }
    const range: ILineRange = this.lineRanges[line];
    this.textComponent.highlight(line);
    this.renderer.context.scrollToRectInComponent(this.textComponent.component,
      0,
      range.top,
      this.textComponent.bounds.width,
      range.height,
      this.align
    );
  }
}
