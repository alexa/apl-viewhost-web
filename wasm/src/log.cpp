/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/log.h"
#include "wasm/logbridge.h"

namespace apl {
namespace wasm {

namespace internal {
void 
LogMethods::setLogTransport(emscripten::val transport) {
    // LogLevel level, const std::string& log
    auto logBridge = std::make_shared<WasmLogBridge>(transport);
    LoggerFactory::instance().initialize(logBridge);
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_log) {
    emscripten::class_<apl::Logger>("Logger")
        .class_function("setLogTransport", &internal::LogMethods::setLogTransport);
}

} // namespace wasm
} // namespace apl