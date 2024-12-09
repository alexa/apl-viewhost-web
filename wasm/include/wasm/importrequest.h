/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_IMPORTREQUEST_H
#define APL_WASM_IMPORTREQUEST_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

EMSCRIPTEN_BINDINGS(apl_wasm_importrequest) {

    emscripten::class_<apl::ImportRequest>("ImportRequest")
        .function("isValid", &apl::ImportRequest::isValid)
        .function("reference", &apl::ImportRequest::reference)
        .function("source", &apl::ImportRequest::source);

    emscripten::class_<apl::ImportRef>("ImportRef")
        .function("toString", &apl::ImportRef::toString)
        .function("version", &apl::ImportRef::version)
        .function("name", &apl::ImportRef::name)
        .function("domain", &apl::ImportRef::domain);
}

} // namespace wasm
} // namespace apl

#endif // APL_IMPORTREQUEST_H
