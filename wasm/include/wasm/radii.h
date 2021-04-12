/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_RECT_H
#define APL_WASM_RECT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

EMSCRIPTEN_BINDINGS(apl_wasm_radii) {

    emscripten::class_<apl::Radii>("Radii")
        .function("topLeft", &apl::Radii::topLeft)
        .function("topRight", &apl::Radii::topRight)
        .function("bottomLeft", &apl::Radii::bottomLeft)
        .function("bottomRight", &apl::Radii::bottomRight);
}

} // namespace wasm
} // namespace apl

#endif // APL_RECT_H
