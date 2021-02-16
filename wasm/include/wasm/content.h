/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_CONTENT_H
#define APL_WASM_CONTENT_H

#include "apl/apl.h"
#include "wasm/embindutils.h"
#include <emscripten/bind.h>
#include <map>

namespace apl {
namespace wasm {

namespace internal {
struct ContentMethods {
    static apl::ContentPtr create(const std::string& document);
    static std::set<apl::ImportRequest> getRequestedPackages(const apl::ContentPtr& content);
    static bool isError(const apl::ContentPtr& content);
    static bool isReady(const apl::ContentPtr& content);
    static bool isWaiting(const apl::ContentPtr& content);
    static void addData(const apl::ContentPtr& content, const std::string& name, const std::string& data);
    static void addPackage(const apl::ContentPtr& content, const apl::ImportRequest& request, const std::string& data);
    static std::string getAPLVersion(const apl::ContentPtr& content);
    static std::set<std::string> getExtensionRequests(const apl::ContentPtr& content);
    static emscripten::val getExtensionSettings(const apl::ContentPtr& content, const std::string& extensionName);

};
} // namespace internal

} // namespace wasm
} // namespace apl
#endif // APL_CONTENT_H
