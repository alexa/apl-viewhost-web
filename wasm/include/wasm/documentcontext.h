/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

struct DocumentContextMethods {
    static bool isVisualContextDirty(const apl::DocumentContextPtr& context);
    static void clearVisualContextDirty(const apl::DocumentContextPtr& context);
    static std::string getVisualContext(const apl::DocumentContextPtr& context);
    static bool isDataSourceContextDirty(const apl::DocumentContextPtr& context);
    static void clearDataSourceContextDirty(const apl::DocumentContextPtr& context);
    static std::string getDataSourceContext(const apl::DocumentContextPtr& context);
    static apl::ContentPtr& content(const apl::DocumentContextPtr& context);
    static apl::ActionPtr executeCommands(const apl::DocumentContextPtr& context, const std::string& commands, bool fastMode);
};

}
}
}
