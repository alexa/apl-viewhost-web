/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {

struct DocumentConfigMethods {
    static apl::DocumentConfigPtr create();

    static bool processDataSourceUpdate(const apl::DocumentConfigPtr& config, const std::string& type, const std::string& payload);
};

}
}
}
