/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpanType } from '../../enums/SpanType';
import { ILogger } from '../../logging/ILogger';
import { LoggerFactory } from '../../logging/LoggerFactory';
import { RichTextParser } from './RichTextParser';
import { ILine } from './Text';

/**
 * @ignore
 */
export class RichTextNode {
    private static logger: ILogger = LoggerFactory.getLogger('RichTextNode');
    public parser: RichTextParser;
    public lines: Map<number, ILine> = new Map<number, ILine>();
    public originalText: string;
    private isHighlighted = false;
    constructor(public element: HTMLElement) {
        this.parser = new RichTextParser();
        this.originalText = element.textContent as string;
    }
    /**
     * Highlights the part of this leaf node that resides on line `lineNumber`
     * @param lineNumber The line number to highlight
     */
    public highlight(lineNumber: number): boolean {
        if (!this.lines.has(lineNumber)) {
            return false;
        }
        if (!this.element.parentNode) {
            throw new Error(`Cannot highlight text that doesn't have a parent`);
        }
        const line = this.lines.get(lineNumber) as ILine;
        const styledText: APL.StyledText = {text: this.originalText, spans: []};
        let parent = this.element.parentElement;
        // decorations live higher up the node heirarchy, so we need to search for them
        // and add the markup at the correct location
        while (parent) {
            if (parent.style.textDecoration && parent.style.textDecoration.length > 0) {
                const decorations = parent.style.textDecoration.split(' ');
                for (const decoration of decorations) {
                    switch (decoration) {
                        case 'line-through':
                            styledText.spans.push({type: SpanType.kSpanTypeStrike, start: line.start, end: line.end});
                            break;
                        case 'underline':
                            styledText.spans.push(
                                {type: SpanType.kSpanTypeUnderline, start: line.start, end: line.end});
                            break;
                        default:
                            RichTextNode.logger.warn('Incorrect decoration type');
                            break;
                    }
                }
            }
            parent = parent.parentElement;
        }
        styledText.spans.push({type: 'mark', start: line.start, end: line.end});
        this.parser.processStyledText(styledText, this.element);
        this.isHighlighted = true;
        return true;
    }
    /**
     * Removes highlighting
     */
    public unhighlight() {
        if (!this.isHighlighted) {
            return;
        }
        this.isHighlighted = false;
        this.parser.processStyledText({text: this.originalText, spans: []}, this.element);
    }
}
