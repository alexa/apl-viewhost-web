/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_GRAPHICELEMENT_H
#define APL_WASM_GRAPHICELEMENT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
struct GraphicElementMethods {
    static id_type getId(const GraphicElementPtr& element);
    static size_t getChildCount(const GraphicElementPtr& element);
    static GraphicElementPtr getChildAt(const GraphicElementPtr& element, size_t index);
    static emscripten::val getValue(const GraphicElementPtr& element, int key);
    static emscripten::val getDirtyProperties(const GraphicElementPtr& element);
    static int getType(const GraphicElementPtr& element);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_GRAPHICELEMENT_H
