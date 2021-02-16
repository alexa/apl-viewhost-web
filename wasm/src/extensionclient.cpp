/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/extensionclient.h"

namespace apl {
namespace wasm {

namespace internal {

ExtensionClientPtr 
ExtensionClientMethods::create(emscripten::val config, const std::string& uri) {
    auto configPtr = config.as<RootConfigPtr>();
    return apl::ExtensionClient::create(configPtr, uri);
}

std::string 
ExtensionClientMethods::createRegistrationRequest(ExtensionClientPtr& client, emscripten::val content) {
    rapidjson::Document doc(rapidjson::kObjectType);
    rapidjson::StringBuffer buffer;
    auto contentPtr = content.as<ContentPtr>();
    auto request = client->createRegistrationRequest(doc.GetAllocator(), *contentPtr);
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    request.Accept(writer);
    
    return buffer.GetString();
}

bool
ExtensionClientMethods::processMessage(ExtensionClientPtr& client, emscripten::val context, const std::string& message) {
    auto contextPtr = context.as<RootContextPtr>();
    return client->processMessage(contextPtr ? contextPtr : nullptr, message);
}

std::string 
ExtensionClientMethods::processCommand(ExtensionClientPtr& client, emscripten::val event) {
    rapidjson::Document doc(rapidjson::kObjectType);
    rapidjson::StringBuffer buffer;
    auto eventRef = event.as<Event>();
    auto request = client->processCommand(doc.GetAllocator(), eventRef);
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    request.Accept(writer);
    
    return buffer.GetString();
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_extension_client) {
    emscripten::class_<apl::ExtensionClient>("ExtensionClient")
        .smart_ptr<internal::ExtensionClientPtr>("ExtensionClientPtr")
        .class_function("create",&internal::ExtensionClientMethods::create)
        .function("createRegistrationRequest", &internal::ExtensionClientMethods::createRegistrationRequest)
        .function("processMessage", &internal::ExtensionClientMethods::processMessage)
        .function("processCommand", &internal::ExtensionClientMethods::processCommand);
}

} // namespace wasm
} // namespace apl
