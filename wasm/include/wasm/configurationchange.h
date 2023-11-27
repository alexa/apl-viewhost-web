/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_CONFIGURATIONCHANGE_H
#define APL_WASM_CONFIGURATIONCHANGE_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
using ConfigurationChangePtr = std::shared_ptr<apl::ConfigurationChange>;

static std::map<std::string, ViewportMode> modeMap = {
    {"AUTO", kViewportModeAuto},
    {"HUB", kViewportModeHub},
    {"MOBILE", kViewportModeMobile},
    {"PC", kViewportModePC},
    {"TV", kViewportModeTV},
};

static std::map<std::string, RootConfig::ScreenMode> screenModeMap = {
    {"normal", RootConfig::kScreenModeNormal},
    {"high-contrast", RootConfig::kScreenModeHighContrast},
};

struct ConfigurationChangeMethods {
    static ConfigurationChangePtr create();
    static ConfigurationChangePtr& size(ConfigurationChangePtr& configurationChange, int width, int height);
    static ConfigurationChangePtr& sizeRange(ConfigurationChangePtr& configurationChange,
                                             int pixelWidth, int minWidth, int maxWidth,
                                             int pixelHeight, int minHeight, int maxHeight);
    static ConfigurationChangePtr& theme(ConfigurationChangePtr& configurationChange, const std::string& theme);
    static ConfigurationChangePtr& viewportMode(ConfigurationChangePtr& configurationChange, const std::string& mode);
    static ConfigurationChangePtr& fontScale(ConfigurationChangePtr& configurationChange, double scale);
    static ConfigurationChangePtr& screenMode(ConfigurationChangePtr& configurationChange, const std::string& screenMode);
    static ConfigurationChangePtr& screenReader(ConfigurationChangePtr& configurationChange, bool enabled);
    static ConfigurationChangePtr& disallowVideo(ConfigurationChangePtr& configurationChange, bool disallowVideo);
    static ConfigurationChangePtr& environmentValue(ConfigurationChangePtr& configurationChange, const std::string& name, const emscripten::val value);
    static void mergeConfigurationChange(ConfigurationChangePtr& configurationChange, emscripten::val other);
};

} // namespace internal

} // namespace wasm
} // namespace apl
#endif // APL_CONFIGURATIONCHANGE_H
