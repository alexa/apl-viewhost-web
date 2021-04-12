/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_GRAPHIC_PATTERN_H
#define APL_WASM_GRAPHIC_PATTERN_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
struct GraphicPatternMethods {
    static std::string getId(const GraphicPatternPtr& graphicPattern);
    static std::string getDescription(const GraphicPatternPtr& graphicPattern);
    static double getHeight(const GraphicPatternPtr& graphicPattern);
    static double getWidth(const GraphicPatternPtr& graphicPattern);
    static size_t getItemCount(const GraphicPatternPtr& graphicPattern);
    static GraphicElementPtr getItemAt(const GraphicPatternPtr& graphicPattern, size_t index);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_GRAPHIC_PATTERN_H