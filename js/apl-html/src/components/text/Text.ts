/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as $ from 'jquery';
import APLRenderer from '../../APLRenderer';
import {FontStyle} from '../../enums/FontStyle';
import {PropertyKey} from '../../enums/PropertyKey';
import {TextAlign} from '../../enums/TextAlign';
import {TextAlignVertical} from '../../enums/TextAlignVertical';
import {FontUtils} from '../../utils/FontUtils';
import {replaceLastWordWithEllipsis, truncateEndWithEllipsis} from '../../utils/TextUtils';
import {IComponentProperties} from '../Component';
import {Component, FactoryFunction} from '../Component';
import {Geometry, ILineRange} from './Geometry';
import {MeasureMode} from './MeasureMode';
import {RichTextParser} from './RichTextParser';

export interface ITextProperties extends IComponentProperties {
    [PropertyKey.kPropertyColor]: number;
    [PropertyKey.kPropertyFontFamily]: string;
    [PropertyKey.kPropertyFontSize]: number;
    [PropertyKey.kPropertyFontWeight]: string | number;
    [PropertyKey.kPropertyFontStyle]: FontStyle;
    [PropertyKey.kPropertyLetterSpacing]: number;
    [PropertyKey.kPropertyLineHeight]: number;
    [PropertyKey.kPropertyMaxLines]: number;
    [PropertyKey.kPropertyText]: APL.StyledText;
    [PropertyKey.kPropertyTextAlign]: TextAlign;
    [PropertyKey.kPropertyTextAlignVertical]: TextAlignVertical;
}

/**
 * @ignore
 */
export interface ILine {
    lineNumber: number;
    start: number;
    end: number;
}

const utf8 = require('utf8');

export class Text extends Component<ITextProperties> {
    /** @internal */
    protected richTextParser: RichTextParser;

    /** @internal */
    protected textContainer: HTMLElement = document.createElement('p');

    /** @internal */
    protected $textContainer = $(this.textContainer);

    /** @internal */
    protected colorKaraoke: number;

    /** @internal */
    protected colorNonKaraoke: number;

