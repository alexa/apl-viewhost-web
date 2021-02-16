/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_RECT_H
#define APL_WASM_RECT_H

#include "apl/apl.h"
#include <emscripten/bind.h>


namespace apl {
namespace wasm {

namespace internal {
struct RectMethods {
    static std::string toString(const apl::Rect& rect) {
       streamer buffer;
       buffer << "{width: " << rect.getWidth();
       buffer << ", height: " << rect.getHeight();
       buffer << ", top: " << rect.getY();
       buffer << ", left: " << rect.getX() << "}";
       return buffer.str();
    }
};
} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_rect) {

    emscripten::class_<apl::Rect>("Rect")
        .property("left", &apl::Rect::getX)
        .property("top", &apl::Rect::getY)
        .property("width", &apl::Rect::getWidth)
        .property("height", &apl::Rect::getHeight)
        .function("toString", &internal::RectMethods::toString);
}

} // namespace wasm
} // namespace apl

#endif // APL_RECT_H
