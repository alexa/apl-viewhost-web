/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_EDITTEXTBOX_H
#define APL_WASM_EDITTEXTBOX_H

#include "apl/apl.h"

namespace apl {
namespace wasm {

class WasmEditTextBox : public apl::sg::EditTextBox {
public:
    WasmEditTextBox(const float width,
                    const float height,
                    const float baseline);

    apl::Size getSize() const override;
    float getBaseline() const override;

private:
    const float mWidth;
    const float mHeight;
    const float mBaseline;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_EDITTEXTBOX_H
