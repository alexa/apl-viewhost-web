/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_ROOTCONFIG_H
#define APL_WASM_ROOTCONFIG_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
using RootConfigPtr = std::shared_ptr<apl::RootConfig>;

struct RootConfigMethods {
    static RootConfigPtr create(emscripten::val environment);

    static RootConfigPtr& utcTime(RootConfigPtr& rootConfig, apl_time_t utcTime);
    static RootConfigPtr& localTimeAdjustment(RootConfigPtr& rootConfig, apl_duration_t localTimeAdjustment);
    static RootConfigPtr& localeMethods(RootConfigPtr& rootConfig, emscripten::val localeMethods);

    static RootConfigPtr& registerExtensionEventHandler(RootConfigPtr& rootConfig, ExtensionEventHandler handler);
    static RootConfigPtr& registerExtensionCommand(RootConfigPtr& rootConfig, ExtensionCommandDefinition commandDef);
    static RootConfigPtr& registerExtensionFilter(RootConfigPtr& rootConfig, ExtensionFilterDefinition filterDef);
    static RootConfigPtr& registerExtensionEnvironment(RootConfigPtr& rootConfig, const std::string& uri, emscripten::val environment);
    static RootConfigPtr& registerExtension(RootConfigPtr& rootConfig, const std::string& uri);

    static RootConfigPtr& liveMap(RootConfigPtr& rootConfig, const std::string& name, emscripten::val obj);
    static RootConfigPtr& liveArray(RootConfigPtr& rootConfig, const std::string& name, emscripten::val obj);
};
} // namespace internal

} // namespace wasm
} // namespace apl
#endif // APL_ROOTCONFIG_H
