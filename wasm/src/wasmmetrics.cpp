/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/wasmmetrics.h"

namespace apl {
namespace wasm {

    float
    WASMMetrics::toViewhost(float value) const {
        return value * getScaleToViewhost() * getDpi() / 160.0f;
    }

    float
    WASMMetrics::toCore(float value) const {
        return value * getScaleToCore() * 160.0f / getDpi();
    }

    float
    WASMMetrics::getViewhostWidth() const {
        return getWidth();
    }

    float
    WASMMetrics::getViewhostHeight() const {
        return getHeight();
    }

} // namespace wasm
} // namespace apl