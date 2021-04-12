/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_LOCALEMETHODS_H
#define APL_WASM_LOCALEMETHODS_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
    namespace wasm {

        class WasmLocaleMethods : public apl::LocaleMethods {
        public:
            WasmLocaleMethods(emscripten::val toUpperCaseCallback,
                              emscripten::val toLowerCaseCallback);

            std::string toLowerCase(const std::string &value, const std::string &locale) override;
            std::string toUpperCase(const std::string &value, const std::string &locale) override;

            emscripten::val toUpperCaseCallback;
            emscripten::val toLowerCaseCallback;
        };

    } // namespace wasm
} // namespace apl

#endif // APL_WASM_LOCALEMETHODS_H
