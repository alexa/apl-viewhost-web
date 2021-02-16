/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/dimension.h"

namespace apl {
namespace wasm {

namespace internal {

double
DimensionMethods::getValue(const apl::Dimension& dimension) {
    return dimension.getValue();
}

std::string
DimensionMethods::getCss(const apl::Dimension& dimension) {
    return std::to_string(dimension.getValue()) + "px";
}

} // namespace internal

EMSCRIPTEN_BINDINGS(wasm_dimension) {
    emscripten::class_<apl::Dimension>("Dimension")
        .property("css", &internal::DimensionMethods::getCss)
        .property("value", &internal::DimensionMethods::getValue);
}

} // namespace wasm
} // namespace apl