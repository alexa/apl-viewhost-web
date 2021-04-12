/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import { FontStyle } from '../../enums/FontStyle';
import { PropertyKey } from '../../enums/PropertyKey';
import { TextAlign } from '../../enums/TextAlign';
import { TextAlignVertical } from '../../enums/TextAlignVertical';
import { IComponentProperties } from '../Component';
import { Component, FactoryFunction } from '../Component';
import { RichTextParser } from './RichTextParser';
import { Geometry, ILineRange } from './Geometry';
import { FontUtils } from '../../utils/FontUtils';
import { MeasureMode } from './MeasureMode';
import XRegExp = require('xregexp');

export interface ITextProperties extends IComponentProperties {
  [PropertyKey.kPropertyColor] : number;
  [PropertyKey.kPropertyFontFamily] : string;
  [PropertyKey.kPropertyFontSize] : number;
  [PropertyKey.kPropertyFontWeight] : string | number;
  [PropertyKey.kPropertyFontStyle] : FontStyle;
  [PropertyKey.kPropertyLetterSpacing] : number;
  [PropertyKey.kPropertyLineHeight] : number;
  [PropertyKey.kPropertyMaxLines] : number;
  [PropertyKey.kPropertyText] : APL.StyledText;
  [PropertyKey.kPropertyTextAlign] : TextAlign;
  [PropertyKey.kPropertyTextAlignVertical] : TextAlignVertical;
}

/**
 * @ignore
 */
export interface ILine {
  lineNumber : number;
  start : number;
  end : number;
}

export class Text extends Component<ITextProperties> {
  /** @internal */
  protected richTextParser : RichTextParser;

  /** @internal */
  protected textContainer : HTMLElement = document.createElement('p');

  /** @internal */
  protected $textContainer = $(this.textContainer);

  /** @internal */
  protected colorKaraoke : number;

  /** @internal */
  protected colorNonKaraoke : number;

  /** @internal */
  protected textCss : any = {
    'display': 'table-cell',
    'overflow-wrap': 'break-word',
    'white-space': 'pre-wrap',
    '-webkit-user-select': 'none',
    '-moz-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none',
    'hyphens': 'none'
  };

  /** @internal */
  protected styledText : any;

  /** @internal */
  protected maxLines : number;

  /** @internal */
  protected lineRanges : ILineRange[];

  /** @internal */
  constructor(renderer : APLRenderer, component : APL.Component, factory : FactoryFunction, parent? : Component) {
    super(renderer, component, factory, parent);
    this.richTextParser = new RichTextParser();
    this.propExecutor
      (this.setDimensions, PropertyKey.kPropertyBounds, PropertyKey.kPropertyInnerBounds)
      (this.setText, PropertyKey.kPropertyText)
      (this.setFontStyle, PropertyKey.kPropertyFontStyle)
      (this.setFontWeight, PropertyKey.kPropertyFontWeight)
      (this.setLetterSpacing, PropertyKey.kPropertyLetterSpacing)
      (this.setFontSize, PropertyKey.kPropertyFontSize)
      (this.setLineHeight, PropertyKey.kPropertyLineHeight)
      (this.setFontFamily, PropertyKey.kPropertyFontFamily)
      (this.setTextAlign, PropertyKey.kPropertyTextAlign)
      (this.setTextAlignVertical, PropertyKey.kPropertyTextAlignVertical)
      (this.setTextClamping, PropertyKey.kPropertyMaxLines)
      (this.setColor, PropertyKey.kPropertyColor)
      (this.setKaraokeColors, PropertyKey.kPropertyColorKaraokeTarget, PropertyKey.kPropertyColorNonKaraoke)
      (this.setTextOpacity, PropertyKey.kPropertyOpacity);
  }

  /** @internal */
  public getLineRanges() : ILineRange[] {
    return this.lineRanges;
  }

  /** @internal */
  public getPlainText() : string {
    return this.styledText.text;
  }

  /**
   * Highlights a line
   * @param lineNumber, if undefined or not provided then will highlight all lines
   * @param unset on unhighlighting used to determine if the color style should be removed or the color just changed
   * @internal
   */
  public highlight(lineNumber? : number, unset? : boolean) {
    // make sure line ranges is available
    const updateStyleProp = (index : number, addColor : boolean) => {
      const lineElement : HTMLElement = this.textContainer.childNodes[index] as HTMLElement;
      if (addColor) {
        lineElement.style.color = Component.numberToColor(this.colorKaraoke);
      } else {
        if (unset) {
          lineElement.style.removeProperty('color');
        } else {
          lineElement.style.color = Component.numberToColor(this.colorNonKaraoke);
        }
      }
    };
    this.setKaraokeColors();
    for (let i = 0; i < this.textContainer.childNodes.length; i++) {
      const addColor = (lineNumber === undefined) || (lineNumber === i);
      updateStyleProp(i, addColor);
    }
  }

