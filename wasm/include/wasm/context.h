/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_CONTEXT_H
#define APL_WASM_CONTEXT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

static std::map<std::string, ViewportMode> modeMap = {
        {"AUTO", kViewportModeAuto},
        {"HUB", kViewportModeHub},
        {"MOBILE", kViewportModeMobile},
        {"PC", kViewportModePC},
        {"TV", kViewportModeTV},
};

struct ContextMethods {
    static apl::RootContextPtr create(emscripten::val options, emscripten::val text, emscripten::val metrics, emscripten::val content, emscripten::val config, emscripten::val scalingOptions);

    static apl::ComponentPtr topComponent(const apl::RootContextPtr& context);
    static std::string getTheme(const apl::RootContextPtr& context);
    static emscripten::val getBackground(const apl::RootContextPtr& context);
    static void setBackground(const apl::RootContextPtr& context, emscripten::val background);
    static std::string getDataSourceContext(const apl::RootContextPtr& context);
    static std::string getVisualContext(const apl::RootContextPtr& context);
    static void clearPending(const apl::RootContextPtr& context);
    static bool isDirty(const apl::RootContextPtr& context);
    static void clearDirty(const apl::RootContextPtr& context);
    static emscripten::val getDirty(const apl::RootContextPtr& context);
    static emscripten::val getPendingErrors(const apl::RootContextPtr& context);
    static bool hasEvent(const apl::RootContextPtr& context);
    static apl::Event popEvent(const apl::RootContextPtr& context);
    static bool screenLock(const apl::RootContextPtr& context);
    static apl_time_t currentTime(const apl::RootContextPtr& context);
    static apl_time_t nextTime(const apl::RootContextPtr& context);
    static void scrollToRectInComponent(const apl::RootContextPtr& context, const apl::ComponentPtr& component, int x, int y, int width, int height, int align);
    static void updateTime(const apl::RootContextPtr& context, apl_time_t currentTime, apl_time_t utcTime);
    static void setLocalTimeAdjustment(const apl::RootContextPtr& context, apl_duration_t offset);
    static apl::ActionPtr executeCommands(const apl::RootContextPtr& context, const std::string& commands);
    static apl::ActionPtr invokeExtensionEventHandler(const apl::RootContextPtr& context, const std::string& uri, const std::string& name, const std::string& data, bool fastMode);
    static void cancelExecution(const apl::RootContextPtr& context);
    static int getViewportWidth(const apl::RootContextPtr& context);
    static int getViewportHeight(const apl::RootContextPtr& context);
    static double getScaleFactor(const apl::RootContextPtr& context);
    static void updateCursorPosition(const apl::RootContextPtr& context, float x, float y);
    static bool handlePointerEvent(const apl::RootContextPtr& context, int pointerEventType, float x, float y, int pointerId, int pointerType);
    static bool handleKeyboard(const apl::RootContextPtr& context, int type, const emscripten::val& keyboard);
    static bool processDataSourceUpdate(const apl::RootContextPtr& context, const std::string& payload, const std::string& type);
    static void handleDisplayMetrics(const apl::RootContextPtr& context, emscripten::val metrics);
    static void configurationChange(const apl::RootContextPtr& context, emscripten::val configurationChange, emscripten::val metrics, emscripten::val scalingOptions);
    static void updateDisplayState(const apl::RootContextPtr& context, int displayState);
    static void reInflate(const apl::RootContextPtr& context);
    static void setFocus(const apl::RootContextPtr& context, int direction, const apl::Rect& origin, const std::string& targetId);
    static std::string getFocused(const apl::RootContextPtr& context);
    static emscripten::val getFocusableAreas(const apl::RootContextPtr& context);
    static void mediaLoaded(const apl::RootContextPtr& context, const std::string& source);
    static void mediaLoadFailed(const apl::RootContextPtr& context, const std::string& source, int errorCode, const std::string& error);

private:
    static void applyScalingOptions(emscripten::val& scalingOptions,
                                    std::vector<ViewportSpecification>& specs,
                                    Metrics& coreMetrics,
                                    bool& shapeOverridesCost,
                                    double& k);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_CONTEXT_H
