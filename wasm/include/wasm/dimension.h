/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef _APL_WASM_DIMENSION_H
#define _APL_WASM_DIMENSION_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

struct DimensionMethods {
    static double getValue(const apl::Dimension& dimension);
    static std::string getCss(const apl::Dimension& dimension);
};

}

} // namespace wasm
} // namespace apl

#endif // _APL_WASM_DIMENSION_H
