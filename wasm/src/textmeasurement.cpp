/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/textmeasurement.h"
#include "wasm/wasmmetrics.h"
#include "apl/apl.h"
#include "apl/utils/log.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

WasmTextMeasurement::WasmTextMeasurement(emscripten::val measureCallback,
                                         emscripten::val baselineCallback,
                                         WASMMetrics* wasmMetrics)
    : apl::TextMeasurement(),
      measureCallback(measureCallback),
      baselineCallback(baselineCallback),
      wasmMetrics(wasmMetrics)
{}

LayoutSize
WasmTextMeasurement::measure(apl::Component* textComponent, float width,
                             MeasureMode widthMode, float height, MeasureMode heightMode) {
    if (measureCallback.isUndefined()) {
        LOG(LogLevel::ERROR) << "There is no text measure callback installed";
        return {.height = 10, .width = 10};
    }
    apl::ComponentPtr component = textComponent->shared_from_this();
    component->setUserData(wasmMetrics);
    width = wasmMetrics->toViewhost(width);
    height = wasmMetrics->toViewhost(height);

    auto size = measureCallback(component, width, static_cast<int>(widthMode),
                                height, static_cast<int>(heightMode));
    width = wasmMetrics->toCore(size["width"].as<float>());
    height = wasmMetrics->toCore(size["height"].as<float>());
    return {.width = width, .height = height};
}

float
WasmTextMeasurement::baseline(apl::Component* textComponent, float width, float height) {
    if (baselineCallback.isUndefined()) {
        LOG(LogLevel::ERROR) << "There is no text baseline callback installed";
        return height * 10;
    }
    width = wasmMetrics->toViewhost(width);
    height = wasmMetrics->toViewhost(height);
    apl::ComponentPtr component = textComponent->shared_from_this();
    return wasmMetrics->toCore(baselineCallback(component, width, height).as<float>());
}

} // namespace wasm
} // namespace apl
