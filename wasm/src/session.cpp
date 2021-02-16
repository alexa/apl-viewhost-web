/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/session.h"
#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

WasmSession::WasmSession(emscripten::val pegtlCallback)
    : apl::Session(),
      pegtlCallback(pegtlCallback)
{}

void
WasmSession::write(const char *filename, const char *func, const char *value) {
    if (pegtlCallback.isUndefined()) {
      LOG(LogLevel::WARN) << "There is no PEGTL error callback installed";
      return;
    }
    pegtlCallback(emscripten::val(value));
}

} // namespace wasm
} // namespace apl