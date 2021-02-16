/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/logbridge.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

WasmLogBridge::WasmLogBridge(emscripten::val transportCallback)
    : apl::LogBridge(),
      mTransportCallback(transportCallback) {}

void
WasmLogBridge::transport(LogLevel level, const std::string& log) {
    mTransportCallback(static_cast<int>(level), log);
}

} // namespace wasm
} // namespace apl