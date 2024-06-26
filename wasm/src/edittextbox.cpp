/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/edittextbox.h"
#include "apl/apl.h"

namespace apl {
namespace wasm {

WasmEditTextBox::WasmEditTextBox(const float width,
                                 const float height,
                                 const float baseline)
    : apl::sg::EditTextBox(),
      mWidth(width),
      mHeight(height),
      mBaseline(baseline)
{}

apl::Size
WasmEditTextBox::getSize() const {
    return {mWidth, mHeight};
}

float
WasmEditTextBox::getBaseline() const {
    return mBaseline;
}

} // namespace wasm
} // namespace apl
