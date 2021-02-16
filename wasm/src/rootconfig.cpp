/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/rootconfig.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

RootConfigPtr
RootConfigMethods::create(emscripten::val environment) {
    //TODO: Split it out. Do not pass complex object here.
    // Create root config from options
    std::string agentName = environment["agentName"].as<std::string>();
    std::string agentVersion = environment["agentVersion"].as<std::string>();
    bool allowOpenUrl = environment["allowOpenUrl"].as<bool>();
    bool disallowVideo = environment["disallowVideo"].as<bool>();
    auto animationQuality = static_cast<RootConfig::AnimationQuality>(environment["animationQuality"].as<int>());

    auto config = std::make_shared<RootConfig>();
    config->agent(agentName, agentVersion)
        .allowOpenUrl(allowOpenUrl)
        .disallowVideo(disallowVideo)
        .animationQuality(animationQuality)
        .enforceAPLVersion(apl::APLVersion::kAPLVersionIgnore);

    return config;
}

RootConfigPtr& 
RootConfigMethods::utcTime(RootConfigPtr& rootConfig, apl_time_t utcTime) {
    rootConfig->utcTime(utcTime);
    return rootConfig;
}

RootConfigPtr& 
RootConfigMethods::localTimeAdjustment(RootConfigPtr& rootConfig, apl_duration_t localTimeAdjustment) {
    rootConfig->localTimeAdjustment(localTimeAdjustment);
    return rootConfig;
}

RootConfigPtr&
RootConfigMethods::registerExtensionEventHandler(RootConfigPtr& rootConfig, ExtensionEventHandler handler) {
    rootConfig->registerExtensionEventHandler(handler);
    return rootConfig;
}

RootConfigPtr&
RootConfigMethods::registerExtensionCommand(RootConfigPtr& rootConfig, ExtensionCommandDefinition commandDef) {
    rootConfig->registerExtensionCommand(commandDef);
    return rootConfig;
}

RootConfigPtr&
RootConfigMethods::registerExtensionFilter(RootConfigPtr& rootConfig, ExtensionFilterDefinition filterDef) {
    rootConfig->registerExtensionFilter(filterDef);
    return rootConfig;
}

RootConfigPtr&
RootConfigMethods::registerExtensionEnvironment(RootConfigPtr& rootConfig, const std::string& uri, emscripten::val environment) {
    rootConfig->registerExtensionEnvironment(uri, emscripten::getObjectFromVal(environment));
    return rootConfig;
}

RootConfigPtr&
RootConfigMethods::registerExtension(RootConfigPtr& rootConfig, const std::string& uri) {
    rootConfig->registerExtension(uri);
    return rootConfig;
}

RootConfigPtr& 
RootConfigMethods::liveMap(RootConfigPtr& rootConfig, const std::string& name, emscripten::val obj) {
    auto liveObj = obj.as<apl::LiveMapPtr>();
    rootConfig->liveData(name, liveObj);
    return rootConfig;
}

RootConfigPtr& 
RootConfigMethods::liveArray(RootConfigPtr& rootConfig, const std::string& name, emscripten::val obj) {
    auto liveObj = obj.as<apl::LiveArrayPtr>();
    rootConfig->liveData(name, liveObj);
    return rootConfig;
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_rootconfig) {
    
    emscripten::class_<apl::RootConfig>("RootConfig")
        .smart_ptr<internal::RootConfigPtr>("RootConfigPtr")
        .class_function("create", &internal::RootConfigMethods::create)
        .function("utcTime", &internal::RootConfigMethods::utcTime)
        .function("localTimeAdjustment", &internal::RootConfigMethods::localTimeAdjustment)
        .function("registerExtension", &internal::RootConfigMethods::registerExtension)
        .function("registerExtensionEnvironment", &internal::RootConfigMethods::registerExtensionEnvironment)
        .function("registerExtensionCommand", &internal::RootConfigMethods::registerExtensionCommand)
        .function("registerExtensionEventHandler", &internal::RootConfigMethods::registerExtensionEventHandler)
        .function("liveMap", &internal::RootConfigMethods::liveMap)
        .function("liveArray", &internal::RootConfigMethods::liveArray);
}

} // namespace wasm
} // namespace apl
