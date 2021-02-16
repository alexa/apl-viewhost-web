/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/graphicpattern.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

std::string
GraphicPatternMethods::getId(const GraphicPatternPtr& graphicPattern) {
    return graphicPattern->getId();
}

std::string
GraphicPatternMethods::getDescription(const GraphicPatternPtr& graphicPattern) {
    return graphicPattern->getDescription();
}

double
GraphicPatternMethods::getHeight(const GraphicPatternPtr& graphicPattern) {
    return graphicPattern->getHeight();
}

double
GraphicPatternMethods::getWidth(const GraphicPatternPtr& graphicPattern) {
    return graphicPattern->getWidth();
}

size_t
GraphicPatternMethods::getItemCount(const GraphicPatternPtr& graphicPattern) {
    return graphicPattern->getItems().size();
}

GraphicElementPtr
GraphicPatternMethods::getItemAt(const GraphicPatternPtr& graphicPattern, size_t index) {
    auto item = graphicPattern->getItems();
    return item[index];
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_graphicpattern) {
    emscripten::class_<apl::GraphicPattern>("GraphicPattern")
        .smart_ptr<GraphicPatternPtr>("GraphicPatternPtr")
        .function("getId", &internal::GraphicPatternMethods::getId)
        .function("getDescription", &internal::GraphicPatternMethods::getDescription)
        .function("getHeight", &internal::GraphicPatternMethods::getHeight)
        .function("getWidth", &internal::GraphicPatternMethods::getWidth)
        .function("getItemCount", &internal::GraphicPatternMethods::getItemCount)
        .function("getItemAt", &internal::GraphicPatternMethods::getItemAt);
    emscripten::register_vector<GraphicElementPtr>("vector<GraphicElementPtr>");
}

} // namespace wasm
} // namespace apl