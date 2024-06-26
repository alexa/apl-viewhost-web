/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_PACKAGE_MANAGER_H
#define APL_WASM_PACKAGE_MANAGER_H

#include "apl/apl.h"
#include <emscripten/bind.h>

// using CallbackFunction = std::function<void()>;

namespace apl {
namespace wasm {

class PackageManager;
using PackageManagerPtr = std::shared_ptr<PackageManager>;

class PackageManager : public apl::PackageManager {
public:
    PackageManager(emscripten::val importPackageCallback);
    static PackageManagerPtr create(emscripten::val importPackageCallback);
    void destroy();

    // Core is requesting a package be dynamically downloaded and imported.
    void loadPackage(const PackageRequestPtr& packageRequest) override;

    // Callback used by JS side to response to a request
    void importPackageSucceeded(const std::string& reference, const std::string& packageJson);
    void importPackageFailed(const std::string& reference, const std::string& msg, int code);

private:
    emscripten::val mImportPackageCallback; 
    std::map<std::string, PackageRequestPtr> mPendingPackageRequests;
};
} // namespace wasm
} // namespace apl

#endif // APL_WASM_PACKAGE_MANAGER_H