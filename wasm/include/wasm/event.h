/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_EVENT_H
#define APL_WASM_EVENT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
struct EventMethods {

    static int getType(apl::Event& event);
    static emscripten::val getValue(const apl::Event& event, int key);
    static apl::ComponentPtr getComponent(const apl::Event& event);
    static void resolve(const apl::Event& event);
    static void resolveWithArg(const apl::Event& event, int argument);
    static void resolveWithRect(const apl::Event& event, int x, int y, int width, int height);
    static void addTerminateCallback(apl::Event event, emscripten::val callback);
    static bool isPending(const apl::Event& event);
    static bool isTerminated(const apl::Event& event);
    static bool isResolved(const apl::Event& event);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_EVENT_H
