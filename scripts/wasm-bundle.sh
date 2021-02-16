#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

JS_DIR=js

# Subshell into JS code directory
for dir in $JS_DIR
do
  (
    cd $dir || exit 1

    # Install Dependencies
    yarn install
    # Build Bundle
    yarn build:wasm:prod
    # move bundle to main location
    mv apl-wasm/lib/index.js ../index.js
    cd ..
  )
done
