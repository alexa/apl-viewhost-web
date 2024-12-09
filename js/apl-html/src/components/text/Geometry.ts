/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import { allNodes, allTextNodes } from './NodeTraverse';

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
    for (const lineRange of lineRanges) {
      // for any given lineRange, find the nodes that encloses it
      // https://javascript.info/selection-range

      let endNode: Node = undefined;
      let startNode: Node = undefined;
      const nodes = allNodes(this.element); // use generator
      let nodeCounter = 0;
      let nodeSelected = -1;
      let wrap = false;
      for (const n of nodes) {
        if (n.nodeType === Node.TEXT_NODE) {
          if (nodeSelected >= 0) {
            break;
          }
          if (lineRange.start >= offset && lineRange.start < (offset + n.textContent.length)) {
            startNode = n;
          }
          if (lineRange.end >= offset && lineRange.end < (offset + n.textContent.length)) {
            endNode = n;
            nodeSelected = nodeCounter;
            range.setEnd(endNode, lineRange.end + 1 - offset);
            if (lineRange.end + 1 !== offset + n.textContent.length) {
              wrap = true;
            }
          }
          offset += n.textContent.length;
        } else if (this.isLineBreakElement(n) && nodeCounter === nodeSelected + 1 && !wrap) {
          endNode = n;
          nodeSelected = nodeCounter;
          range.setEndAfter(endNode);
        }
        nodeCounter++;
      }
      if (endNode === undefined) {
        return;
      }

      /*
      extractContents removes content while making the remainder valid
      i.e. inserts tags at head of remainder

      <b>hello world</b>
              ^
              | cut off point

      extractContents() === "<b>hello </b>"
      remainder === "<b>world</b>"

      For something an element which has children, like a <li> element,
      this will split the list item into multiple list items and incorrectly
      add the parent element. This occur where children are broken across lines.
      <li>hello world</li>
              ^
              | cut off point

      extractContents() === "<li>hello </li>"
      remainder === "<li>world</li>"
      The code below detects when this occurs, and appends the split lines as
      children of the appropriate element.

      1. If the item is a list item, use the id to determine if it is a continuation
         of an existing list item.
         a. If so, append to the list so it does not create a new bullet.
         b. If not, and there is an unordered list in progess, add to that list.
      2. If it is a new list item, or not a list item, just append as-is. The new list
         item will start a new ordered list.
      */

      // Is this text a list item?
      const liAncestor = this.getAncestorWithName('LI', startNode);
      let lastDocumentFragment = undefined;
      if (lines.length > 0) {
        lastDocumentFragment = lines[lines.length - 1];
      }

      // Was the last item added to the DOM a list item?
      let lastListItems = undefined;
      if (lastDocumentFragment) {
        lastListItems = lastDocumentFragment.firstElementChild.getElementsByTagName('li');
      }

      // Check if the item was a list item, and if the IDs match.
      // Cannot just use an `===` operator because the layout process changes the elements
      // and would not recognize the same parent.
      // This will occur if a list item wraps to a new line, or a list item contains multiple
      // children.
      let idsMatch = false;
      if (liAncestor && lastListItems && lastListItems.length > 0) {
        const lastElementTest = lastListItems[lastListItems.length - 1];
        if ((lastElementTest as Element).getAttribute('id') === (liAncestor as Element).getAttribute('id')) {
          idsMatch = true;
        }
      }

      if (liAncestor && idsMatch) {
        // startNode is just a textNode from the previous step. This is
        // necessary so any styling on this text will be preserved.
        while (startNode.parentElement.nodeName !== 'LI') {
            startNode = startNode.parentElement;
        }
        range.setStartBefore(startNode);
        const content = range.extractContents();
        const dataElement = document.createElement('data');
        dataElement.appendChild(content);
        lastListItems[lastListItems.length - 1].appendChild(dataElement);
      } else if (liAncestor && this.containsChildWithName('UL', lastDocumentFragment)) {
        // If this is a list item and we can appending to an existing list
        let listStart = liAncestor;
        while (listStart.parentElement.nodeName !== 'UL') {
            listStart = listStart.parentElement;
        }
        range.setStartBefore(listStart);
        const content = range.extractContents();
        let lastElement = lastDocumentFragment;
        while (lastElement.nodeName !== 'UL' && lastElement.firstChild) {
          lastElement = lastElement.firstChild;
        }
        lastElement.appendChild(content);
      } else {
        // Otherwise delete any styling that may be floating around as it could
        // lead to unexpected whitespace, then append the line.
        const cleanupRange = document.createRange();
        cleanupRange.setStart(this.element, 0);
        cleanupRange.setEndBefore(startNode);
        cleanupRange.extractContents();
        range.setStart(this.element, 0);
        const content = range.extractContents();
        lines.push(content);
      }

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

  private isLineBreakElement(node: Node) {
    return node.nodeName === 'BR';
  }

  private getAncestorWithName(tag: string, node: Node): Node {
    while (node && node !== this.element && node.nodeName !== 'DIV') {
      if (node.nodeName === tag) {
        return node;
      } else {
        node = node.parentElement;
      }
    }

    if (node.nodeName === tag) {
        return node;
    }
    return undefined;
  }

  private containsChildWithName(tag: string, node: Node): boolean {
    if (node.nodeName === tag) {
      return true;
    }
    while (node.firstChild) {
      if (node.nodeName === tag) {
        return true;
      }
      node = node.firstChild;
    }
    return false;
  }
}
