/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/graphicelement.h"
#include "wasm/embindutils.h"
#include "wasm/wasmmetrics.h"

namespace apl {
namespace wasm {

namespace internal {

id_type
GraphicElementMethods::getId(const GraphicElementPtr& element) {
    return element->getId();
}

size_t
GraphicElementMethods::getChildCount(const GraphicElementPtr& element) {
    return element->getChildCount();
}

GraphicElementPtr
GraphicElementMethods::getChildAt(const GraphicElementPtr& element, size_t index) {
    auto child = element->getChildAt(index);
    child->setUserData(element->getUserData());
    return child;
}

emscripten::val
GraphicElementMethods::getValue(const GraphicElementPtr& element, int key) {
    auto t = element->getUserData<WASMMetrics>();
    return emscripten::getValFromObject(element->getValue(static_cast<GraphicPropertyKey>(key)), t);
}

emscripten::val
GraphicElementMethods::getDirtyProperties(const GraphicElementPtr& element) {
    emscripten::val dirty = emscripten::val::array();
    for (auto key : element->getDirtyProperties()) {
        dirty.call<void>("push", key);
    }
    return dirty;
}

int
GraphicElementMethods::getType(const GraphicElementPtr& element) {
    return static_cast<int>(element->getType());
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_graphicelement) {
    emscripten::class_<apl::GraphicElement>("GraphicElement")
        .smart_ptr<GraphicElementPtr>("GraphicElementPtr")
        .function("getId", &internal::GraphicElementMethods::getId)
        .function("getChildCount", &internal::GraphicElementMethods::getChildCount)
        .function("getChildAt", &internal::GraphicElementMethods::getChildAt)
        .function("getValue", &internal::GraphicElementMethods::getValue)
        .function("getDirtyProperties", &internal::GraphicElementMethods::getDirtyProperties)
        .function("getType", &internal::GraphicElementMethods::getType);
}

} // namespace wasm
} // namespace apl