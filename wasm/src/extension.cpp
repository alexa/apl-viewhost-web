/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/extension.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

/**
 * @param uri The URI of the extension
 * @param name The name of the command.
 */
ExtensionCommandDefinitionPtr
ExtensionCommandDefinitionMethods::create(const std::string& uri, const std::string& name) {
    return std::make_shared<ExtensionCommandDefinition>(uri, name);
}

/**
* Configure if this command can run in fast mode.  When the command runs in fast mode the
* "requireResolution" property is ignored (fast mode commands do not support action resolution).
* @param allowFastMode If true, this command can run in fast mode.
* @return This object for chaining
*/
ExtensionCommandDefinitionPtr&
ExtensionCommandDefinitionMethods::allowFastMode( ExtensionCommandDefinitionPtr& def, bool allowFastMode) {
    def->allowFastMode(allowFastMode);
    return def;
}

/**
* Configure if this command (in normal mode) will return an action pointer
* that must be resolved by the view host before the next command in the sequence is executed.
* @param requireResolution If true, this command will provide an action pointer (in normal mode).
* @return This object for chaining.
*/
ExtensionCommandDefinitionPtr&
ExtensionCommandDefinitionMethods::requireResolution( ExtensionCommandDefinitionPtr& def, bool requireResolution) {
    def->requireResolution(requireResolution);
    return def;
}

/**
* Add a named property. The property names "when" and "type" are reserved.
* @param property The property to add
* @param defvalue The default value to use for this property when it is not provided.
* @param required If true and the property is not provided, the command will not execute.
* @return This object for chaining.
*/
ExtensionCommandDefinitionPtr&
ExtensionCommandDefinitionMethods::property(ExtensionCommandDefinitionPtr& def, const std::string& property, emscripten::val defvalue, bool required) {
    def->property(property, emscripten::getObjectFromVal(defvalue), required);
    return def;
}

/**
* Add a named array-ified property. The property will be converted into an array of values. The names "when"
* and "type" are reserved.
* @param property The property to add
* @param defvalue The default value to use for this property when it is not provided.
* @param required If true and the property is not provided, the command will not execute.
* @return This object for chaining.
*/
ExtensionCommandDefinitionPtr&
ExtensionCommandDefinitionMethods::arrayProperty(ExtensionCommandDefinitionPtr& def, const std::string& property, bool required) {
    def->arrayProperty(property, required);
    return def;
}

/**
* @return The URI of the extension
*/
std::string
ExtensionCommandDefinitionMethods::getURI(const ExtensionCommandDefinitionPtr& def) {
    return def->getURI();
}

/**
* @return The name of the command
*/
std::string
ExtensionCommandDefinitionMethods::getName(const ExtensionCommandDefinitionPtr& def) {
    return def->getName();
}

/**
* @return True if this command can execute in fast mode
*/
bool
ExtensionCommandDefinitionMethods::getAllowFastMode(const ExtensionCommandDefinitionPtr& def) {
    return def->getAllowFastMode();
}

/**
* @return True if this command will return an action pointer that must be
*         resolved.  Please note that a command running in fast mode will
*         never wait to be resolved.
*/
bool
ExtensionCommandDefinitionMethods::getRequireResolution(const ExtensionCommandDefinitionPtr& def) {
    return def->getRequireResolution();
}

/********************************************************/

ExtensionEventHandlerPtr
ExtensionEventHandlerMethods::create(const std::string& uri, const std::string& name) {
    return std::make_shared<ExtensionEventHandler>(uri, name);
}

/**
 * @return The extension URI associated with this event handler
 */
std::string
ExtensionEventHandlerMethods::getURI(const ExtensionEventHandlerPtr& handler) {
    return handler->getURI();
}

/**
 * @return The name of this event handler
 */
 std::string
 ExtensionEventHandlerMethods::getName(const ExtensionEventHandlerPtr& handler) {
    return handler->getURI();
 }

/********************************************************/

ExtensionFilterDefinitionPtr
ExtensionFilterDefinitionMethods::create(const std::string& uri, const std::string& name, const apl::ExtensionFilterDefinition::ImageCount imageCount) {
    return std::make_shared<ExtensionFilterDefinition>(uri, name, imageCount);
}

/**
* Add a named property. The property names "when" and "type" are reserved.
* @param property The property to add
* @param defvalue The default value to use for this property when it is not provided.
* @param required If true and the property is not provided, the command will not execute.
* @return This object for chaining.
*/
ExtensionFilterDefinitionPtr&
ExtensionFilterDefinitionMethods::property(ExtensionFilterDefinitionPtr& def, const std::string& property, emscripten::val defvalue) {
    def->property(property, emscripten::getObjectFromVal(defvalue));
    return def;
}

/**
 * @return The extension URI associated with this Filter
 */
std::string
ExtensionFilterDefinitionMethods::getURI(const ExtensionFilterDefinitionPtr& def) {
    return def->getURI();
}

/**
 * @return The name of this ExtensionFilterDefinition
 */
 std::string
 ExtensionFilterDefinitionMethods::getName(const ExtensionFilterDefinitionPtr& def) {
    return def->getURI();
}

/**
 * @return The number of images referenced by this filter (0, 1, or 2);
 */
 apl::ExtensionFilterDefinition::ImageCount
 ExtensionFilterDefinitionMethods::getImageCount(const ExtensionFilterDefinitionPtr& def) {
    return def->getImageCount();
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_extension) {

    emscripten::class_<apl::ExtensionCommandDefinition>("ExtensionCommandDefinition")
        .smart_ptr<internal::ExtensionCommandDefinitionPtr>("ExtensionCommandDefinitionPtr")
        .class_function("create",&internal::ExtensionCommandDefinitionMethods::create)
        .function("allowFastMode", &internal::ExtensionCommandDefinitionMethods::allowFastMode)
        .function("requireResolution", &internal::ExtensionCommandDefinitionMethods::requireResolution)
        .function("property", &internal::ExtensionCommandDefinitionMethods::property)
        .function("arrayProperty", &internal::ExtensionCommandDefinitionMethods::arrayProperty)
        .function("getURI", &internal::ExtensionCommandDefinitionMethods::getURI)
        .function("getName", &internal::ExtensionCommandDefinitionMethods::getName)
        .function("getAllowFastMode", &internal::ExtensionCommandDefinitionMethods::getAllowFastMode)
        .function("getRequireResolution", &internal::ExtensionCommandDefinitionMethods::getRequireResolution);

  emscripten::class_<apl::ExtensionEventHandler>("ExtensionEventHandler")
        .smart_ptr<internal::ExtensionEventHandlerPtr>("ExtensionEventHandlerPtr")
        .class_function("create",&internal::ExtensionEventHandlerMethods::create)
        .function("getURI", &internal::ExtensionEventHandlerMethods::getURI)
        .function("getName", &internal::ExtensionEventHandlerMethods::getName);

  emscripten::class_<apl::ExtensionFilterDefinition>("ExtensionFilterDefinition")
        .smart_ptr<internal::ExtensionFilterDefinitionPtr>("ExtensionFilterDefinitionPtr")
        .class_function("create",&internal::ExtensionFilterDefinitionMethods::create)
        .function("property", &internal::ExtensionFilterDefinitionMethods::property)
        .function("getURI", &internal::ExtensionFilterDefinitionMethods::getURI)
        .function("getName", &internal::ExtensionFilterDefinitionMethods::getName)
        .function("getImageCount", &internal::ExtensionFilterDefinitionMethods::getImageCount);

}

} // namespace wasm
} // namespace apl
