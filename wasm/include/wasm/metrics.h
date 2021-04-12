/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_METRICS_H
#define APL_WASM_METRICS_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
using MetricsPtr = std::shared_ptr<apl::Metrics>;

static std::map<std::string, ViewportMode> modeMap = {
    {"AUTO", kViewportModeAuto},
    {"HUB", kViewportModeHub},
    {"MOBILE", kViewportModeMobile},
    {"PC", kViewportModePC},
    {"TV", kViewportModeTV},
};

static std::map<std::string, ScreenShape> shapeMap = {
    {"ROUND", ROUND},
    {"RECTANGLE", RECTANGLE},
};

struct MetricsMethods {
    static MetricsPtr create();
    static MetricsPtr& size(MetricsPtr& metrics, double width, double height);
    static MetricsPtr& dpi(MetricsPtr& metrics, double dpi);
    static MetricsPtr& theme(MetricsPtr& metrics, const std::string& theme);
    static MetricsPtr& shape(MetricsPtr& metrics, const std::string& shape);
    static MetricsPtr& mode(MetricsPtr& metrics, const std::string& mode);
};

} // namespace internal

} // namespace wasm
} // namespace apl
#endif // APL_WASM_METRICS_H
