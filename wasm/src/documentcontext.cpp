/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/documentcontext.h"

#include "apl/apl.h"
#include "apl/dynamicdata.h"
#include <rapidjson/stringbuffer.h>
#include <rapidjson/writer.h>


namespace apl {
namespace wasm {

namespace internal {


bool
DocumentContextMethods::isVisualContextDirty(const apl::DocumentContextPtr& context) {
    return context->isVisualContextDirty();
}
void
DocumentContextMethods::clearVisualContextDirty(const apl::DocumentContextPtr& context) {
    return context->clearVisualContextDirty();
}

std::string
DocumentContextMethods::getVisualContext(const apl::DocumentContextPtr& context) {
    rapidjson::Document state(rapidjson::kObjectType);
    rapidjson::StringBuffer buffer;
    rapidjson::Document::AllocatorType& allocator = state.GetAllocator();
    auto visualContext = context->serializeVisualContext(allocator);
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    visualContext.Accept(writer);
    return buffer.GetString();
}

bool
DocumentContextMethods::isDataSourceContextDirty(const apl::DocumentContextPtr& context) {
    return context->isDataSourceContextDirty();
}

void
DocumentContextMethods::clearDataSourceContextDirty(const apl::DocumentContextPtr& context) {
    return context->clearDataSourceContextDirty();
}

std::string
DocumentContextMethods::getDataSourceContext(const apl::DocumentContextPtr& context) {
    rapidjson::Document state(rapidjson::kObjectType);
    rapidjson::StringBuffer buffer;
    rapidjson::Document::AllocatorType& allocator = state.GetAllocator();
    auto dataSourceContext = context->serializeDataSourceContext(allocator);
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    dataSourceContext.Accept(writer);
    return buffer.GetString();
}

apl::ActionPtr
DocumentContextMethods::executeCommands(const apl::DocumentContextPtr& context, const std::string& commands, bool fastMode) {
    auto* doc = new rapidjson::Document();
    doc->Parse(commands.c_str());
    apl::Object obj = apl::Object(*doc);
    auto action = context->executeCommands(obj, fastMode);
    action->setUserData(doc);
    // The consumer is not required to add a "then" or "terminate" callback,
    // so add them here to clean up the document
    action->then([doc](const ActionPtr& action) {
        if (action->getUserData() != nullptr) {
            delete doc;
            action->setUserData(nullptr);
        }
    });
    action->addTerminateCallback([doc, action](const std::shared_ptr<Timers>&) {
        if (action->getUserData() != nullptr) {
            delete doc;
            action->setUserData(nullptr);
        }
    });
    return action;
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_document_context) {
    emscripten::class_<apl::DocumentContext>("DocumentContext")
        .smart_ptr<apl::DocumentContextPtr>("CoreDocumentContextPtr")
        .function("isVisualContextDirty", &internal::DocumentContextMethods::isVisualContextDirty)
        .function("clearVisualContextDirty", &internal::DocumentContextMethods::clearVisualContextDirty)
        .function("getVisualContext", &internal::DocumentContextMethods::getVisualContext)
        .function("isDataSourceContextDirty", &internal::DocumentContextMethods::isDataSourceContextDirty)
        .function("clearDataSourceContextDirty", &internal::DocumentContextMethods::clearDataSourceContextDirty)
        .function("getDataSourceContext", &internal::DocumentContextMethods::getDataSourceContext)
        .function("executeCommands", &internal::DocumentContextMethods::executeCommands);
}

}
}