  /**
   * Unihighlights all lines
   * @internal
   */
  public unhighlight() {
    this.highlight(-1, true);
  }

  public setDimensions = () => {
    this.setBoundsAndDisplay();

    this.$textContainer.css(this.textCss);

    this.$textContainer.css('width', this.innerBounds.width);
    this.$textContainer.css('height', this.innerBounds.height);
    this.$textContainer.css('word-break', 'break-word');
  }

  protected setTextOpacity = () => {
    this.setOpacity();
    this.$textContainer.css('opacity', this.props[PropertyKey.kPropertyOpacity]);
  }

  private setTextClamping = () => {
    this.maxLines = this.props[PropertyKey.kPropertyMaxLines];
  }

  private setText = () => {
    this.styledText = this.props[PropertyKey.kPropertyText];
  }

  private setFontStyle = () => {
    const fontStyle = FontUtils.getFontStyle(this.props[PropertyKey.kPropertyFontStyle]);
    this.$textContainer.css('font-style', fontStyle);
  }

  private setFontWeight = () => {
    this.$textContainer.css('font-weight', this.props[PropertyKey.kPropertyFontWeight]);
  }

  private setLetterSpacing = () => {
    this.$textContainer.css('letter-spacing', this.props[PropertyKey.kPropertyLetterSpacing]);
  }

  private setFontSize = () => {
    this.$textContainer.css('font-size', this.props[PropertyKey.kPropertyFontSize]);
  }

  private setLineHeight = () => {
    this.$textContainer.css('line-height', this.props[PropertyKey.kPropertyLineHeight]);
  }

  private setFontFamily = () => {
    const fontFamily = FontUtils.getFont(this.props[PropertyKey.kPropertyFontFamily]);
    this.$textContainer.css('font-family', fontFamily);
  }

  private setTextAlign = () => {
    switch (this.props[PropertyKey.kPropertyTextAlign]) {
      case TextAlign.kTextAlignCenter:
        this.$container.css('text-align', 'center');
        break;
      case TextAlign.kTextAlignLeft:
        this.$container.css('text-align', 'left');
        break;
      case TextAlign.kTextAlignRight:
        this.$container.css('text-align', 'right');
        break;
      case TextAlign.kTextAlignAuto:
        break;
      default:
        this.logger.warn(`Incorrect TextAlign type: ${this.props[PropertyKey.kPropertyTextAlign]}`);
        break;
    }
  }

  private setTextAlignVertical = () => {
    switch (this.props[PropertyKey.kPropertyTextAlignVertical]) {
      case TextAlignVertical.kTextAlignVerticalCenter:
        this.$textContainer.css('vertical-align', 'middle');
        break;
      case TextAlignVertical.kTextAlignVerticalBottom:
        this.$textContainer.css('vertical-align', 'bottom');
        break;
      case TextAlignVertical.kTextAlignVerticalTop:
        this.$textContainer.css('vertical-align', 'top');
        break;
      case TextAlignVertical.kTextAlignVerticalAuto:
        break;
      default:
        this.logger.warn(`Incorrect TextAlignVertical type: ${this.props[PropertyKey.kPropertyTextAlign]}`);
        break;
    }
  }

  private setColor = () => {
    const color = this.props[PropertyKey.kPropertyColor];
    this.$textContainer.css('color', Component.numberToColor(color));
  }

  private setKaraokeColors = () => {
    if (this.renderer && this.renderer.getLegacyKaraoke()) {
      this.colorKaraoke = this.props[PropertyKey.kPropertyColor];
      this.colorNonKaraoke = this.props[PropertyKey.kPropertyColorNonKaraoke];
      this.$textContainer.css('color', Component.numberToColor(this.colorNonKaraoke));
    } else {
      this.colorKaraoke = this.props[PropertyKey.kPropertyColorKaraokeTarget];
      this.colorNonKaraoke = this.props[PropertyKey.kPropertyColor];
    }
  }

  protected reCreateDOM() {
    this.textContainer = this.richTextParser.processStyledText(this.styledText, this.textContainer);
    this.container.appendChild(this.textContainer);
  }

  protected doSplit() {
    const geom = new Geometry(this.textContainer, this.innerBounds.top);

    // We try a few times to get a good split, the problem is that adding the per-line data tags actually affects
    // the layout which then causes our line offsets to be incorrect
    this.lineRanges = geom.splitByLine();
    let changed = true;
    let iterations = 3;
    while (changed && --iterations >= 0) {
      changed = false;
      const newLineRanges = geom.splitByLine();
      if (this.lineRanges.length !== newLineRanges.length) {
        changed = true;
      } else {
        for (let i = 0; i < newLineRanges.length; ++i) {
          if (this.lineRanges[i].start !== newLineRanges[i].start) {
            changed = true;
            break;
          }
        }
      }
      this.lineRanges = newLineRanges;
    }
  }

