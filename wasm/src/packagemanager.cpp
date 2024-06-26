/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/packagemanager.h"
#include "wasm/embindutils.h"
#include "apl/content/jsondata.h"
#include "apl/utils/log.h"
#include <emscripten.h>

namespace apl {
namespace wasm {

PackageManagerPtr
PackageManager::create(emscripten::val importPackageCallback) {
    return std::make_shared<PackageManager>(importPackageCallback);
}

PackageManager::PackageManager(emscripten::val importPackageCallback)
    : mImportPackageCallback(importPackageCallback)
{}

void
PackageManager::destroy() {
    mPendingPackageRequests.clear();
}

// Implements apl::PackageManager::importPackage
void 
PackageManager::loadPackage(const PackageRequestPtr& packageRequest) {
    auto request = packageRequest->request();
    std::string reference = request.reference().toString();

    // Store ImportRequest + callbacks at C++ level
    mPendingPackageRequests[reference] = packageRequest;

    // Pass ImportRequest to JS
    mImportPackageCallback(emscripten::val(request));
}

void
PackageManager::importPackageSucceeded(const std::string& reference, const std::string& packageJson) {
    auto pendingRequest = mPendingPackageRequests.find(reference);
    if (pendingRequest == mPendingPackageRequests.end()) {
        LOG(LogLevel::ERROR) << "Import request not found: " + reference;
        return;
    }

    auto packageRequest = pendingRequest->second;
    packageRequest->succeed(SharedJsonData(packageJson));
    mPendingPackageRequests.erase(reference);
}

void
PackageManager::importPackageFailed(const std::string& reference, const std::string& msg, int code) {
    auto pendingRequest = mPendingPackageRequests.find(reference);
    if (pendingRequest == mPendingPackageRequests.end()) {
        LOG(LogLevel::ERROR) << "Import request not found: " + reference;
        return;
    }

    auto packageRequest = pendingRequest->second;
    packageRequest->fail(msg, code);
    mPendingPackageRequests.erase(reference);
}


EMSCRIPTEN_BINDINGS(apl_wasm_package_manager) {
    emscripten::class_<PackageManager>("PackageManager")
        .smart_ptr<PackageManagerPtr>("PackageManagerPtr")
        .class_function("create", &PackageManager::create)
        .function("importPackageSucceeded", &PackageManager::importPackageSucceeded)
        .function("importPackageFailed", &PackageManager::importPackageFailed)
        .function("destroy", &PackageManager::destroy);
}

} // namespace wasm
} // namespace apl