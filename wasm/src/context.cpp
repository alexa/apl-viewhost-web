/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
#include "wasm/context.h"
#include "wasm/wasmmetrics.h"
#include "apl/apl.h"
#include "apl/dynamicdata.h"
#include "wasm/textmeasurement.h"
#include <rapidjson/stringbuffer.h>
#include <rapidjson/writer.h>
#include "wasm/embindutils.h"
#include "wasm/session.h"
#include "utils/jsparser.h"
#include <climits>

namespace apl {
namespace wasm {

namespace internal {

static const size_t DEFAULT_DATA_SOURCE_CACHE_CHUNK_SIZE = 10;
static const std::string DYNAMIC_INDEX_LIST = "dynamicIndexList";
static const std::string DYNAMIC_TOKEN_LIST = "dynamicTokenList";
static const std::vector<std::string> KNOWN_DATA_SOURCES = { DYNAMIC_INDEX_LIST, DYNAMIC_TOKEN_LIST };
static emscripten::val background = emscripten::val::object();

apl::ComponentPtr
ContextMethods::topComponent(const apl::RootContextPtr& context) {
    // pass along the metrics user data
    auto top = context->topComponent();
    top->setUserData(context->getUserData());
    return top;
}

apl::DocumentContextPtr
ContextMethods::topDocument(const apl::RootContextPtr& context) {
    return context->topDocument();
}

emscripten::val
ContextMethods::getBackground(const apl::RootContextPtr& context) {
    return background;
}

void
ContextMethods::setBackground(const apl::RootContextPtr& context, emscripten::val bg) {
    background = bg;
}

std::string
ContextMethods::getDataSourceContext(const apl::RootContextPtr& context) {
    rapidjson::Document document(rapidjson::kObjectType);
    rapidjson::StringBuffer buffer;
    rapidjson::Document::AllocatorType& allocator = document.GetAllocator();
    auto dataSourceContext = context->serializeDataSourceContext(allocator);
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    dataSourceContext.Accept(writer);
    return buffer.GetString();
}

std::string
ContextMethods::getVisualContext(const apl::RootContextPtr& context) {
    rapidjson::Document state(rapidjson::kObjectType);
    rapidjson::StringBuffer buffer;
    rapidjson::Document::AllocatorType& allocator = state.GetAllocator();
    auto visualContext = context->topComponent()->serializeVisualContext(allocator);
    rapidjson::Writer<rapidjson::StringBuffer> writer(buffer);
    visualContext.Accept(writer);
    return buffer.GetString();
}

void
ContextMethods::clearPending(const apl::RootContextPtr& context) {
    context->clearPending();
}

bool
ContextMethods::isDirty(const apl::RootContextPtr& context) {
    return context->isDirty();
}

void
ContextMethods::clearDirty(const apl::RootContextPtr& context) {
    context->clearDirty();
}

emscripten::val
ContextMethods::getDirty(const apl::RootContextPtr& context) {
    emscripten::val dirtyComponentIds = emscripten::val::array();
    auto& dirty = context->getDirty();
    for (auto& component : dirty) {
        dirtyComponentIds.call<void>("push", component->getUniqueId());
    }
    return dirtyComponentIds;
}

void
ContextMethods::scrollToRectInComponent(const apl::RootContextPtr& context, const apl::ComponentPtr& component,
                                        int x, int y, int width, int height, int align) {
    auto t = context->getUserData<WASMMetrics>();
    float scale = t->toCore(1.0f);
    Rect rect(x * scale, y * scale, width * scale, height * scale);
    context->scrollToRectInComponent(component, rect, static_cast<CommandScrollAlign>(align));
}

apl::ActionPtr
ContextMethods::executeCommands(const apl::RootContextPtr& context, const std::string& commands) {
    auto* doc = new rapidjson::Document();
    doc->Parse(commands.c_str());
    apl::Object obj = apl::Object(*doc);
    auto action = context->executeCommands(obj, false);
    action->setUserData(doc);
    // The consumer is not required to add a "then" or "terminate" callback,
    // so add them here to clean up the document
    action->then([doc](const ActionPtr& action) {
        if (action->getUserData() != nullptr) {
            delete doc;
            action->setUserData(nullptr);
        }
    });
    action->addTerminateCallback([doc, action](const std::shared_ptr<Timers>&) {
        if (action->getUserData() != nullptr) {
            delete doc;
            action->setUserData(nullptr);
        }
    });
    return action;
}

apl::ActionPtr
ContextMethods::invokeExtensionEventHandler(const apl::RootContextPtr& context, const std::string& uri, const std::string& name, const std::string& data, bool fastMode) {
    auto* doc = new rapidjson::Document();
    doc->Parse(data.c_str());
    apl::Object obj = apl::Object(*doc);
    auto action = context->invokeExtensionEventHandler(uri, name, obj.getMap(), false);
    action->setUserData(doc);
    // The consumer is not required to add a "then" or "terminate" callback,
    // so add them here to clean up the document
    action->then([doc](const ActionPtr& action) {
        if (action->getUserData() != nullptr) {
            delete doc;
            action->setUserData(nullptr);
        }
    });
    action->addTerminateCallback([doc, action](const std::shared_ptr<Timers>&) {
        if (action->getUserData() != nullptr) {
            delete doc;
            action->setUserData(nullptr);
        }
    });
    return action;
}

void
ContextMethods::cancelExecution(const apl::RootContextPtr& context) {
    context->cancelExecution();
}

void
ContextMethods::applyScalingOptions(emscripten::val& scalingOptions,
                                    std::vector<ViewportSpecification>& specs,
                                    Metrics& coreMetrics,
                                    bool& shapeOverridesCost,
                                    double& k) {
    if (!scalingOptions.isUndefined()) {
        k = scalingOptions["biasConstant"].as<double>();
        auto specifications = scalingOptions["specifications"];
        int length = specifications["length"].as<int>();
        for (int i = 0; i < length; i++) {
            auto spec = specifications[i];
            bool isSpecRound = coreMetrics.getScreenShape() == ScreenShape::ROUND;
            auto mode = kViewportModeHub;
            const std::string defaultMode = "HUB";
            auto stringMode = jsparser::getOptionalValue(spec, "mode", defaultMode);
            if(modeMap.find(stringMode) != modeMap.end()) {
                mode = modeMap[stringMode];
            }

            const double viewportMin = 1;
            specs.emplace_back(
                                jsparser::getOptionalValue(spec, "minWidth", viewportMin),
                                jsparser::getOptionalValue(spec, "maxWidth", INT_MAX),
                                jsparser::getOptionalValue(spec, "minHeight",viewportMin),
                                jsparser::getOptionalValue(spec, "maxHeight", INT_MAX),
                                mode,
                                isSpecRound
                            );
        }
        if(!scalingOptions["shapeOverridesCost"].isUndefined()) {
            shapeOverridesCost = scalingOptions["shapeOverridesCost"].as<bool>();
        }
    }
}

apl::RootContextPtr
ContextMethods::create(emscripten::val options, emscripten::val text, emscripten::val metrics, emscripten::val content, emscripten::val config, emscripten::val scalingOptions) {
    try {
        auto coreMetrics = *(metrics.as<std::shared_ptr<Metrics>>());
        auto rootConfig = *(config.as<std::shared_ptr<RootConfig>>());

        // Add Data Sources
        rootConfig.dataSourceProvider(DYNAMIC_INDEX_LIST, std::make_shared<DynamicIndexListDataSourceProvider>(DYNAMIC_INDEX_LIST,
            DEFAULT_DATA_SOURCE_CACHE_CHUNK_SIZE));
        rootConfig.dataSourceProvider(DYNAMIC_TOKEN_LIST, std::make_shared<DynamicTokenListDataSourceProvider>());

        // Other options
        auto contentPtr = content.as<ContentPtr>();

        std::vector<ViewportSpecification> specs;
        bool shapeOverridesCost = true;
        double k = 0;

        bool autosizing = coreMetrics.getMinHeight() != coreMetrics.getMaxHeight() || coreMetrics.getMinWidth() != coreMetrics.getMaxWidth();

        if (!autosizing) {
            applyScalingOptions(
                scalingOptions,
                specs,
                coreMetrics,
                shapeOverridesCost,
                k
            );
        }

        apl::RootContextPtr root;
        WASMMetrics* m;
        do {
            if (!scalingOptions.isUndefined()) {
                ScalingOptions so(specs, k, shapeOverridesCost);
                m = new WASMMetrics(coreMetrics, so);
            }
            else {
                m = new WASMMetrics(coreMetrics);
            }

            // set apl renderer callbacks
            if (!text.isUndefined()) {
                auto onMeasure = text["onMeasure"].call<emscripten::val>("bind", text);
                auto textMeasure = std::make_shared<WasmTextMeasurement>(onMeasure, m);
                auto onPEGTLError = text["onPEGTLError"].call<emscripten::val>("bind", text);
                auto wasmSession = std::make_shared<WasmSession>(onPEGTLError);
                rootConfig.measure(textMeasure);
                rootConfig.session(wasmSession);
            }
            root = RootContext::create(m->getMetrics(), contentPtr, rootConfig);
            if(root) break;
            else {
                LOG(LogLevel::WARN) << "Failed to inflate document with spec: " << (specs.empty() ? "standard" : m->getChosenSpec().toDebugString());
            }

            // If context is null, then remove the chosen specification and try again
            auto it = specs.begin();
            for(; it != specs.end(); it++) {
                if(*it == m->getChosenSpec()) {
                    specs.erase(it);
                    break;
                }
            }

            if (it == specs.end()) {
                // Core returned specification that is not in list. Something went wrong. Prevent infinite loop.
                break;
            }
        } while(!specs.empty());

        // get document background, color or gradient
        background.set("color", emscripten::val(Color().asString())); // Transparent
        background.set("gradient", emscripten::val::null());
        if (contentPtr->getBackground(coreMetrics, rootConfig).is<Color>()) {
            background.set("color", emscripten::val(contentPtr->getBackground(coreMetrics, rootConfig).asColor().asString()));
        } else if (contentPtr->getBackground(coreMetrics, rootConfig).is<Gradient>()) {
            background.set("gradient", emscripten::getValFromObject(contentPtr->getBackground(coreMetrics, rootConfig).get<Gradient>(), m));
        }

        // add metrics to the root context so we can connect our viewport to any events, components,
        // or graphic elements for scaling.
        root->setUserData(m);
        // this has to be called to set mCore->top
        root->topComponent();
        return root;
    }
    catch (const std::exception& e) {
        LOG(LogLevel::ERROR) << "Cannot create root context";
        LOG(LogLevel::ERROR) << e.what();
        return nullptr;
    }
}

emscripten::val
ContextMethods::getPendingErrors(const apl::RootContextPtr& context) {
    std::vector<apl::Object> errorArray;

    for (auto& type : KNOWN_DATA_SOURCES) {
        auto provider = context->getRootConfig().getDataSourceProvider(type);

        if (provider) {
            auto pendingErrors = provider->getPendingErrors();
            if (!pendingErrors.empty() && pendingErrors.isArray()) {
                errorArray.insert(errorArray.end(), pendingErrors.getArray().begin(), pendingErrors.getArray().end());
            }
        }
    }

    auto errors = apl::Object(std::make_shared<apl::ObjectArray>(errorArray));

    auto m = context->getUserData<WASMMetrics>();
    return emscripten::getValFromObject(errors, m);
}

bool
ContextMethods::hasEvent(const apl::RootContextPtr& context) {
    return context->hasEvent();
}

apl::Event
ContextMethods::popEvent(const apl::RootContextPtr& context) {
    auto event = context->popEvent();
    event.setUserData(context->getUserData());
    return event;
}

bool
ContextMethods::screenLock(const apl::RootContextPtr& context) {
    return context->screenLock();
}

apl_time_t
ContextMethods::currentTime(const apl::RootContextPtr& context) {
    return context->currentTime();
}

apl_time_t
ContextMethods::nextTime(const apl::RootContextPtr& context) {
    return context->nextTime();
}

void
ContextMethods::updateTime(const apl::RootContextPtr& context, apl_time_t currentTime, apl_time_t utcTime) {
    return context->updateTime(currentTime, utcTime);
}

void
ContextMethods::setLocalTimeAdjustment(const apl::RootContextPtr& context, apl::apl_duration_t offset) {
    context->setLocalTimeAdjustment(offset);
}

emscripten::val
ContextMethods::getViewportPixelSize(const apl::RootContextPtr& context) {
    auto m = context->getUserData<WASMMetrics>();
    auto width = m->toViewhost(context->getViewportSize().getWidth());
    auto height = m->toViewhost(context->getViewportSize().getHeight());

    emscripten::val size = emscripten::val::object();
    size.set("width", width);
    size.set("height", height);
    return size;
}

int
ContextMethods::getViewportWidth(const apl::RootContextPtr& context) {
    return context->getViewportSize().getWidth();
}

int
ContextMethods::getViewportHeight(const apl::RootContextPtr& context) {
    return context->getViewportSize().getHeight();
}

double
ContextMethods::getScaleFactor(const apl::RootContextPtr& context) {
    auto m = context->getUserData<WASMMetrics>();
    return m->toViewhost(1.0f);
}

void
ContextMethods::updateCursorPosition(const apl::RootContextPtr& context, float x, float y) {
    auto m = context->getUserData<WASMMetrics>();
    apl::Point cursorPosition(m->toCore(x), m->toCore(y));
    context->updateCursorPosition(cursorPosition);
}

bool
ContextMethods::handlePointerEvent(const apl::RootContextPtr& context,
                                   int pointerEventType,
                                   float x,
                                   float y,
                                   int pointerId,
                                   int pointerType) {
    auto m = context->getUserData<WASMMetrics>();
    apl::Point cursorPosition(m->toCore(x), m->toCore(y));
    apl::PointerEvent pointerEvent(static_cast<apl::PointerEventType>(pointerEventType), cursorPosition, static_cast<apl::id_type>(pointerId), static_cast<apl::PointerType>(pointerType));
    return context->handlePointerEvent(pointerEvent);
}

bool
ContextMethods::handleKeyboard(const apl::RootContextPtr& context, int type, const emscripten::val& keyboard) {
    if (!keyboard.hasOwnProperty("code") || !keyboard.hasOwnProperty("key") || !keyboard.hasOwnProperty("repeat") ||
        !keyboard.hasOwnProperty("altKey") || !keyboard.hasOwnProperty("ctrlKey") ||
        !keyboard.hasOwnProperty("metaKey") || !keyboard.hasOwnProperty("shiftKey")) {
        LOG(LogLevel::ERROR) << "Can't handle keyboard event. Keybaord data structure is wrong.";
        return false;
    }

    apl::Keyboard kbd(keyboard["code"].as<std::string>(), keyboard["key"].as<std::string>());
    kbd.repeat(keyboard["repeat"].as<bool>());
    kbd.alt(keyboard["altKey"].as<bool>());
    kbd.ctrl(keyboard["ctrlKey"].as<bool>());
    kbd.meta(keyboard["metaKey"].as<bool>());
    kbd.shift(keyboard["shiftKey"].as<bool>());
    return context->handleKeyboard(static_cast<apl::KeyHandlerType>(type), kbd);
}

bool
ContextMethods::processDataSourceUpdate(const apl::RootContextPtr& context, const std::string& payload, const std::string& type) {
    if (std::find(KNOWN_DATA_SOURCES.begin(), KNOWN_DATA_SOURCES.end(), type) == KNOWN_DATA_SOURCES.end())
        return false;

    auto provider = std::static_pointer_cast<DynamicIndexListDataSourceProvider>(context->getRootConfig().getDataSourceProvider(type));
    if (!provider)
        return false;

    return provider->processUpdate(payload);
}

void
ContextMethods::handleDisplayMetrics(const apl::RootContextPtr& context, emscripten::val metrics) {
    // To Be Implemented
}

void
ContextMethods::configurationChange(const apl::RootContextPtr& context, emscripten::val configurationChange, emscripten::val metrics, emscripten::val scalingOptions) {
    auto configChange = *(configurationChange.as<std::shared_ptr<ConfigurationChange>>());
    if (metrics.isUndefined()) {
        context->configurationChange(configChange);
    } else {
        auto m = context->getUserData<WASMMetrics>();
        auto coreMetrics = *(metrics.as<std::shared_ptr<Metrics>>());

        std::vector<ViewportSpecification> specs;
        bool shapeOverridesCost = true;
        double k = 0;

        applyScalingOptions(
            scalingOptions,
            specs,
            coreMetrics,
            shapeOverridesCost,
            k
        );

        if (!scalingOptions.isUndefined()) {
            ScalingOptions so(specs, k, shapeOverridesCost);
            m = new WASMMetrics(coreMetrics, so);
        }
        else {
            m = new WASMMetrics(coreMetrics);
        }
        float newWidth = m->toViewhost(coreMetrics.getWidth());
        float newHeight = m->toViewhost(coreMetrics.getHeight());
        configChange.size((int) m->toCorePixel(newWidth), (int) m->toCorePixel(newHeight));
        context->configurationChange(configChange);
        context->setUserData(m);
    }
}

void 
ContextMethods::updateDisplayState(const apl::RootContextPtr& context, int displayState) {
    context->updateDisplayState(static_cast<apl::DisplayState>(displayState));
}

void
ContextMethods::reInflate(const apl::RootContextPtr& context) {
    context->reinflate();
}

void
ContextMethods::setFocus(const apl::RootContextPtr& context, int direction, const apl::Rect& origin, const std::string& targetId) {
    context->setFocus(static_cast<apl::FocusDirection>(direction), origin, targetId);
}

std::string
ContextMethods::getFocused(const apl::RootContextPtr& context) {
    return context->getFocused();
}

emscripten::val
ContextMethods::getFocusableAreas(const apl::RootContextPtr& context) {
    auto m = context->getUserData<WASMMetrics>();
    auto focusable = context->getFocusableAreas();
    emscripten::val propObject = emscripten::val::object();

    for(auto const& area : focusable) {
                    propObject.set(area.first, area.second);
    }
    return propObject;
}

void
ContextMethods::mediaLoaded(const apl::RootContextPtr& context, const std::string& source) {
    context->mediaLoaded(source);
}

void
ContextMethods::mediaLoadFailed(const apl::RootContextPtr& context, const std::string& source, int errorCode = -1, const std::string& error = std::string()){
    context->mediaLoadFailed(source, errorCode, error);
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_context) {

    emscripten::class_<apl::RootContext>("Context")
        .smart_ptr<apl::RootContextPtr>("ContextPtr")
        .function("topComponent", &internal::ContextMethods::topComponent)
        .function("topDocument", &internal::ContextMethods::topDocument)
        .function("getBackground", &internal::ContextMethods::getBackground)
        .function("setBackground", &internal::ContextMethods::setBackground)
        .function("getDataSourceContext", &internal::ContextMethods::getDataSourceContext)
        .function("getVisualContext", &internal::ContextMethods::getVisualContext)
        .function("clearPending", &internal::ContextMethods::clearPending)
        .function("isDirty", &internal::ContextMethods::isDirty)
        .function("clearDirty", &internal::ContextMethods::clearDirty)
        .function("getDirty", &internal::ContextMethods::getDirty)
        .function("getPendingErrors", &internal::ContextMethods::getPendingErrors)
        .function("hasEvent", &internal::ContextMethods::hasEvent)
        .function("popEvent", &internal::ContextMethods::popEvent)
        .function("screenLock", &internal::ContextMethods::screenLock)
        .function("scrollToRectInComponent", &internal::ContextMethods::scrollToRectInComponent)
        .function("executeCommands", &internal::ContextMethods::executeCommands)
        .function("invokeExtensionEventHandler", &internal::ContextMethods::invokeExtensionEventHandler)
        .function("cancelExecution", &internal::ContextMethods::cancelExecution)
        .function("currentTime", &internal::ContextMethods::currentTime)
        .function("nextTime", &internal::ContextMethods::nextTime)
        .function("updateTime", &internal::ContextMethods::updateTime)
        .function("setLocalTimeAdjustment", &internal::ContextMethods::setLocalTimeAdjustment)
        .function("getViewportPixelSize", &internal::ContextMethods::getViewportPixelSize)
        .function("getViewportWidth", &internal::ContextMethods::getViewportWidth)
        .function("getViewportHeight", &internal::ContextMethods::getViewportHeight)
        .function("getScaleFactor", &internal::ContextMethods::getScaleFactor)
        .function("updateCursorPosition", &internal::ContextMethods::updateCursorPosition)
        .function("handlePointerEvent", &internal::ContextMethods::handlePointerEvent)
        .function("handleKeyboard", &internal::ContextMethods::handleKeyboard)
        .function("processDataSourceUpdate", &internal::ContextMethods::processDataSourceUpdate)
        .function("handleDisplayMetrics", &internal::ContextMethods::handleDisplayMetrics)
        .function("configurationChange", &internal::ContextMethods::configurationChange)
        .function("updateDisplayState", &internal::ContextMethods::updateDisplayState)
        .function("reInflate", &internal::ContextMethods::reInflate)
        .function("setFocus", &internal::ContextMethods::setFocus)
        .function("getFocused", &internal::ContextMethods::getFocused)
        .function("getFocusableAreas", &internal::ContextMethods::getFocusableAreas)
        .function("mediaLoaded", &internal::ContextMethods::mediaLoaded)
        .function("mediaLoadFailed", &internal::ContextMethods::mediaLoadFailed)
        .class_function("create", &internal::ContextMethods::create);
}

} // namespace wasm
} // namespace apl
