/**
  * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
  */

#ifndef APL_WASM_SESSION_H
#define APL_WASM_SESSION_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

using SessionPtr = std::shared_ptr<apl::Session>;

class WasmSession : public apl::Session {
public:
    static SessionPtr create(emscripten::val logCommandCallback);

    WasmSession(emscripten::val pegtlCallback, emscripten::val logCommandCallback = emscripten::val::null());
    void write(const char *filename, const char *func, const char *value) override;
    void write(apl::LogCommandMessage&& message) override;
    emscripten::val pegtlCallback;

private:
    const emscripten::val logCommandCallback;
    emscripten::val getArgumentsFrom(const apl::LogCommandMessage& message);
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_SESSION_H