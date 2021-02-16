/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_WASMMETRICS_H
#define APL_WASM_WASMMETRICS_H

#include "apl/apl.h"

namespace apl {
namespace wasm {

class WASMMetrics : public MetricsTransform {
public:
    explicit WASMMetrics(Metrics& metrics) : MetricsTransform(metrics) {}
    WASMMetrics(Metrics& metrics, ScalingOptions& options) : MetricsTransform(metrics, options) {}

    /**
     * Converts dp units into px units
     * @param value dp unit
     * @return px unit
     */
    float toViewhost(float value) const override;

    /**
     * Converts px units into dp units
     * @param value px unit
     * @return dp unit
     */
    float toCore(float value) const override;

    /**
     * Return the viewport width in pixels
     * @return pixel width
     */
    float getViewhostWidth() const override;

    /**
     * Return the viewport height in pixels
     * @return pixel height
     */
    float getViewhostHeight() const override;
};

} // namespace wasm
} // namespace apl

#endif // APL_WASM_WASMMETRICS_H
