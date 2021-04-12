/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

/**
 * A wrapper to expose resolution functions
 *
 * @internal
 */
export class PromiseContainer<T> {
  public promise : Promise<T>;
  public accept : (result : T) => void;
  public reject : (reason? : any) => void;

  constructor() {
    this.promise = new Promise<T>((accept, reject) => {
      this.accept = accept;
      this.reject = reject;
    });
  }
}

/**
 * A cancelable promise wrapper
 *
 * @internal
 */
export class CancelablePromise<T> {
  protected cancelled : boolean;
  protected hasRun : boolean;

  constructor(innerPromise : Promise<T>, accept : (result : T) => void, reject? : (reason? : any) => void) {
    innerPromise.then((value : T) => {
      if (!this.cancelled) {
        accept(value);
      }
      this.hasRun = true;
    }).catch((reason) => {
      if (reject) {
        reject(reason);
      } else {
        throw new Error(reason);
      }
    });
  }

  public cancel() {
    if (this.cancelled) {
      throw new Error('Promise has already been marked as cancelled');
    } else if (this.hasRun) {
      throw new Error('Promise has already run and cannot be cancelled');
    }
    this.cancelled = true;
  }
}
