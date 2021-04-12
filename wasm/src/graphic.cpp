/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/graphic.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

bool
GraphicMethods::isValid(const GraphicPtr& graphic) {
    return graphic->isValid();
}

GraphicElementPtr
GraphicMethods::getRoot(const GraphicPtr& graphic) {
    auto element = graphic->getRoot();
    element->setUserData(graphic->getUserData());
    return element;
}

double
GraphicMethods::getIntrinsicHeight(const GraphicPtr& graphic) {
    return graphic->getIntrinsicHeight();
}

double
GraphicMethods::getIntrinsicWidth(const GraphicPtr& graphic) {
    return graphic->getIntrinsicWidth();
}

double
GraphicMethods::getViewportWidth(const GraphicPtr& graphic) {
    return graphic->getViewportWidth();
}

double
GraphicMethods::getViewportHeight(const GraphicPtr& graphic) {
    return graphic->getViewportHeight();
}

void
GraphicMethods::clearDirty(GraphicPtr graphic) {
    graphic->clearDirty();
}

emscripten::val
GraphicMethods::getDirty(const GraphicPtr& graphic) {
    emscripten::val dirty = emscripten::val::object();
    for (auto& element : graphic->getDirty()) {
        dirty.set(static_cast<int>(element->getId()), element);
    }
    return dirty;
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_graphic) {
    emscripten::register_set<GraphicElementPtr>("GraphicElementSet");

    emscripten::class_<apl::Graphic>("Graphic")
        .smart_ptr<GraphicPtr>("GraphicPtr")
        .function("isValid", &internal::GraphicMethods::isValid)
        .function("getRoot", &internal::GraphicMethods::getRoot)
        .function("getIntrinsicHeight", &internal::GraphicMethods::getIntrinsicHeight)
        .function("getIntrinsicWidth", &internal::GraphicMethods::getIntrinsicWidth)
        .function("getViewportWidth", &internal::GraphicMethods::getViewportWidth)
        .function("getViewportHeight", &internal::GraphicMethods::getViewportHeight)
        .function("clearDirty", &internal::GraphicMethods::clearDirty)
        .function("getDirty", &internal::GraphicMethods::getDirty);
}

} // namespace wasm
} // namespace apl
