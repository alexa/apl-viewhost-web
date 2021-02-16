/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_EXTENSION_H
#define APL_WASM_EXTENSION_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

using ExtensionCommandDefinitionPtr = std::shared_ptr<apl::ExtensionCommandDefinition>;
using ExtensionEventHandlerPtr = std::shared_ptr<apl::ExtensionEventHandler>;
using ExtensionFilterDefinitionPtr = std::shared_ptr<apl::ExtensionFilterDefinition>;

struct ExtensionCommandDefinitionMethods {
    static ExtensionCommandDefinitionPtr create(const std::string& uri, const std::string& name);
    static ExtensionCommandDefinitionPtr& allowFastMode(ExtensionCommandDefinitionPtr& def, bool allowFastMode) ;
    static ExtensionCommandDefinitionPtr& requireResolution(ExtensionCommandDefinitionPtr& def, bool requireResolution) ;
    static ExtensionCommandDefinitionPtr& property(ExtensionCommandDefinitionPtr& def, const std::string& property, emscripten::val defvalue, bool required);
    static ExtensionCommandDefinitionPtr& arrayProperty(ExtensionCommandDefinitionPtr& def, const std::string& property, bool required) ;
    static std::string getURI(const ExtensionCommandDefinitionPtr& def) ;
    static std::string getName(const ExtensionCommandDefinitionPtr& def) ;
    static bool getAllowFastMode(const ExtensionCommandDefinitionPtr& def);
    static bool getRequireResolution(const ExtensionCommandDefinitionPtr& def) ;
};

struct ExtensionEventHandlerMethods {
    static ExtensionEventHandlerPtr create(const std::string& uri, const std::string& name);
    static std::string getURI(const ExtensionEventHandlerPtr& handler);
    static std::string getName(const ExtensionEventHandlerPtr& handler);
};

struct ExtensionFilterDefinitionMethods {
    static ExtensionFilterDefinitionPtr create(const std::string& uri, const std::string& name, apl::ExtensionFilterDefinition::ImageCount imageCount);
    static ExtensionFilterDefinitionPtr& property(ExtensionFilterDefinitionPtr& def, const std::string& property, emscripten::val defvalue);
    static std::string getURI(const ExtensionFilterDefinitionPtr& def);
    static std::string getName(const ExtensionFilterDefinitionPtr& def);
    static apl::ExtensionFilterDefinition::ImageCount getImageCount(const ExtensionFilterDefinitionPtr& def);
};

} // namespace internal


} // namespace wasm
} // namespace apl

#endif // APL_WASM_EXTENSION_H
