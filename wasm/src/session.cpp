/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/session.h"
#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

SessionPtr
WasmSession::create(emscripten::val logCommandCallback) {
    return std::make_shared<WasmSession>(emscripten::val::undefined(), logCommandCallback);
}

WasmSession::WasmSession(emscripten::val pegtlCallback, emscripten::val logCommandCallback)
    : apl::Session(),
    pegtlCallback(pegtlCallback),
    logCommandCallback(logCommandCallback) {
}

void
WasmSession::write(const char *filename, const char *func, const char *value) {
    if (pegtlCallback.isUndefined()) {
      LOG(LogLevel::WARN) << "There is no PEGTL error callback installed";
      return;
    }
    pegtlCallback(emscripten::val(value));
}

void
WasmSession::write(apl::LogCommandMessage&& message) {
    if (logCommandCallback.isNull() || logCommandCallback.isUndefined()) {
        return;
    }

    const emscripten::val args = getArgumentsFrom(message);
    logCommandCallback(static_cast<int>(message.level), message.text, args);
}

emscripten::val
WasmSession::getArgumentsFrom(const apl::LogCommandMessage& message) {
    if (message.arguments.empty()) {
        return emscripten::val::array();
    }

    // Add arguments array if it's not empty
    rapidjson::StringBuffer buffer;
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    rapidjson::Document serializer;
    rapidjson::Value serializedArguments = message.arguments.serialize(serializer.GetAllocator());
    serializedArguments.Accept(writer); // Serialize into the writer directly
    const std::string info = buffer.GetString();

    return emscripten::val::global("JSON").call<emscripten::val>("parse", info);
}

EMSCRIPTEN_BINDINGS(apl_wasm_session) {
    emscripten::class_<apl::Session>("Session")
        .smart_ptr<SessionPtr>("SessionPtr")
        .class_function("create", &WasmSession::create);
}

} // namespace wasm
} // namespace apl