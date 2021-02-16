/**
  * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  */

#ifndef APL_WASM_SESSION_H
#define APL_WASM_SESSION_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class WasmSession : public apl::Session {
public:

    WasmSession(emscripten::val pegtlCallback);
    void write(const char *filename, const char *func, const char *value) override;
    emscripten::val pegtlCallback;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_SESSION_H