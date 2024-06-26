/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_TEXTMEASUREMENT_H
#define APL_WASM_TEXTMEASUREMENT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class WASMMetrics;

class WasmTextMeasurement : public apl::sg::TextMeasurement {
public:
    WasmTextMeasurement(emscripten::val measureCallback,
                        WASMMetrics *wasmMetrics);

    apl::sg::TextLayoutPtr layout(apl::Component *textComponent,
                                  const apl::sg::TextChunkPtr& chunk,
                                  const apl::sg::TextPropertiesPtr& textProperties,
                                  float width,
                                  apl::MeasureMode widthMode,
                                  float height,
                                  apl::MeasureMode heightMode) override;

    apl::sg::EditTextBoxPtr box(apl::Component *textComponent,
                                int size,
                                const apl::sg::TextPropertiesPtr& textProperties,
                                float width,
                                apl::MeasureMode widthMode,
                                float height,
                                apl::MeasureMode heightMode) override;

private:
    emscripten::val mMeasureCallback;
    WASMMetrics *mWasmMetrics;

    emscripten::val measureLayout(apl::Component *component,
                                  float width,
                                  apl::MeasureMode widthMode,
                                  float height,
                                  apl::MeasureMode heightMode);

    std::vector<std::string> convertToStringVector(const emscripten::val& textsByLine);

    std::vector<apl::Rect> convertToRectVector(const emscripten::val& rectsByLine);
};

} // namespace wasm
} // namespace apl

#endif // APL_TEXTMEASUREMENT_H
