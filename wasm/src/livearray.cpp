/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/livearray.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

apl::LiveArrayPtr
LiveArrayMethods::create(emscripten::val array) {
    // We need to move it afterwards, so
    auto initArray = emscripten::getObjectArrayFromVal(array);
    if (initArray) {    
        return apl::LiveArray::create(std::move(*initArray));
    }
    return apl::LiveArray::create();
}

bool
LiveArrayMethods::empty(const apl::LiveArrayPtr& liveArrayPtr) {
    return liveArrayPtr->empty();
}

void 
LiveArrayMethods::clear(const apl::LiveArrayPtr& liveArrayPtr) {
    liveArrayPtr->clear();
}

size_t 
LiveArrayMethods::size(const apl::LiveArrayPtr& liveArrayPtr) {
    return liveArrayPtr->size();
}

emscripten::val 
LiveArrayMethods::at(const apl::LiveArrayPtr& liveArrayPtr, size_t position) {
    return emscripten::getValFromObject(liveArrayPtr->at(position), nullptr);
}

bool
LiveArrayMethods::insert(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val value) {
    return liveArrayPtr->insert(position, emscripten::getObjectFromVal(value));
}

bool
LiveArrayMethods::insertRange(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val array) {
    auto transformed = emscripten::getObjectArrayFromVal(array);
    if (transformed) {
        return liveArrayPtr->insert(position, transformed->begin(), transformed->end());
    }
    return false;
}

bool
LiveArrayMethods::remove(const apl::LiveArrayPtr& liveArrayPtr, size_t position, size_t count) {
    return liveArrayPtr->remove(position, count);
}

bool
LiveArrayMethods::update(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val value) {
    auto transformed = emscripten::getObjectFromVal(value);
    return liveArrayPtr->update(position, transformed);
}

bool 
LiveArrayMethods::updateRange(const apl::LiveArrayPtr& liveArrayPtr, size_t position, emscripten::val array) {
    auto transformed = emscripten::getObjectArrayFromVal(array);
    if (transformed) {
        return liveArrayPtr->update(position, transformed->begin(), transformed->end());
    }
    return false;
}

void 
LiveArrayMethods::push_back(const apl::LiveArrayPtr& liveArrayPtr, emscripten::val value) {
    auto transformed = emscripten::getObjectFromVal(value);
    liveArrayPtr->push_back(transformed);
}

bool 
LiveArrayMethods::push_backRange(const apl::LiveArrayPtr& liveArrayPtr, emscripten::val array) {
    auto transformed = emscripten::getObjectArrayFromVal(array);
    if (transformed) {
        return liveArrayPtr->push_back(transformed->begin(), transformed->end());
    }
    return false;
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_livearray) {
    emscripten::class_<apl::LiveArray>("LiveArray")
        .smart_ptr<apl::LiveArrayPtr>("LiveArrayMap")
        .class_function("create", &internal::LiveArrayMethods::create)
        .function("empty", &internal::LiveArrayMethods::empty)
        .function("clear", &internal::LiveArrayMethods::clear)
        .function("size", &internal::LiveArrayMethods::size)
        .function("at", &internal::LiveArrayMethods::at)
        .function("insert", &internal::LiveArrayMethods::insert)
        .function("insertRange", &internal::LiveArrayMethods::insertRange)
        .function("remove", &internal::LiveArrayMethods::remove)
        .function("update", &internal::LiveArrayMethods::update)
        .function("updateRange", &internal::LiveArrayMethods::updateRange)
        .function("push_back", &internal::LiveArrayMethods::push_back)
        .function("push_backRange", &internal::LiveArrayMethods::push_backRange);
}

} // namespace wasm
} // namespace apl
