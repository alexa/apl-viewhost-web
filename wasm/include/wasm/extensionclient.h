/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_EXTENSION_CLIENT_H
#define APL_WASM_EXTENSION_CLIENT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

using ExtensionClientPtr = std::shared_ptr<apl::ExtensionClient>;

struct ExtensionClientMethods {
    static ExtensionClientPtr create(emscripten::val config, const std::string& uri);
    static std::string createRegistrationRequest(ExtensionClientPtr& client, emscripten::val content);
    static bool processMessage(ExtensionClientPtr& client, emscripten::val context, const std::string& message);
    static std::string processCommand(ExtensionClientPtr& client, emscripten::val event);
};

} // namespace internal


} // namespace wasm
} // namespace apl

#endif // APL_WASM_EXTENSION_CLIENT_H
