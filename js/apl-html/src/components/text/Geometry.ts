/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { allTextNodes, textNodes } from './NodeTraverse';

/**
 * Specifies a range of text on a single line
 */
export interface ILineRange {
  /**
   * Inclusive start index of text for this line
   */
  start: number;

  /**
   * Inclusive end index of text for this line
   */
  end: number;

  /**
   * Top offset from top of containing element
   */
  top: number;

  /**
   * Height of line
   */
  height: number;

  /**
   * Bottom offset from top of containing element
   * (same as top + height)
   */
  bottom: number;
}

export interface IAxis {
  top: number;
  bottom: number;
  height: number;
}

const isNewLine = (boxA: IAxis, boxB: IAxis): boolean => {
  const halfHeight = boxA.height / 2;
  const midpoint = boxA.top + halfHeight;
  const floatingBottom = boxA.bottom + halfHeight;

  /*
  Case 1: boxB.top > midPoint

  This is the usual case where the measured node falls on a new line,
  we use midpoint to avoid running into rounding errors or overlapping boundary conditions.
+--------boxA--+
|              |
|              |
|              |
+-  midpoint  -+
|              |
|         +----------boxB--+ <-----+ boxB.top
|         |    |           |
+--------------+           |
          |                |
          |                |
          |                |
          |                |
          |                |
          +----------------+
  */

  /*
  Case 2: boxB.bottom > floatingBottom

  This is a degenerate case (see adjustBoundingBox for reference),
  the measured nodes bounding box encloses boxA in which case we
  place a floatingBottom and use boxB.bottom for comparision.

         +----------------boxB--+
         |                      |
  +--------boxA--+              |
  |      |       |              |
  |      |       |              |
  |      |       |              |
  |      |       |              |
  |      |       |              |
  |      |       |              |
  |      |       |              |
  +--------------+              |
         |                      |
         |                      |
+----------- floatingBottom ------+
         |                      |
         |                      |
         +----------------------+ <----------+ boxB.bottom
  */
  return (boxB.top > midpoint) || (boxB.bottom > floatingBottom);
};

const adjustBoundingBox = ( existingBox: IAxis, newBox: IAxis): IAxis => {
  let rect: IAxis = undefined;
  const halfHeight = existingBox.height / 2;

  /*
  The following case happens on Chrome 53, when measuring a node at the start of the line
  with no breaking space on the previous line, the returned bounding box fully encloses
  existingBox and measuredNode:

  i.e. newBox - existingBox = measuredNode
  +---------------+----------------------------+
  |               |                            |
  |  existingBox  |                            |
  |               |                            |
  +---------------+      newBox                |
  |               |                            |
  |  measuredNode |                            |
  |               |                            |
  +---------------+----------------------------+

  We check for condition by looking at the height difference between existingBox and newBox,
  i.e. if the height of newBox is > 1.5 times the height of existingBox
  */
  if (newBox.height > (existingBox.height + halfHeight)) {
    rect = {
      top: existingBox.bottom,
      bottom: newBox.bottom,
      height: existingBox.height
    };
  } else {
    rect = {
      top: newBox.top,
      bottom: newBox.bottom,
      height: newBox.height
    };
  }
  return rect;
};

/**
 * Measures and re-arranges text by line
 */
export class Geometry {
  private element: HTMLElement;
  private scalingY: number;
  private parentY: number;
  private parentPadding: number;
  private offsetTop: number;

  /**
   * @param element A text containing element
   */
  public constructor(element: HTMLElement, offsetTop: number) {
    this.element = element;
    this.scalingY = this.element.offsetHeight / this.element.getBoundingClientRect().height;
    this.parentY = this.element.getBoundingClientRect().top;
    this.parentPadding = this.element.offsetTop / this.scalingY;
    this.offsetTop = offsetTop;
  }

  protected createLineRange(start: number, end: number, box: IAxis): ILineRange {
    const top = (this.parentPadding + box.top - this.parentY) * this.scalingY;
    const height = box.height * this.scalingY;
    const bottom = (this.parentPadding + box.bottom - this.parentY) * this.scalingY;
    return {
      start,
      end,
      top,
      height,
      bottom
    };
  }

  /**
   * Given an arbitrary set of nodes in a textElement,
   * splits nodes at line boundaries, i.e. after this operation:
   *
   * textElement.childNodes.count === lineRanges.length
   *
   * This allows for efficient styling of individual lines, without having
   * to re-layout the entire textElement
   *
   * @returns {ILineRange[]} A list of line ranges
   */
  public splitByLine(): ILineRange[] {
    const ret: ILineRange[] = [];
    const nodes = allTextNodes(this.element);
    const range = document.createRange();
    const parentRect = this.element.getBoundingClientRect();
    let prev: IAxis = undefined;
    let lineStart = 0;
    let offset = 0;

    // for each node
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // for each character in that node
      for (let j = 0; j < node.textContent.length; j++) {
        const isLastCharacter = (i === (nodes.length - 1)) && (j === (node.textContent.length - 1));

        range.setStart(node, j);
        range.setEnd(node, j + 1);
        const clientRect = range.getBoundingClientRect();
        const boundingBoxTop = clientRect.top - parentRect.top + this.offsetTop;
        const boundingBoxBottom = clientRect.bottom - parentRect.top + this.offsetTop;
        const boundingBox: IAxis = {
            top : boundingBoxTop,
            bottom: boundingBoxBottom,
            height: boundingBoxBottom - boundingBoxTop
          };

        if (!prev) {
          prev = boundingBox;
        }

        const newLine = isNewLine(prev, boundingBox);

        if (isLastCharacter && !newLine) {
          // push everything up to and including 'this' character
          ret.push(this.createLineRange(
              lineStart,
              offset + j,
              prev
            )
          );
        } else if (newLine) {
          // push everything up to but _not_ including 'this' character
          ret.push(this.createLineRange(
              lineStart,
              offset + j - 1,
              prev
            )
          );
          prev = adjustBoundingBox(prev, boundingBox);
          if (isLastCharacter) {
            // push 'this' character as line, since it caused a new line
            // and is also the last character
            ret.push(this.createLineRange(
                offset + j,
                offset + j,
                prev
              )
            );
          }

          lineStart = offset + j;
        }
      }
      offset += node.textContent.length;
    }

    this.split(ret);
    return ret;
  }

  protected split(lineRanges: ILineRange[]): void {
    const range = document.createRange();
    let offset = 0;
    const lines: Node[] = [];

    // tslint:disable-next-line
    for (let i = 0; i < lineRanges.length; i++) {
      // for any given lineRange.end, find the that node that encloses it
      const lineRange = lineRanges[i];
      let node: Node = undefined;
      const nodes = textNodes(this.element); // use generator
      for (const n of nodes) {
        if (lineRange.end < (offset + n.textContent.length)) {
          node = n;
          break;
        }
        offset += n.textContent.length;
      }
      if (node === undefined) {
        return;
      }

      range.setStart(this.element, 0);
      range.setEnd(node, (lineRange.end + 1 - offset));

      /*
      extractContents removes content while making the remainder valid
      i.e. inserts tags at head of reminder

      <b>hello world</b>
              ^
              | cut off point

      extractContents() === "<b>hello </b>"
      remainder === "<b>world</b>"
      */
      const content = range.extractContents();
      lines.push(content);

      offset = lineRange.end + 1;
    }

    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    lines.forEach((line: Node) => {
      const dataElement = document.createElement('data');
      dataElement.appendChild(line);
      this.element.appendChild(dataElement);
    });
  }
}
