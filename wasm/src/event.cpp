/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/event.h"
#include "apl/apl.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

apl::ComponentPtr
EventMethods::getComponent(const apl::Event& event) {
    return event.getComponent();
}

void
EventMethods::resolve(const apl::Event& event) {
    event.getActionRef().resolve();
}

void
EventMethods::resolveWithArg(const apl::Event& event, int argument) {
    event.getActionRef().resolve(argument);
}

void
EventMethods::resolveWithRect(const apl::Event& event, int x, int y, int width, int height) {
    auto m = event.getUserData<WASMMetrics>();
    auto scale = m->toCore(1.0f);
    Rect rect(x * scale, y * scale, width * scale, height * scale);
    event.getActionRef().resolve(rect);
}

void
EventMethods::addTerminateCallback(apl::Event event, emscripten::val callback) {
    event.getActionRef().addTerminateCallback(
        [callback](const std::shared_ptr<Timers>& timers) { callback(); });
}

bool
EventMethods::isPending(const apl::Event& event) {
    return event.getActionRef().isPending();
}

bool
EventMethods::isTerminated(const apl::Event& event) {
    return event.getActionRef().isTerminated();
}

bool
EventMethods::isResolved(const apl::Event& event) {
    return event.getActionRef().isResolved();
}

int
EventMethods::getType(apl::Event& event) {
    return event.getType();
}

emscripten::val
EventMethods::getValue(const apl::Event& event, int key) {
    auto m = event.getUserData<WASMMetrics>();
    auto value = event.getValue(static_cast<EventProperty>(key));
    return emscripten::getValFromObject(value, m);
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_event) {

    emscripten::class_<apl::Event>("Event")
        .function("getType", &internal::EventMethods::getType)
        .function("getValue", &internal::EventMethods::getValue)
        .function("getComponent", &internal::EventMethods::getComponent)
        .function("resolve", &internal::EventMethods::resolve)
        .function("resolveWithArg", &internal::EventMethods::resolveWithArg)
        .function("resolveWithRect", &internal::EventMethods::resolveWithRect)
        .function("addTerminateCallback", &internal::EventMethods::addTerminateCallback)
        .function("isPending", &internal::EventMethods::isPending)
        .function("isTerminated", &internal::EventMethods::isTerminated)
        .function("isResolved", &internal::EventMethods::isResolved);
}

} // namespace wasm

} // namespace apl