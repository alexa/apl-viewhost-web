/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

/**
 * Generate text nodes of all descendent of given root
 *
 * @param root Containing node
 */
function* textNodes(root: Node) {
  const nodesToVisit = [root];

  while (nodesToVisit.length > 0) {
    const n = nodesToVisit.shift();
    if (n.nodeType === Node.TEXT_NODE) {
      yield n;
    }
    // tslint:disable-next-line
    for (let i = n.childNodes.length - 1; i >= 0; i--) {
      nodesToVisit.unshift(n.childNodes[i]);
    }
  }
}

/**
 * Get nodes of all descendents of a given root
 *
 * @param root Containing node
 */
export function *allNodes(root: Node) {
  const nodesToVisit = [root];

  while (nodesToVisit.length > 0) {
    const n = nodesToVisit.shift();
    yield n;

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