  protected clipMaxLines() : boolean {
    let clipped = false;
    if (this.maxLines === 0) {
      return clipped;
    }
    for (let i = this.textContainer.childNodes.length - 1; i >= this.maxLines; i--) {
      const childNode = this.textContainer.childNodes[i];
      this.textContainer.removeChild(childNode);
      clipped = true;
    }

    return clipped;
  }

  protected addEllipsis() {
    const ellipsis : string = '…';
    const $lastChildNode = $(this.textContainer.childNodes[this.textContainer.childNodes.length - 1]);
    // Locate the last data node which has contents - do this search to avoid modifying the textContent
    // directly which would cause issues by removing styles
    let $textNode = $lastChildNode.find('data:not(:has(*))').last();
    if ($textNode && $textNode.text() === ellipsis) {
      // Handle the case where we have a text node which only contains ellipsis
      $textNode.remove();
      $textNode = $lastChildNode.find('data:not(:has(*))').last();
    }
    if (!$textNode) {
      return;
    }
    const oldText = $textNode.text();
    const breakPointRegex = XRegExp('\\P{L}*\\p{Z}(\\p{L})*$');
    let newText = XRegExp.replace(oldText, breakPointRegex, ellipsis);
    if (newText === oldText) {
      // Text was unchanged as a result of this operation, this means there were no break points
      // we need to truncate a single long word and try again
      const lastCharacterRegex = XRegExp('\\p{L}\\P{L}*$');
      newText = XRegExp.replace(newText, lastCharacterRegex, ellipsis);
    }
    $textNode.text(newText);
  }

    protected onPropertiesUpdated() : void {
      const { width, height } = this.innerBounds;
      const m = new TextMeasurement(this.component, width, height);
      m.init();
      m.onMeasure(
        width,
        MeasureMode.Exactly,
        height,
        MeasureMode.Exactly
      );

      // remove children
      while (this.textContainer.firstChild) {
        this.textContainer.removeChild(this.textContainer.firstChild);
      }

    // add contents
      const contents = m.getContents();
      for (const c of contents) {
      this.textContainer.appendChild(c);
    }
      this.container.appendChild(this.textContainer);
      this.lineRanges = m.getLineRanges();
  }

  protected applyCssShadow = (shadowParams : string) => {
    this.$textContainer.css('text-shadow', shadowParams);
  }
}

/**
 * Places text on an remote container and is primarily used to
 * to measure text.
 */
export class TextMeasurement extends Text {
  protected measurementBox = document.createElement('div');
  protected $measurementBox = $(this.measurementBox);

  protected addComponent() {
    document.body.appendChild(this.measurementBox);
    this.measurementBox.appendChild(this.textContainer);
  }

  protected removeComponent() {
    this.measurementBox.removeChild(this.textContainer);
    document.body.removeChild(this.measurementBox);
  }

  constructor(component : APL.Component, width : number, height : number) {
    super(null, component, null, null);
    this.$measurementBox.css('isolation', 'isolate');
    this.$measurementBox.css('width',  width + 1);
    this.$measurementBox.css('height', height + 1);
  }

  /**
   * Returns clones of children
   */
  public getContents() : Node[] {
    const children = this.textContainer.childNodes;
    const ret = new Array<Node>(children.length);
    for (let i = 0; i < children.length; i++) {
      ret[i] = children[i].cloneNode(true);
    }

    return ret;
  }

  public onMeasure(
    width : number,
    widthMode : MeasureMode,
    height : number,
    heightMode : MeasureMode) : { width : number, height : number } {
    this.$textContainer.css('width', '');
    this.$textContainer.css('height', '');

    this.addComponent();

    const ret = { width: 0, height: 0 };

    switch (widthMode) {
        case MeasureMode.Exactly:
          ret.width = width;
          break;
        case MeasureMode.AtMost:
        case MeasureMode.Undefined:
        default:
            ret.width = Math.min(width, this.textContainer.clientWidth + 1);
    }

    this.$textContainer.css('width', ret.width);
    this.doSplit();

    // limit the number of times we can do this, so we dont get stuck in an infinite loop
    let iterations = 100;
    while (this.clipMaxLines() && --iterations > 0) {
      this.addEllipsis();
      this.doSplit();
    }

    const lineHeight = this.textContainer.clientHeight === 0 ?
      this.props[PropertyKey.kPropertyFontSize] * (this.props[PropertyKey.kPropertyLineHeight] || 1.25) :
      this.textContainer.clientHeight;

    if (heightMode === MeasureMode.Exactly) {
      ret.height = height;
    } else if (heightMode === MeasureMode.AtMost) {
      ret.height = Math.min(height, lineHeight + 1);
    } else if (heightMode === MeasureMode.Undefined) {
      ret.height = lineHeight + 1;
    }
    this.$textContainer.css('height', ret.height);

    this.removeComponent();
    return ret;
  }

  protected onPropertiesUpdated() : void {
    this.reCreateDOM();
  }
}
