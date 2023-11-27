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
MetricsMethods::size(MetricsPtr& metrics, int width, int height) {
    metrics->size(width, height);
    return metrics;
}

MetricsPtr&
MetricsMethods::dpi(MetricsPtr& metrics, int dpi) {
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

MetricsPtr&
MetricsMethods::minAndMaxWidth(MetricsPtr& metrics, int minWidth, int maxWidth) {
    metrics->minAndMaxWidth(minWidth, maxWidth);
    return metrics;
}

MetricsPtr&
MetricsMethods::minAndMaxHeight(MetricsPtr& metrics, int minHeight, int maxHeight) {
    metrics->minAndMaxHeight(minHeight, maxHeight);
    return metrics;
}

float
MetricsMethods::getHeight(MetricsPtr& metrics) {
    return metrics->getHeight();
}

float
MetricsMethods::getWidth(MetricsPtr& metrics) {
    return metrics->getWidth();
}

float
MetricsMethods::getMinHeight(MetricsPtr& metrics) {
    return metrics->getMinHeight();
}

float
MetricsMethods::getMinWidth(MetricsPtr& metrics) {
    return metrics->getMinWidth();
}

float
MetricsMethods::getMaxHeight(MetricsPtr& metrics) {
    return metrics->getMaxHeight();
}

float
MetricsMethods::getMaxWidth(MetricsPtr& metrics) {
    return metrics->getMaxWidth();
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_metrics) {
    emscripten::class_<apl::Metrics>("Metrics")
        .smart_ptr<internal::MetricsPtr>("MetricsPtr")
        .class_function("create", &internal::MetricsMethods::create)
        .function("size", &internal::MetricsMethods::size)
        .function("minAndMaxWidth", &internal::MetricsMethods::minAndMaxWidth)
        .function("minAndMaxHeight", &internal::MetricsMethods::minAndMaxHeight)
        .function("getHeight", &internal::MetricsMethods::getHeight)
        .function("getWidth", &internal::MetricsMethods::getWidth)
        .function("getMinHeight", &internal::MetricsMethods::getMinHeight)
        .function("getMinWidth", &internal::MetricsMethods::getMinWidth)
        .function("getMaxHeight", &internal::MetricsMethods::getMaxHeight)
        .function("getMaxWidth", &internal::MetricsMethods::getMaxWidth)
        .function("dpi", &internal::MetricsMethods::dpi)
        .function("theme", &internal::MetricsMethods::theme)
        .function("shape", &internal::MetricsMethods::shape)
        .function("mode", &internal::MetricsMethods::mode);
}

} // namespace wasm
} // namespace apl
