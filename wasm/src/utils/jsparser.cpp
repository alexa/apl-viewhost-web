/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "utils/jsparser.h"
#include <stdio.h>

namespace apl {
namespace wasm {
namespace internal {
namespace jsparser {

const emscripten::val undefined = emscripten::val::undefined();

double
getOptionalValue(const emscripten::val object, const std::string& key, double defaultValue) {
    const auto& valueIt = object[key];
    if (!valueIt.isUndefined()) {
        return valueIt.as<double>();
    }
    return defaultValue;
}

std::string
getOptionalValue(const emscripten::val object, const std::string& key,
                 const std::string& defaultValue) {
    const auto& valueIt = object[key];
    if (!valueIt.isUndefined()) {
        return valueIt.as<std::string>();
    }
    return defaultValue;
}

} // namespace jsparser
} // namespace internal
} // namespace wasm
} // namespace apl