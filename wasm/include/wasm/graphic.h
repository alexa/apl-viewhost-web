/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_GRAPHIC_H
#define APL_WASM_GRAPHIC_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

using GraphicPtr = std::shared_ptr<Graphic>;

namespace internal {
struct GraphicMethods {
    static bool isValid(const GraphicPtr& graphic);
    static GraphicElementPtr getRoot(const GraphicPtr& graphic);
    static double getIntrinsicHeight(const GraphicPtr& graphic);
    static double getIntrinsicWidth(const GraphicPtr& graphic);
    static double getViewportWidth(const GraphicPtr& graphic);
    static double getViewportHeight(const GraphicPtr& graphic);
    static void clearDirty(GraphicPtr graphic);
    static emscripten::val getDirty(const GraphicPtr& graphic);


};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_GRAPHIC_H
