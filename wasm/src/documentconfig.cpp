/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/documentconfig.h"

#include "apl/apl.h"
#include "apl/dynamicdata.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

apl::DocumentConfigPtr
DocumentConfigMethods::create() {
    auto config = apl::DocumentConfig::create();
    config->dataSourceProvider(std::make_shared<DynamicIndexListDataSourceProvider>());
    config->dataSourceProvider(std::make_shared<DynamicTokenListDataSourceProvider>());
    return config;
}

bool
DocumentConfigMethods::processDataSourceUpdate(const apl::DocumentConfigPtr& config, const std::string& type, const std::string& payload) {
    auto providers = config->getDataSourceProviders();
    for (auto provider : providers) {
        if (provider->getType() == type) {
            provider->processUpdate(payload);
            return true;
        }
    }
    return false;
}

} // namespace internal
EMSCRIPTEN_BINDINGS(apl_wasm_document_config) {
emscripten::class_<apl::DocumentConfig>("DocumentConfig")
    .smart_ptr<apl::DocumentConfigPtr>("DocumentConfigPtr")
    .class_function("create", &internal::DocumentConfigMethods::create)
    .function("processDataSourceUpdate", &internal::DocumentConfigMethods::processDataSourceUpdate);
}

} // namespace wasm
} // namespace apl
