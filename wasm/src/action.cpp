/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/action.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

void
ActionMethods::resolve(apl::ActionPtr action) {
    return action->resolve();
}

void
ActionMethods::resolveWithArg(apl::ActionPtr action, int argument) {
    return action->resolve(argument);
}

void
ActionMethods::terminate(apl::ActionPtr action) {
    return action->terminate();
}

void
ActionMethods::addTerminateCallback(apl::ActionPtr action, emscripten::val callback) {
    action->addTerminateCallback([callback](const std::shared_ptr<Timers>& timers) { callback(); });
}

void
ActionMethods::then(apl::ActionPtr action, emscripten::val callback) {
    action->then([callback](const ActionPtr& action) {
        if (action->getUserData() != nullptr) {
            auto* doc = static_cast<rapidjson::Document*>(action->getUserData());
            delete doc;
            action->setUserData(nullptr);
        }
        callback(action);
    });
}

bool
ActionMethods::isPending(const apl::ActionPtr& action) {
    return action->isPending();
}

bool
ActionMethods::isTerminated(const apl::ActionPtr& action) {
    return action->isTerminated();
}

bool
ActionMethods::isResolved(const apl::ActionPtr& action) {
    return action->isResolved();
}

std::size_t
ActionMethods::getUserData(const apl::ActionPtr& action) {
    return reinterpret_cast<std::size_t>(action->getUserData());
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_action) {

    emscripten::class_<apl::Action>("Action")
        .smart_ptr<apl::ActionPtr>("ActionPtr")
        .function("resolve", &internal::ActionMethods::resolve)
        .function("resolveWithArg", &internal::ActionMethods::resolveWithArg)
        .function("addTerminateCallback", &internal::ActionMethods::addTerminateCallback)
        .function("then", &internal::ActionMethods::then)
        .function("terminate", &internal::ActionMethods::terminate)
        .function("isPending", &internal::ActionMethods::isPending)
        .function("isTerminated", &internal::ActionMethods::isTerminated)
        .function("isResolved", &internal::ActionMethods::isResolved)
        .function("getUserData", &internal::ActionMethods::getUserData);
}

} // namespace wasm

} // namespace apl