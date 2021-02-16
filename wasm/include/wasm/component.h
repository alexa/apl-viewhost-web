/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 */

#ifndef APL_WASM_COMPONENT_H
#define APL_WASM_COMPONENT_H

#include "apl/apl.h"
#include <emscripten/bind.h>

namespace apl {
namespace wasm {

namespace internal {
struct ComponentMethods {

    static emscripten::val getDirtyProps(apl::ComponentPtr& component);
    static emscripten::val getCalculated(const apl::ComponentPtr& component);
    static emscripten::val getCalculatedByKey(const apl::ComponentPtr& component, int key);
    static int getType(const apl::ComponentPtr& component);
    static std::string getUniqueId(const apl::ComponentPtr& component);
    static std::string getId(const apl::ComponentPtr& component);
    static apl::ComponentPtr getParent(const apl::ComponentPtr& component);

    static void update(apl::ComponentPtr& component, int type, int val);
    static void updateEditText(apl::ComponentPtr& component, int type, const std::string& val);
    static void pressed(apl::ComponentPtr& component);
    static void updateScrollPosition(apl::ComponentPtr& component, float scrollPosition);
    static void updatePagerPosition(apl::ComponentPtr& component, int pagerPosition);
    static void updateMediaState(apl::ComponentPtr& component, const emscripten::val& state, bool fromEvent);
    static bool updateGraphic(apl::ComponentPtr& component, const std::string& avg);

    static size_t getChildCount(const apl::ComponentPtr& component);
    static apl::ComponentPtr getChildAt(const apl::ComponentPtr& component, size_t index);

    static bool appendChild(const apl::ComponentPtr& component, const apl::ComponentPtr& child);
    static bool insertChild(const apl::ComponentPtr& component, const apl::ComponentPtr& child, size_t index);
    static bool remove(const apl::ComponentPtr& component);
    static apl::ComponentPtr inflateChild(const apl::ComponentPtr& component, const std::string& data, size_t index);

    static Rect getBoundsInParent(const apl::ComponentPtr& component,
                                  const apl::ComponentPtr& ancestor);
    static Rect getGlobalBounds(const apl::ComponentPtr& component);
    static void ensureLayout(apl::ComponentPtr component);

    static bool isCharacterValid(const apl::ComponentPtr& component, const std::wstring& c);

    static std::string provenance(const apl::ComponentPtr& component);
};
} // namespace internal

} // namespace wasm
} // namespace apl

#endif // APL_WASM_COMPONENT_H
