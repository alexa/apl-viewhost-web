/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/content.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

apl::ContentPtr
ContentMethods::create(const std::string& document) {
    return apl::Content::create(document.c_str());
}

void
ContentMethods::refresh(const apl::ContentPtr& content, const Metrics& metrics, const RootConfig& config) {
    content->refresh(metrics, config);
}

std::set<apl::ImportRequest>
ContentMethods::getRequestedPackages(const apl::ContentPtr& content) {
    return content->getRequestedPackages();
}

bool
ContentMethods::isError(const apl::ContentPtr& content) {
    return content->isError();
}

bool
ContentMethods::isReady(const apl::ContentPtr& content) {
    return content->isReady();
}

bool
ContentMethods::isWaiting(const apl::ContentPtr& content) {
    return content->isWaiting();
}

void
ContentMethods::addData(const apl::ContentPtr& content, const std::string& name, const std::string& data) {
    content->addData(name, data.c_str());
}

std::string
ContentMethods::getAPLVersion(const apl::ContentPtr& content) {
    return content->getAPLVersion();
}

void
ContentMethods::addPackage(const apl::ContentPtr& content, const apl::ImportRequest& request,
                           const std::string& data) {
    content->addPackage(request, data.c_str());
}

/**
 * @return The set of requested custom extensions (a list of URI values)
 */
std::set<std::string>
ContentMethods::getExtensionRequests(const apl::ContentPtr& content) {
    return content->getExtensionRequests();
}

/**
 * Retrieve the settings associated with an extension request.
 * @param uri The uri of the extension.
 * @return Map of settings, Object::NULL_OBJECT() if no settings are specified in the document.
 */
emscripten::val
ContentMethods::getExtensionSettings(const apl::ContentPtr& content, const std::string& uri) {
    return emscripten::getValFromObject(content->getExtensionSettings(uri), nullptr);
}

std::string
ContentMethods::getParameterAt(const apl::ContentPtr& content, size_t index) {
    return content->getParameterAt(index);
}

size_t
ContentMethods::getParameterCount(const apl::ContentPtr& content) {
    return content->getParameterCount();
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_content) {

    emscripten::register_set<apl::ImportRequest>("ImportRequestSet");
    emscripten::register_set<std::string>("ExtensionStringSet");

    emscripten::class_<apl::Content>("Content")
        .class_function("create", &internal::ContentMethods::create)
        .smart_ptr<apl::ContentPtr>("ContentPtr")
        .function("refresh", &internal::ContentMethods::refresh)
        .function("getRequestedPackages", &internal::ContentMethods::getRequestedPackages)
        .function("isError", &internal::ContentMethods::isError)
        .function("isReady", &internal::ContentMethods::isReady)
        .function("isWaiting", &internal::ContentMethods::isWaiting)
        .function("addData", &internal::ContentMethods::addData)
        .function("addPackage", &internal::ContentMethods::addPackage)
        .function("getAPLVersion", &internal::ContentMethods::getAPLVersion)
        .function("getExtensionRequests", &internal::ContentMethods::getExtensionRequests)
        .function("getExtensionSettings", &internal::ContentMethods::getExtensionSettings)
        .function("getParameterAt", &internal::ContentMethods::getParameterAt)
        .function("getParameterCount", &internal::ContentMethods::getParameterCount);
}

} // namespace wasm
} // namespace apl
