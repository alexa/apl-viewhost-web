#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

realpath() {
  [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

# Create a temporary working directory
TEMP_DIR=tmp
mkdir $TEMP_DIR

# Subshell into that dir
for dir in $TEMP_DIR
do
  (
    cd $dir || exit 1
    # Clone EMSDK
    git clone https://github.com/emscripten-core/emsdk.git

    # Subshell into emsdk
    expectedEmSDKDir=emsdk
    for subdir in $expectedEmSDKDir
    do
      (
        cd $subdir || exit 1
        # install and activate
        ./emsdk install sdk-1.38.39-64bit
        ./emsdk activate sdk-1.38.39-64bit
        source ./emsdk_env.sh
        cd ..
      )
    done

    # Make emcmake tool available
    source "$(pwd)/emsdk/emsdk_env.sh"

    # Clone APL Core Dependency
    version="1.6.0"
    tagName="v${version}"
    repoUrl='https://github.com/alexa/apl-core-library.git'
    git clone --depth 1 --branch "$tagName" "$repoUrl"

    # Build and Install JS Bundle
    emcmake cmake -DAPL_CORE_PATH="$(realpath ./apl-core-library)" -DWASM=ON ..
    make install

    cd ..
  )
done

rm -rf $TEMP_DIR
rm -r sandbox
