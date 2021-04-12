/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/metrics.h"

namespace apl {
namespace wasm {

namespace internal {

MetricsPtr
MetricsMethods::create() {
    return std::make_shared<Metrics>();
}

MetricsPtr&
MetricsMethods::size(MetricsPtr& metrics, double width, double height) {
    metrics->size(width, height);
    return metrics;
}

MetricsPtr&
MetricsMethods::dpi(MetricsPtr& metrics, double dpi) {
    metrics->dpi(dpi);
    return metrics;
}

MetricsPtr&
MetricsMethods::theme(MetricsPtr& metrics, const std::string& theme) {
    metrics->theme(theme.c_str());
    return metrics;
}

MetricsPtr&
MetricsMethods::shape(MetricsPtr& metrics, const std::string& shape) {
    metrics->shape(shapeMap.at(shape));
    return metrics;
}

MetricsPtr&
MetricsMethods::mode(MetricsPtr& metrics, const std::string& mode) {
    metrics->mode(modeMap.at(mode));
    return metrics;
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_metrics) {
    
    emscripten::class_<apl::Metrics>("Metrics")
        .smart_ptr<internal::MetricsPtr>("MetricsPtr")
        .class_function("create", &internal::MetricsMethods::create)
        .function("size", &internal::MetricsMethods::size)
        .function("dpi", &internal::MetricsMethods::dpi)
        .function("theme", &internal::MetricsMethods::theme)
        .function("shape", &internal::MetricsMethods::shape)
        .function("mode", &internal::MetricsMethods::mode);
}

} // namespace wasm
} // namespace apl
