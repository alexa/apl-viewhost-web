/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/component.h"
#include "apl/utils/log.h"
#include "wasm/embindutils.h"

namespace apl {
namespace wasm {

namespace internal {

emscripten::val
ComponentMethods::getDirtyProps(apl::ComponentPtr& component) {
    auto m = component->getUserData<WASMMetrics>();
    auto keys = component->getDirty();
    auto& calculated = component->getCalculated();
    auto props = emscripten::val::object();
    for (PropertyKey key : keys) {
        auto value = calculated[key];
        props.set(static_cast<int>(key), emscripten::getValFromObject(value, m));
    }
    return props;
}

emscripten::val
ComponentMethods::getCalculated(const apl::ComponentPtr& component) {
    auto m = component->getUserData<WASMMetrics>();
    auto props = emscripten::val::object();
    iterateProps(component->getCalculated(), props, m);
    return props;
}

emscripten::val
ComponentMethods::getCalculatedByKey(const apl::ComponentPtr& component, int key) {
    auto m = component->getUserData<WASMMetrics>();
    return emscripten::getValFromObject(component->getCalculated(static_cast<PropertyKey>(key)), m);
}

int
ComponentMethods::getType(const apl::ComponentPtr& component) {
    return static_cast<int>(component->getType());
}

std::string
ComponentMethods::getUniqueId(const apl::ComponentPtr& component) {
    return component->getUniqueId();
}

std::string
ComponentMethods::getId(const apl::ComponentPtr& component) {
    return component->getId();
}

apl::ComponentPtr
ComponentMethods::getParent(const apl::ComponentPtr& component) {
    return component->getParent();
}

void
ComponentMethods::update(apl::ComponentPtr& component, int type, int val) {
    component->update(static_cast<UpdateType>(type), val);
}

void
ComponentMethods::updateEditText(apl::ComponentPtr& component, int type, const std::string& val) {
    component->update(static_cast<UpdateType>(type), val);
}

void
ComponentMethods::pressed(apl::ComponentPtr& component) {
    component->update(kUpdatePressed);
}

void
ComponentMethods::updateScrollPosition(apl::ComponentPtr& component, float scrollPosition) {
    auto m = component->getUserData<WASMMetrics>();
    auto p = m->toCore(scrollPosition);
    component->update(kUpdateScrollPosition, p);
}

void
ComponentMethods::updatePagerPosition(apl::ComponentPtr& component, int pagerPosition) {
    component->update(kUpdatePagerPosition, pagerPosition);
}

void
ComponentMethods::updateMediaState(apl::ComponentPtr& component, const emscripten::val& state, bool fromEvent) {
    if (!state.hasOwnProperty("trackIndex") || !state.hasOwnProperty("trackCount") ||
        !state.hasOwnProperty("currentTime") || !state.hasOwnProperty("duration") ||
        !state.hasOwnProperty("paused") || !state.hasOwnProperty("ended") ||
        !state.hasOwnProperty("errorCode") || !state.hasOwnProperty("trackState"))
        {
        LOG(LogLevel::ERROR) << "Can't update media state. MediaStatus structure is wrong.";
        return;
    }

    MediaState mediaState(state["trackIndex"].as<int>(), state["trackCount"].as<int>(),
                                state["currentTime"].as<int>(), state["duration"].as<int>(),
                                state["paused"].as<bool>(), state["ended"].as<bool>());
    mediaState.withTrackState(static_cast<apl::TrackState>(state["trackState"].as<int>()));
    mediaState.withErrorCode(state["errorCode"].as<int>());

    component->updateMediaState(mediaState, fromEvent);
}

bool
ComponentMethods::updateGraphic(apl::ComponentPtr& component, const std::string& avg) {
    auto json = GraphicContent::create(avg);
    return component->updateGraphic(json);
}

size_t
ComponentMethods::getChildCount(const apl::ComponentPtr& component) {
    return component->getChildCount();
}

apl::ComponentPtr
ComponentMethods::getChildAt(const apl::ComponentPtr& component, size_t index) {
    auto child = component->getChildAt(index);
    child->setUserData(component->getUserData());
    return child;
}

size_t
ComponentMethods::getDisplayedChildCount(const apl::ComponentPtr& component) {
    return component->getDisplayedChildCount();
}

apl::ComponentPtr
ComponentMethods::getDisplayedChildAt(const apl::ComponentPtr& component, size_t index) {
    auto child = component->getDisplayedChildAt(index);
    child->setUserData(component->getUserData());
    return child;
}

std::string
ComponentMethods::getDisplayedChildId(const apl::ComponentPtr& component, size_t displayIndex) {
    if (component->getDisplayedChildCount() > displayIndex) {
        return component->getDisplayedChildAt(displayIndex)->getUniqueId().c_str();
    }
    return "";
}

bool
ComponentMethods::appendChild(const apl::ComponentPtr& component, const apl::ComponentPtr& child) {
    return component->appendChild(child);
}

bool
ComponentMethods::insertChild(const apl::ComponentPtr& component, const apl::ComponentPtr& child,
                              size_t index) {
    return component->insertChild(child, index);
}

bool
ComponentMethods::remove(const apl::ComponentPtr& component) {
    return component->remove();
}

apl::ComponentPtr
ComponentMethods::inflateChild(const apl::ComponentPtr& component, const std::string& data, size_t index) {
    JsonData jdata(data);
    auto child = component->inflateChildAt(jdata.get(), index);
    if(child) {
        child->setUserData(component->getUserData());
    }
    return child;
}

Rect
ComponentMethods::getBoundsInParent(const apl::ComponentPtr& component,
                                    const apl::ComponentPtr& ancestor) {
    Rect rect;
    bool success = component->getBoundsInParent(ancestor, rect);

    if (!success) {
        LOG(LogLevel::ERROR) << "Cannot get bounds with an invalid ancestor";
        return Rect();
    }

    auto m = component->getUserData<WASMMetrics>();
    auto x = m->toViewhost(rect.getX());
    auto y = m->toViewhost(rect.getY());
    auto w = m->toViewhost(rect.getWidth());
    auto h = m->toViewhost(rect.getHeight());
    return Rect(x, y, w, h);
}

Rect
ComponentMethods::getGlobalBounds(const apl::ComponentPtr& component) {
    auto rect = component->getGlobalBounds();
    auto m = component->getUserData<WASMMetrics>();
    auto x = m->toViewhost(rect.getX());
    auto y = m->toViewhost(rect.getY());
    auto w = m->toViewhost(rect.getWidth());
    auto h = m->toViewhost(rect.getHeight());
    return Rect(x, y, w, h);
}

void
ComponentMethods::ensureLayout(apl::ComponentPtr component) {
    component->ensureLayout(true);
}

bool
ComponentMethods::isCharacterValid(const apl::ComponentPtr& component, const std::wstring& c) {
    if (c.length() == 1) {
        return component->isCharacterValid(static_cast<wchar_t>(c[0]));
    }
    return false;
}

std::string
ComponentMethods::provenance(const apl::ComponentPtr& component) {
    return component->provenance();
}

} // namespace internal

EMSCRIPTEN_BINDINGS(apl_wasm_component) {

    emscripten::register_set<int>("IntSet");
    emscripten::register_set<PropertyKey>("PropertyKeySet");

    emscripten::class_<apl::Component>("Component")
        .smart_ptr<std::shared_ptr<apl::Component>>("ComponentPtr")
        .function("getCalculated", &internal::ComponentMethods::getCalculated)
        .function("getCalculatedByKey", &internal::ComponentMethods::getCalculatedByKey)
        .function("getDirtyProps", &internal::ComponentMethods::getDirtyProps)
        .function("getType", &internal::ComponentMethods::getType)
        .function("getUniqueId", &internal::ComponentMethods::getUniqueId)
        .function("getId", &internal::ComponentMethods::getId)
        .function("getParent", &internal::ComponentMethods::getParent)
        .function("getChildCount", &internal::ComponentMethods::getChildCount)
        .function("getChildAt", &internal::ComponentMethods::getChildAt)
        .function("appendChild", &internal::ComponentMethods::appendChild)
        .function("insertChild", &internal::ComponentMethods::insertChild)
        .function("remove", &internal::ComponentMethods::remove)
        .function("inflateChild", &internal::ComponentMethods::inflateChild)
        .function("update", &internal::ComponentMethods::update)
        .function("updateEditText", &internal::ComponentMethods::updateEditText)
        .function("pressed", &internal::ComponentMethods::pressed)
        .function("updateScrollPosition", &internal::ComponentMethods::updateScrollPosition)
        .function("updatePagerPosition", &internal::ComponentMethods::updatePagerPosition)
        .function("updateMediaState", &internal::ComponentMethods::updateMediaState)
        .function("updateGraphic", &internal::ComponentMethods::updateGraphic)
        .function("getBoundsInParent", &internal::ComponentMethods::getBoundsInParent)
        .function("getGlobalBounds", &internal::ComponentMethods::getGlobalBounds)
        .function("ensureLayout", &internal::ComponentMethods::ensureLayout)
        .function("isCharacterValid", &internal::ComponentMethods::isCharacterValid)
        .function("provenance", &internal::ComponentMethods::provenance)
        .function("getDisplayedChildCount", &internal::ComponentMethods::getDisplayedChildCount)
        .function("getDisplayedChildId", &internal::ComponentMethods::getDisplayedChildId)
        .function("getDisplayedChildAt", &internal::ComponentMethods::getDisplayedChildAt);
}

} // namespace wasm
} // namespace apl
