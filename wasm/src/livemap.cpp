/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#include "wasm/livemap.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

apl::LiveMapPtr 
LiveMapMethods::create(emscripten::val map) {
    // We need to move it afterwards, so
    auto initMap = emscripten::getObjectMapFromVal(map);
    if (initMap) {    
        return apl::LiveMap::create(std::move(*initMap));
    }

    return apl::LiveMap::create();
}

bool 
LiveMapMethods::empty(const apl::LiveMapPtr& liveMapPtr) {
    return liveMapPtr->empty();
}

void 
LiveMapMethods::clear(const apl::LiveMapPtr& liveMapPtr) {
    liveMapPtr->clear();
}

emscripten::val 
LiveMapMethods::get(const apl::LiveMapPtr& liveMapPtr, const std::string& key) {
    return emscripten::getValFromObject(liveMapPtr->get(key), nullptr);
}

bool 
LiveMapMethods::has(const apl::LiveMapPtr& liveMapPtr, const std::string& key) {
    return liveMapPtr->has(key);
}

void 
LiveMapMethods::set(const apl::LiveMapPtr& liveMapPtr, const std::string& key, emscripten::val value) {
    liveMapPtr->set(key, emscripten::getObjectFromVal(value));
}

void 
LiveMapMethods::update(const apl::LiveMapPtr& liveMapPtr, emscripten::val map) {
    auto transformed = emscripten::getObjectMapFromVal(map);
    if (transformed)
        liveMapPtr->update(*transformed);
}

void 
LiveMapMethods::replace(const apl::LiveMapPtr& liveMapPtr, emscripten::val map) {
    auto transformed = emscripten::getObjectMapFromVal(map);
    if (transformed)
        liveMapPtr->replace(std::move(*transformed));
}

bool 
LiveMapMethods::remove(const apl::LiveMapPtr& liveMapPtr, const std::string& key) {
    return liveMapPtr->remove(key);
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_livemap) {
    emscripten::class_<apl::LiveMap>("LiveMap")
        .smart_ptr<apl::LiveMapPtr>("LiveMapPtr")
        .class_function("create", &internal::LiveMapMethods::create)
        .function("empty", &internal::LiveMapMethods::empty)
        .function("clear", &internal::LiveMapMethods::clear)
        .function("get", &internal::LiveMapMethods::get)
        .function("has", &internal::LiveMapMethods::has)
        .function("set", &internal::LiveMapMethods::set)
        .function("update", &internal::LiveMapMethods::update)
        .function("replace", &internal::LiveMapMethods::replace)
        .function("remove", &internal::LiveMapMethods::remove);
}

} // namespace wasm
} // namespace apl
