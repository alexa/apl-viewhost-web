/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APLVIEWHOSTWEB_JSPARSER_H
#define APLVIEWHOSTWEB_JSPARSER_H

#include <emscripten/val.h>
#include <string>

namespace apl {
namespace wasm {
namespace internal {
namespace jsparser {

double
getOptionalValue(const emscripten::val object, const std::string& key, double defaultValue);

std::string
getOptionalValue(const emscripten::val object, const std::string& key,
                 const std::string& defaultValue);

} // namespace jsparser
} // namespace internal
} // namespace wasm
} // namespace apl

#endif // APLVIEWHOSTWEB_JSPARSER_H
