/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_TEXTMEASUREMENT_H
#define APL_WASM_TEXTMEASUREMENT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

class WASMMetrics;

class WasmTextMeasurement : public apl::TextMeasurement {
public:
    WasmTextMeasurement(emscripten::val measureCallback,
                        emscripten::val baselineCallback,
                        WASMMetrics *wasmMetrics);
    LayoutSize measure(apl::Component* component, float width, MeasureMode widthMode,
                   float height, MeasureMode heightMode) override;

    float baseline(apl::Component* component, float width, float height) override;
    emscripten::val measureCallback;
    emscripten::val baselineCallback;
    WASMMetrics    *wasmMetrics;
};

} // namespace wasm
} // namespace apl

#endif // APL_TEXTMEASUREMENT_H
