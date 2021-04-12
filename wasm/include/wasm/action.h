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
struct ActionMethods {

    static void resolve(apl::ActionPtr action);
    static void resolveWithArg(apl::ActionPtr action, int argument);
    static void addTerminateCallback(apl::ActionPtr action, emscripten::val callback);
    static void then(apl::ActionPtr action, emscripten::val callback);
    static void terminate(apl::ActionPtr action);
    static bool isPending(const apl::ActionPtr& action);
    static bool isTerminated(const apl::ActionPtr& action);
    static bool isResolved(const apl::ActionPtr& action);

    /**
     * Used exclusively by unit tests to make sure user data is deleted
     * @param action
     * @return
     */
    static std::size_t getUserData(const apl::ActionPtr& action);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_EVENT_H
