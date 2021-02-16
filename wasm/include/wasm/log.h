/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_LOG_H
#define APL_WASM_LOG_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
struct LogMethods {
    static void setLogTransport(emscripten::val transport);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_LOG_H