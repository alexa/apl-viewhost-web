/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_LOGBRIFGE_H
#define APL_WASM_LOGBRIFGE_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class WasmLogBridge : public apl::LogBridge {
public:
    WasmLogBridge(emscripten::val transportCallback);
    
    void transport(LogLevel level, const std::string& log) override;

    emscripten::val mTransportCallback;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_LOGBRIFGE_H
