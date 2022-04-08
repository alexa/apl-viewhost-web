/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#ifndef APL_WASM_EMBINDUTILS_H
#define APL_WASM_EMBINDUTILS_H

#include "apl/apl.h"
#include "wasmmetrics.h"
#include <emscripten/bind.h>
#include <set>
#include <utility>

namespace emscripten {

using apl::LogLevel;
using apl::wasm::WASMMetrics;

/**
 * Iterates over a CalculatedPropertyMap, and returns a emscripten object
 * @param calculated The calcualted properties from a component
 * @param map The emscripten object to place the props into.
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 */
void
iterateProps(const apl::CalculatedPropertyMap& calculated, emscripten::val& map, WASMMetrics* metrics);

/**
 * Converts an apl::Object into an emscripten value. Works with deeply nested
 * Objects.
 * @param obj The Object to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten value
 */
emscripten::val
getValFromObject(const apl::Object& obj, WASMMetrics* metrics);

/**
 * Converts an apl::ObjectMap into an emscripten::object. Works with deeply nested
 * Objects.
 * @param obj The ObjectMap to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten object
 */
emscripten::val
getValFromObject(const apl::ObjectMap& map, WASMMetrics* metrics);

/**
 * Converts a std::map<int, apl::Object> into an emscripten::object.
 * Works with deeply nested Objects.
 * @param map
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return
 */
emscripten::val
getValFromObject(const std::map<int, apl::Object>& map, WASMMetrics* metrics);

/**
 * Converts an apl::ObjectArray into an emscripten::array. Works with deeply nested
 * Objects.
 * @param obj The ObjectArray to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten array
 */
emscripten::val
getValFromObject(const apl::ObjectArray& arr, WASMMetrics* metrics);

/**
 * Converts an apl::Gradient into an emscripten::object.
 * @param gradient The Gradient to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten object
 */
emscripten::val
getValFromObject(const apl::Gradient& gradient, WASMMetrics* metrics);

/**
 * Converts an apl::MediaSource into an emscripten::object.
 * @param mediaSource The MediaSource to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten object
 */
emscripten::val
getValFromObject(const apl::MediaSource& mediaSource, WASMMetrics* metrics);

/**
 * Converts an apl::URLRequest into an emscripten::object.
 * @param urlRequest The URLRequest to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten object
 */
emscripten::val
getValFromObject(const apl::URLRequest& urlRequest, WASMMetrics* metrics);

/**
 * Converts an apl::StyledText into an emscripten::object.
 * @param styledText The StyledText to convert
 * @param metrics Metrics for transforming dimensions to and from core to viewhost
 * @return The emscripten object
 */
emscripten::val
getValFromObject(const apl::StyledText& styledText, WASMMetrics* metrics);

emscripten::val
getValFromObject(const apl::Filter& filter, WASMMetrics* metrics);

emscripten::val
getValFromObject(const apl::GraphicFilter& graphicFilter, WASMMetrics* metrics);

emscripten::val
getValFromObject(const apl::Radii& radii, WASMMetrics* metrics);

emscripten::val
getValFromObject(const apl::Rect& rect, WASMMetrics* metrics);

apl::Object
getObjectFromVal(emscripten::val val);

apl::ObjectArrayPtr
getObjectArrayFromVal(emscripten::val val);

apl::ObjectMapPtr
getObjectMapFromVal(emscripten::val val);

namespace internal {

/**
 * Helper methods for implementing collections properties for a JavaScript Set
 * @tparam SetType The Set specialization
 */
template <typename SetType>
struct SetMethods {
    static SetType& add(SetType& set, const typename SetType::value_type& element) {
        set.insert(element);
        return set;
    }

    static bool has(const SetType& set, const typename SetType::value_type& element) {
        return set.count(element);
    }

    static void forEach(const SetType& set, emscripten::val callback) {
        for (const auto& element : set) {
            callback(element, element, set);
        }
    }

    static void clear(SetType& set) { set.clear(); }

    static void deleteElement(SetType& set, const typename SetType::value_type& element) {
        set.erase(element);
    }

    static int size(const SetType& set) { return set.size(); }
};
} // namespace internal

/**
 * Use this to register conversion of a std::set specialization. This implements the
 * collection properties of a JavaScript Set.
 * @tparam T The set's value type
 * @param name Unique class name. This will be obj.constructor.name.
 * @return
 */
    template <typename T>
    class_<std::set<T>>
    register_set(const char* name) {
        typedef std::set<T> SetType;
        return class_<std::set<T>>(name)
                .function("add", &internal::SetMethods<SetType>::add)
                .function("has", &internal::SetMethods<SetType>::has)
                .function("forEach", &internal::SetMethods<SetType>::forEach)
                .function("clear", &internal::SetMethods<SetType>::clear)
                .function("delete", &internal::SetMethods<SetType>::deleteElement)
                .property("size", &internal::SetMethods<SetType>::size);
    }
} // namespace emscripten

#endif // APL_EMBINDUTILS_H
