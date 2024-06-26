/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/textmeasurement.h"
#include "wasm/edittextbox.h"
#include "wasm/textlayout.h"
#include "wasm/wasmmetrics.h"
#include "apl/apl.h"
#include "apl/utils/log.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

WasmTextMeasurement::WasmTextMeasurement(emscripten::val measureCallback,
                                         WASMMetrics* wasmMetrics)
    : apl::sg::TextMeasurement(),
      mMeasureCallback(measureCallback),
      mWasmMetrics(wasmMetrics)
{}

apl::sg::TextLayoutPtr 
WasmTextMeasurement::layout(apl::Component *component,
                            const apl::sg::TextChunkPtr& chunk,
                            const apl::sg::TextPropertiesPtr& textProperties,
                            float width,
                            apl::MeasureMode widthMode,
                            float height,
                            apl::MeasureMode heightMode) {
    auto layout = measureLayout(component, width, widthMode, height, heightMode);

    width = mWasmMetrics->toCore(layout["width"].as<float>());
    height = mWasmMetrics->toCore(layout["height"].as<float>());
    float baseline = mWasmMetrics->toCore(layout["baseline"].as<float>());
    int lineCount = mWasmMetrics->toCore(layout["lineCount"].as<int>());
    std::string plainText = layout["plainText"].as<std::string>();
    std::string laidOutText = layout["laidOutText"].as<std::string>();
    bool isTruncated = layout["isTruncated"].as<bool>();
    std::vector<std::string> textsByLine = convertToStringVector(layout["textsByLine"]);
    std::vector<apl::Rect> rectsByLine = convertToRectVector(layout["rectsByLine"]);

    return std::make_shared<WasmTextLayout>(width, 
                                            height,
                                            baseline,
                                            lineCount,
                                            plainText,
                                            laidOutText,
                                            isTruncated,
                                            textsByLine,
                                            rectsByLine);
}

apl::sg::EditTextBoxPtr 
WasmTextMeasurement::box(apl::Component *component,
                         int size,
                         const apl::sg::TextPropertiesPtr& textProperties,
                         float width,
                         apl::MeasureMode widthMode,
                         float height,
                         apl::MeasureMode heightMode) {
    auto layout = measureLayout(component, width, widthMode, height, heightMode);

    width = mWasmMetrics->toCore(layout["width"].as<float>());
    height = mWasmMetrics->toCore(layout["height"].as<float>());
    float baseline = mWasmMetrics->toCore(layout["baseline"].as<float>());

    return std::make_shared<WasmEditTextBox>(width, height, baseline);
}

emscripten::val
WasmTextMeasurement::measureLayout(apl::Component *component,
                                   float width,
                                   apl::MeasureMode widthMode,
                                   float height,
                                   apl::MeasureMode heightMode) {
    apl::ComponentPtr textComponent = component->shared_from_this();
    textComponent->setUserData(mWasmMetrics);
    width = mWasmMetrics->toViewhost(width);
    height = mWasmMetrics->toViewhost(height);

    return mMeasureCallback(textComponent,
                           width,
                           static_cast<int>(widthMode),
                           height,
                           static_cast<int>(heightMode));
}

std::vector<std::string>
WasmTextMeasurement::convertToStringVector(const emscripten::val& textsByLine) {
    std::vector<std::string> result;

    if (textsByLine.isArray()) {
        const size_t length = textsByLine["length"].as<size_t>();
        result.reserve(length);

        for (size_t i = 0; i < length; ++i) {
            emscripten::val text = textsByLine[i];

            if (text.isString()) {
                result.push_back(text.as<std::string>());
            }
        }
    }

    return result;    
}

std::vector<apl::Rect>
WasmTextMeasurement::convertToRectVector(const emscripten::val& rectsByLine) {
    std::vector<apl::Rect> result;

    if (rectsByLine.isArray()) {
        const size_t length = rectsByLine["length"].as<size_t>();
        result.reserve(length);

        for (size_t i = 0; i < length; ++i) {
            emscripten::val rect = rectsByLine[i];

            if (rect.isArray() && rect["length"].as<size_t>() == 4) {
                float x = mWasmMetrics->toCore(rect[0].as<float>());
                float y = mWasmMetrics->toCore(rect[1].as<float>());
                float width = mWasmMetrics->toCore(rect[2].as<float>());
                float height = mWasmMetrics->toCore(rect[3].as<float>());
                result.emplace_back(x, y, width, height);
            }
        }
    }
    
    return result;
}

} // namespace wasm
} // namespace apl
