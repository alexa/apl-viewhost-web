/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

import { SpanType } from '../../enums/SpanType';
import { DocumentBuilder } from './DocumentBuilder';
import { Emoji } from './Emoji';

export interface IRichTextStyles {
    markColor : string;
}

export interface ISpannedTextNode {
    type : SpanType|'root'|'text'|'mark';
    start : number;
    end : number;
    text? : string;
    children? : ISpannedTextNode[];
}

/**
 * This class is used to convert plain text string into rich text format
 * @class StyledTextParser
 */
export class RichTextParser {
    private static spanCompare(a : ISpannedTextNode, b : ISpannedTextNode) : number {
        if (a.start > b.start) {
            return 1;
        } else if (a.start < b.start) {
            return -1;
        }

        if (a.type === 'mark') {
            return -1;
        } else if (b.type === 'mark') {
            return 1;
        }

        if (a.type === 'text') {
            return 1;
        } else if (b.type === 'text') {
            return -1;
        }

        return 0;
    }

    public styles : IRichTextStyles = {
        markColor: 'red'
    };

    /**
     * Process StyledText and convert it to rich text (dom) representation.
     * @param styledText StyledText retrieved from APL Core or karaoke processing.
     * @param existing optional existing element to attach text to.
     * @returns Resulting Rich text element.
     */
    public processStyledText(styledText : APL.StyledText, existing? : HTMLElement) : HTMLElement {
        const targetElement : HTMLElement = existing ? existing : document.createElement('p');
        if (existing) {
            while (targetElement.firstChild) {
                targetElement.removeChild(targetElement.firstChild);
            }
        }
        const outputText = styledText.text;
        const styleSpans : APL.TextSpan[] = styledText.spans;

        if (outputText) {
            const builder : DocumentBuilder = new DocumentBuilder(this.styles, outputText.length);
            if (styleSpans.length !== 0) {
                const spannedNodes : ISpannedTextNode[] = [];
                const spanStops = new Set<number>();

                // Get text breaks and record existing spans.
                styleSpans.forEach((styleSpan) => {
                    spanStops.add(styleSpan.start);
                    spanStops.add(styleSpan.end);
                    spannedNodes.push(
                        {type: styleSpan.type, start: styleSpan.start, end: styleSpan.end, children: [] });
                });
                spanStops.add(0);
                spanStops.add(outputText.length);

                // Extract text nodes.
                const sortedSpanStops = Array.from(spanStops).sort( (a, b) => a - b );
                const stopsLen = sortedSpanStops.length - 1;
                let emojiOffsetSum : number = 0;
                for (let i = 0; i < stopsLen; i++) {
                    const start : number = sortedSpanStops[i] + emojiOffsetSum;
                    let end : number = sortedSpanStops[i + 1] + (i + 1 === stopsLen ? 0 : emojiOffsetSum);
                    const spanEmojiOffset : number = Emoji.getEmojiOffset(outputText.slice(start, end));
                    emojiOffsetSum += spanEmojiOffset;
                    end += (i + 1 === stopsLen) ? 0 : spanEmojiOffset;
                    spannedNodes.push(
                        {type: 'text', start, end, text: outputText.slice(start, end)});
                }

                spannedNodes.sort(RichTextParser.spanCompare).forEach((span) => builder.add(span));
            } else {
                builder.add({type: 'text', start: 0, end: outputText.length, text: outputText});
            }

            builder.finalize(targetElement);
        }

        return targetElement;
    }
}