    /** @internal */
    protected textCss: any = {
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
    protected styledText: any;

    /** @internal */
    protected maxLines: number;

    /** @internal */
    protected lineRanges: ILineRange[];

    /** @internal */
    private cacheKaraokeLineOffset = 0;

    /** @internal */
    private cacheKaraokeLine = 0;

    /** @internal */
    constructor(renderer: APLRenderer, component: APL.Component, factory: FactoryFunction, parent?: Component) {
        super(renderer, component, factory, parent);
        this.richTextParser = new RichTextParser();
        this.propExecutor
        (this.setDimensions, PropertyKey.kPropertyBounds, PropertyKey.kPropertyInnerBounds)
        (this.setText, PropertyKey.kPropertyText)
        (this.setFontStyle, PropertyKey.kPropertyFontStyle)
        (this.setFontWeight, PropertyKey.kPropertyFontWeight)
        (this.setLetterSpacing, PropertyKey.kPropertyLetterSpacing)
        (this.setLang, PropertyKey.kPropertyLang)
        (this.setFontSize, PropertyKey.kPropertyFontSize)
        (this.setLineHeight, PropertyKey.kPropertyLineHeight)
        (this.setFontFamily, PropertyKey.kPropertyFontFamily)
        (this.setTextAlign, PropertyKey.kPropertyTextAlign)
        (this.setTextAlignVertical, PropertyKey.kPropertyTextAlignVertical)
        (this.setTextClamping, PropertyKey.kPropertyMaxLines)
        (this.setColor, PropertyKey.kPropertyColor)
        (this.setKaraokeColors, PropertyKey.kPropertyColorKaraokeTarget, PropertyKey.kPropertyColorNonKaraoke);
    }

    /** @internal */
    public getLineRanges(): ILineRange[] {
        return this.lineRanges;
    }

    /** @internal */
    private resetKaraokeCache(): void {
        this.cacheKaraokeLineOffset = 0;
        this.cacheKaraokeLine = 0;
    }

    /** @internal */
    public getLineByRange(rangeStart: number, rangeEnd: number): number {
        if (rangeEnd < this.cacheKaraokeLineOffset) {
            this.resetKaraokeCache();
        }

        for (; this.cacheKaraokeLine < this.lineRanges.length; this.cacheKaraokeLine++) {
            const lineRange = this.lineRanges[this.cacheKaraokeLine];
            const lineText = this.styledText.text.substring(lineRange.start, lineRange.end + 1);
            const utf8TextAtLine = utf8.encode(lineText);

            if (rangeStart >= this.cacheKaraokeLineOffset &&
                rangeStart <= (this.cacheKaraokeLineOffset + utf8TextAtLine.length)) {
                return this.cacheKaraokeLine;
            }

            this.cacheKaraokeLineOffset += utf8TextAtLine.length;
        }

        this.resetKaraokeCache();

        return -1;
    }

    /** @internal */
    public getPlainText(): string {
        return this.styledText.text;
    }

    /**
     * Highlights a line
     * @param lineNumber, if undefined or not provided then will highlight all lines
     * @param unset on unhighlighting used to determine if the color style should be removed or the color just changed
     * @internal
     */
    public highlight(lineNumber?: number, unset?: boolean) {
        // make sure line ranges is available
        const updateStyleProp = (index: number, addColor: boolean) => {
            const lineElement: HTMLElement = this.textContainer.childNodes[index] as HTMLElement;
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

    private setTextClamping = () => {
        this.maxLines = this.props[PropertyKey.kPropertyMaxLines];
    }

    private setText = () => {
        this.styledText = this.props[PropertyKey.kPropertyText];
    }

    private setLang = () => {
        this.container.lang = this.lang;
    }

    private setFontStyle = () => {
        FontUtils.setFontStyle({
            element: this.textContainer,
            fontStyle: this.props[PropertyKey.kPropertyFontStyle],
            lang: this.lang
        });
    }

    private setFontWeight = () => {
        FontUtils.setFontWeight({
            element: this.textContainer,
            fontWeight: this.props[PropertyKey.kPropertyFontWeight],
            lang: this.lang
        });
    }

    private setFontFamily = () => {
        FontUtils.setFontFamily({
            element: this.textContainer,
            fontFamily: this.props[PropertyKey.kPropertyFontFamily],
            lang: this.lang
        });
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

    protected clipMaxLines(maxVisibleLines: number): boolean {
        let clipped = false;
        if (this.maxLines > 0) {
            maxVisibleLines = Math.min(this.maxLines, maxVisibleLines);
        }
        for (let i = this.textContainer.childNodes.length - 1; i >= maxVisibleLines; i--) {
            const childNode = this.textContainer.childNodes[i];
            this.textContainer.removeChild(childNode);
            clipped = true;
        }

        return clipped;
    }

    protected addEllipsis() {
        const ellipsis: string = '…';
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
        let newText = replaceLastWordWithEllipsis(oldText);

        if (newText === oldText) {
            // Text was unchanged as a result of this operation, this means there were no break points
            // we need to truncate a single long word and try again
            newText = truncateEndWithEllipsis(oldText);
        }
        $textNode.text(newText);
    }

    protected onPropertiesUpdated(): void {
        const {width, height} = this.innerBounds;
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

    protected applyCssShadow = (shadowParams: string) => {
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

    constructor(component: APL.Component, width: number, height: number) {
        super(null, component, null, null);
        this.$measurementBox.css('isolation', 'isolate');
        this.$measurementBox.css('width', width + 1);
        this.$measurementBox.css('height', height + 1);
    }

    /**
     * Returns clones of children
     */
    public getContents(): Node[] {
        const children = this.textContainer.childNodes;
        const ret = new Array<Node>(children.length);
        for (let i = 0; i < children.length; i++) {
            ret[i] = children[i].cloneNode(true);
        }

        return ret;
    }

    public onMeasure(
        width: number,
        widthMode: MeasureMode,
        height: number,
        heightMode: MeasureMode): { width: number,
                                    height: number,
                                    baseline: number,
                                    lineCount: number,
                                    plainText: string,
                                    laidOutText: string,
                                    isTruncated: boolean,
                                    textsByLine: string[],
                                    rectsByLine: number[][] } {
        this.$textContainer.css('width', '');
        this.$textContainer.css('height', '');

        this.addComponent();

        const ret = {width: 0,
                     height: 0,
                     baseline: 0,
                     lineCount: 0,
                     plainText: this.getPlainText(),
                     laidOutText: '',
                     isTruncated: false,
                     textsByLine: [] as string[],
                     rectsByLine: [] as number[][]};

        switch (widthMode) {
            case MeasureMode.Exactly:
                ret.width = width;
                break;
            case MeasureMode.AtMost:
            case MeasureMode.Undefined:
            default:
                if (isNaN(width)) {
                    ret.width = this.textContainer.clientWidth + 1;
                } else {
                    ret.width = Math.min(width, this.textContainer.clientWidth + 1);
                }
        }
        this.$textContainer.css('width', ret.width);

        switch (heightMode) {
            case MeasureMode.Exactly:
                ret.height = height;
                break;
            case MeasureMode.AtMost:
            case MeasureMode.Undefined:
            default:
                if (isNaN(height)) {
                    ret.height = this.textContainer.clientHeight + 1;
                } else {
                    ret.height = Math.min(height, this.textContainer.clientHeight + 1);
                }
        }

        this.doSplit();
        ret.lineCount = this.lineRanges.length;

        // Loop through all the lines to get text and rect of each line.
        for (const { start, end, top, height: lineHeight } of this.lineRanges) {
            const lineText = this.getPlainText().substring(start, end + 1);
            ret.textsByLine.push(lineText);

            const lineRect = [this.textContainer.clientLeft, top, this.textContainer.clientWidth, lineHeight];
            ret.rectsByLine.push(lineRect);
        }

        // A line space = line height + padding.
        const lineSpace = this.props[PropertyKey.kPropertyFontSize] *
            (this.props[PropertyKey.kPropertyLineHeight] || 1.25);
        const maxVisibleLines = Math.max(1, Math.floor(ret.height / lineSpace));
        // limit the number of times we can do this, so we dont get stuck in an infinite loop
        let iterations = 100;
        while (this.clipMaxLines(maxVisibleLines) && --iterations > 0) {
            this.addEllipsis();
            this.doSplit();
            ret.isTruncated = true;
        }

        if (ret.isTruncated) {
            // Loop through the laid out lines to get text of each line.
            for (const node of this.textContainer.childNodes) {
                ret.laidOutText += node.textContent;
            }
        } else {
            ret.laidOutText = this.getPlainText();
        }

        // Reset to the final container height after all the splits.
        ret.height = this.textContainer.clientHeight === 0 ? lineSpace : this.textContainer.clientHeight + 1;
        ret.baseline = ret.height * 0.5;
        this.$textContainer.css('height', ret.height);

        this.removeComponent();
        return ret;
    }

    protected onPropertiesUpdated(): void {
        this.reCreateDOM();
    }
}
