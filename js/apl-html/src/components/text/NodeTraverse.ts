/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

/**
 * The actual Text inside an Element or Attr
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 */
const NODE_TYPE_TEXT = 3;

/**
 * Generate text nodes of all descendent of given root
 *
 * @param root Containing node
 */
export function* textNodes(root: Node) {
  const nodesToVisit = [root];

  while (nodesToVisit.length > 0) {
    const n = nodesToVisit.shift();
    if (n.nodeType === NODE_TYPE_TEXT) {
      yield n;
    }
    // tslint:disable-next-line
    for (let i = n.childNodes.length - 1; i >= 0; i--) {
      nodesToVisit.unshift(n.childNodes[i]);
    }
  }
}

/**
 * Get text nodes of all descendent of given root
 *
 * @param root Containing node
 */
export const allTextNodes = (root: Node): Node[] => {
  return [...textNodes(root)];
};
