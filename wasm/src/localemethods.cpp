/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/localemethods.h"
#include "apl/apl.h"
#include "apl/utils/log.h"

namespace apl {
    namespace wasm {
        WasmLocaleMethods::WasmLocaleMethods(emscripten::val toUpperCaseCallback,
                                             emscripten::val toLowerCaseCallback)
                : apl::LocaleMethods()
                , toUpperCaseCallback(toUpperCaseCallback)
                , toLowerCaseCallback(toLowerCaseCallback) {}

        std::string
        WasmLocaleMethods::toUpperCase(const std::string &value, const std::string &locale) {
            if (toUpperCaseCallback.isUndefined()) {
                LOG(LogLevel::ERROR) << "There is no toUpperCaseCallback";
                return value;
            }
            return toUpperCaseCallback(value, locale).as<std::string>();
        }

        std::string
        WasmLocaleMethods::toLowerCase(const std::string &value, const std::string &locale) {
            if (toLowerCaseCallback.isUndefined()) {
                LOG(LogLevel::ERROR) << "There is no toLowerCaseCallback";
                return value;
            }
            return toLowerCaseCallback(value, locale).as<std::string>();
        }

    } // namespace wasm
} // namespace apl
