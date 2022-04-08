/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/configurationchange.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

ConfigurationChangePtr
ConfigurationChangeMethods::create() {
    return std::make_shared<ConfigurationChange>();
}

ConfigurationChangePtr&
ConfigurationChangeMethods::size(ConfigurationChangePtr& configurationChange, double width, double height) {
    configurationChange->size(width, height);
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::theme(ConfigurationChangePtr& configurationChange, const std::string& theme) {
    configurationChange->theme(theme.c_str());
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::viewportMode(ConfigurationChangePtr& configurationChange, const std::string& mode) {
    configurationChange->mode(modeMap.at(mode));
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::fontScale(ConfigurationChangePtr& configurationChange, double scale) {
    configurationChange->fontScale(scale);
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::screenMode(ConfigurationChangePtr& configurationChange, const std::string& screenMode) {
    configurationChange->screenMode(screenModeMap.at(screenMode));
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::screenReader(ConfigurationChangePtr& configurationChange, bool enabled) {
    configurationChange->screenReader(enabled);
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::disallowVideo(ConfigurationChangePtr& configurationChange, bool disallowVideo) {
    configurationChange->disallowVideo(disallowVideo);
    return configurationChange;
}

ConfigurationChangePtr&
ConfigurationChangeMethods::environmentValue(ConfigurationChangePtr& configurationChange, const std::string& name, emscripten::val value) {
    configurationChange->environmentValue(name.c_str(), emscripten::getObjectFromVal(value));
    return configurationChange;
}

void
ConfigurationChangeMethods::mergeConfigurationChange(ConfigurationChangePtr& configurationChange, emscripten::val other) {
    auto configChange = *(other.as<std::shared_ptr<ConfigurationChange>>());
    configurationChange->mergeConfigurationChange(configChange);
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_configurationchange) {

    emscripten::class_<apl::ConfigurationChange>("ConfigurationChange")
        .smart_ptr<internal::ConfigurationChangePtr>("ConfigurationChangePtr")
        .class_function("create", &internal::ConfigurationChangeMethods::create)
        .function("size", &internal::ConfigurationChangeMethods::size)
        .function("theme", &internal::ConfigurationChangeMethods::theme)
        .function("viewportMode", &internal::ConfigurationChangeMethods::viewportMode)
        .function("fontScale", &internal::ConfigurationChangeMethods::fontScale)
        .function("screenMode", &internal::ConfigurationChangeMethods::screenMode)
        .function("screenReader", &internal::ConfigurationChangeMethods::screenReader)
        .function("disallowVideo", &internal::ConfigurationChangeMethods::disallowVideo)
        .function("environmentValue", &internal::ConfigurationChangeMethods::environmentValue)
        .function("mergeConfigurationChange", &internal::ConfigurationChangeMethods::mergeConfigurationChange);
}

} // namespace wasm
} // namespace apl
