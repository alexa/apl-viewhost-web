/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_LIVE_MAP_H
#define APL_WASM_LIVE_MAP_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

struct LiveMapMethods {
    static apl::LiveMapPtr create(emscripten::val map);
    static bool empty(const apl::LiveMapPtr& liveMapPtr);
    static void clear(const apl::LiveMapPtr& liveMapPtr);
    static emscripten::val get(const apl::LiveMapPtr& liveMapPtr, const std::string& key);
    static bool has(const apl::LiveMapPtr& liveMapPtr, const std::string& key);
    static void set(const apl::LiveMapPtr& liveMapPtr, const std::string& key, emscripten::val value);
    static void update(const apl::LiveMapPtr& liveMapPtr, emscripten::val map);
    static void replace(const apl::LiveMapPtr& liveMapPtr, emscripten::val map);
    static bool remove(const apl::LiveMapPtr& liveMapPtr, const std::string& key);
};

} // namespace internal

} // namespace wasm
} // namespace apl
#endif // APL_WASM_LIVE_MAP_H
