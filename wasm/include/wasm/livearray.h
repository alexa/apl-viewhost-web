/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_LIVE_ARRAY_H
#define APL_WASM_LIVE_ARRAY_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

struct LiveArrayMethods {
    static apl::LiveArrayPtr create(emscripten::val array);
    static bool empty(const apl::LiveArrayPtr& liveArrayPtr);
    static void clear(const apl::LiveArrayPtr& liveArrayPtr);
    static size_t size(const apl::LiveArrayPtr& liveArrayPtr);
    static emscripten::val at(const apl::LiveArrayPtr& liveArrayPtr, size_t position);
    static bool insert(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val value);
    static bool insertRange(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val array);
    static bool remove(const apl::LiveArrayPtr& liveArrayPtr, size_t position, size_t count);
    static bool update(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val value);
    static bool updateRange(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val array);
    static void push_back(const apl::LiveArrayPtr& liveArrayPtr, emscripten::val value);
    static bool push_backRange(const apl::LiveArrayPtr& liveArrayPtr, emscripten::val array);
};

} // namespace internal

} // namespace wasm
} // namespace apl
#endif // APL_WASM_LIVE_ARRAY_H
