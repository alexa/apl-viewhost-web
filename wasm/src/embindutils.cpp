/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

#include "wasm/embindutils.h"
#include "apl/apl.h"
#include "wasm/rect.h"

namespace emscripten {

void
iterateProps(const apl::CalculatedPropertyMap& calculated, emscripten::val& map, WASMMetrics* m) {
    for (const auto& e : calculated) {
        auto prop = getValFromObject(e.second, m);
        if (!prop.isUndefined()) {
            map.set(static_cast<int>(e.first), prop);
        }
    }
}

emscripten::val
getValFromObject(const apl::Object& prop, WASMMetrics* m) {
    double scale;
    switch (prop.getType()) {
        case apl::Object::ObjectType::kNumberType:
            return emscripten::val(prop.asNumber());
        case apl::Object::ObjectType::kStringType:
            return emscripten::val(prop.asString());
        case apl::Object::ObjectType::kBoolType:
            return emscripten::val(prop.asBoolean());
        case apl::Object::ObjectType::kColorType:
            return emscripten::val(prop.asColor().get());
        case apl::Object::ObjectType::kAbsoluteDimensionType:
            scale = m->toViewhost(1.0f);
            return emscripten::val(prop.getAbsoluteDimension() * scale);
        case apl::Object::ObjectType::kFilterType:
            return getValFromObject(prop.getFilter(), m);
        case apl::Object::ObjectType::kRadiiType:
            return getValFromObject(prop.getRadii(), m);
        case apl::Object::ObjectType::kRectType:
            return getValFromObject(prop.getRect(), m);
        case apl::Object::ObjectType::kGradientType:
            return getValFromObject(prop.getGradient(), m);
        case apl::Object::ObjectType::kGraphicFilterType:
            return getValFromObject(prop.getGraphicFilter(), m);
        case apl::Object::ObjectType::kGraphicPatternType:
            return emscripten::val(prop.getGraphicPattern());
        case apl::Object::ObjectType::kMediaSourceType:
            return getValFromObject(prop.getMediaSource(), m);
        case apl::Object::ObjectType::kMapType:
            return getValFromObject(prop.getMap(), m);
        case apl::Object::ObjectType::kArrayType:
            return getValFromObject(prop.getArray(), m);
        case apl::Object::ObjectType::kStyledTextType:
            return getValFromObject(prop.getStyledText(), m);
        case apl::Object::ObjectType::kGraphicType: {
            // set the metrics here because we need them for scaling
            // a graphic element, which is derived from a graphic.
            auto graphic = prop.getGraphic();
            graphic->setUserData(m);
            return emscripten::val(graphic);
        }
        case apl::Object::ObjectType::kTransform2DType: {
            auto transform = prop.getTransform2D().get();
            auto mat = "matrix(" + std::to_string(transform[0]) + "," +
                       std::to_string(transform[1]) + "," + std::to_string(transform[2]) + "," +
                       std::to_string(transform[3]) + "," + std::to_string(transform[4]) +
                       "," + std::to_string(transform[5]) + ")";
            return emscripten::val(mat);
        }
        default:
            return emscripten::val::undefined();
    }
}

emscripten::val
getValFromObject(const apl::ObjectMap& map, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();
    for (const auto& e : map) {
        propObject.set(e.first, getValFromObject(e.second, m));
    }
    return propObject;
}

emscripten::val
getValFromObject(const std::map<int, apl::Object>& map, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();
    for (const auto& e : map) {
        propObject.set(e.first, getValFromObject(e.second, m));
    }
    return propObject;
}

emscripten::val
getValFromObject(const apl::ObjectArray& arr, WASMMetrics* m) {
    emscripten::val propArray = emscripten::val::array();
    int i = 0;
    for (const auto& e : arr) {
        propArray.set(i, getValFromObject(e, m));
        i++;
    }
    return propArray;
}

emscripten::val
getValFromObject(const apl::Gradient& gradient, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();
    emscripten::val type(static_cast<int>(gradient.getProperty(apl::kGradientPropertyType).asInt()));
    emscripten::val colorRange = emscripten::val::array();
    for (auto& color : gradient.getProperty(apl::kGradientPropertyColorRange).getArray()) {
        colorRange.call<void>("push", color.asColor().get());
    }
    emscripten::val inputRange = emscripten::val::array();
    for (auto& number : gradient.getProperty(apl::kGradientPropertyInputRange).getArray()) {
        inputRange.call<void>("push", number.asNumber());
    }
    emscripten::val angle(gradient.getProperty(apl::kGradientPropertyAngle).asNumber());
    emscripten::val spreadMethod(static_cast<int>(gradient.getProperty(apl::kGradientPropertySpreadMethod).asInt()));
    emscripten::val units(static_cast<int>(gradient.getProperty(apl::kGradientPropertyUnits).asInt()));
    emscripten::val x1(gradient.getProperty(apl::kGradientPropertyX1).asNumber());
    emscripten::val y1(gradient.getProperty(apl::kGradientPropertyY1).asNumber());
    emscripten::val x2(gradient.getProperty(apl::kGradientPropertyX2).asNumber());
    emscripten::val y2(gradient.getProperty(apl::kGradientPropertyY2).asNumber());
    emscripten::val centerX(gradient.getProperty(apl::kGradientPropertyCenterX).asNumber());
    emscripten::val centerY(gradient.getProperty(apl::kGradientPropertyCenterY).asNumber());
    emscripten::val radius(gradient.getProperty(apl::kGradientPropertyRadius).asNumber());

    propObject.set("type", type);
    propObject.set("colorRange", colorRange);
    propObject.set("inputRange", inputRange);
    propObject.set("angle", angle);
    propObject.set("spreadMethod", spreadMethod);
    propObject.set("units", units);
    propObject.set("x1", x1);
    propObject.set("y1", y1);
    propObject.set("x2", x2);
    propObject.set("y2", y2);
    propObject.set("centerX", centerX);
    propObject.set("centerY", centerY);
    propObject.set("radius", radius);

    return propObject;
}

emscripten::val
getValFromObject(const apl::MediaSource& mediaSource, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();

    propObject.set("url", emscripten::val(mediaSource.getUrl()));
    propObject.set("description", emscripten::val(mediaSource.getDescription()));
    propObject.set("duration", emscripten::val(mediaSource.getDuration()));
    propObject.set("repeatCount", emscripten::val(mediaSource.getRepeatCount()));
    propObject.set("offset", emscripten::val(mediaSource.getOffset()));

    return propObject;
}

emscripten::val
getValFromObject(const apl::StyledText& styledText, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();
    emscripten::val spans = emscripten::val::array();

    propObject.set("text", emscripten::val(styledText.getText()));
    for (auto& span : styledText.getSpans()) {
        emscripten::val spanObject = emscripten::val::object();
        spanObject.set("type", emscripten::val(static_cast<int>(span.type)));
        spanObject.set("start", emscripten::val(span.start));
        spanObject.set("end", emscripten::val(span.end));
        emscripten::val attributes = emscripten::val::array();
        for (auto& attribute : span.attributes) {
            emscripten::val attributeObject = emscripten::val::object();
            attributeObject.set("name", emscripten::val(static_cast<int>(attribute.name)));
            attributeObject.set("value", emscripten::val(getValFromObject(attribute.value, m)));
            attributes.call<void>("push", attributeObject);
        }
        spanObject.set("attributes", attributes);
        spans.call<void>("push", spanObject);
    }
    propObject.set("spans", spans);

    return propObject;
}

emscripten::val
getValFromObject(const apl::Filter& filter, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();
    propObject.set("type", emscripten::val(static_cast<int>(filter.getType())));
    switch (filter.getType()) {
        case apl::kFilterTypeBlur:
            propObject.set("radius", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyRadius), m)));
            propObject.set("source", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertySource), m)));
            break;
        case apl::kFilterTypeNoise:
            propObject.set("sigma", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertySigma), m)));
            propObject.set("useColor", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyUseColor), m)));
            propObject.set("kind", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyKind), m)));
            break;
        case apl::kFilterTypeBlend:
            propObject.set("mode", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyMode), m)));
            propObject.set("source", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertySource), m)));
            propObject.set("destination", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyDestination), m)));
            break;
        case apl::kFilterTypeColor:
            propObject.set("color", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyColor), m)));
            break;
        case apl::kFilterTypeGradient:
            propObject.set("gradient", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyGradient), m)));
            break;
        case apl::kFilterTypeGrayscale:
            propObject.set("amount", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyAmount), m)));
            propObject.set("source", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertySource), m)));
            break;
        case apl::kFilterTypeSaturate:
            propObject.set("amount", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertyAmount), m)));
            propObject.set("source", emscripten::val(getValFromObject(
                                         filter.getValue(apl::kFilterPropertySource), m)));
            break;
        default:
            return emscripten::val::undefined();
    }

    return propObject;
}

emscripten::val
getValFromObject(const apl::GraphicFilter& graphicFilter, WASMMetrics* m) {
    emscripten::val propObject = emscripten::val::object();
    propObject.set("type", emscripten::val(static_cast<int>(graphicFilter.getType())));
    switch (graphicFilter.getType()) {
        case apl::kGraphicFilterTypeDropShadow:
            propObject.set("color", emscripten::val(getValFromObject(
                                         graphicFilter.getValue(apl::kGraphicPropertyFilterColor), m)));
            propObject.set("radius", emscripten::val(getValFromObject(
                                         graphicFilter.getValue(apl::kGraphicPropertyFilterRadius), m)));
            propObject.set("horizontalOffset", emscripten::val(getValFromObject(
                                         graphicFilter.getValue(apl::kGraphicPropertyFilterHorizontalOffset), m)));
            propObject.set("verticalOffset", emscripten::val(getValFromObject(
                                         graphicFilter.getValue(apl::kGraphicPropertyFilterVerticalOffset), m)));
            break;
        default:
            return emscripten::val::undefined();
    }

    return propObject;
}

emscripten::val
getValFromObject(const apl::Radii& radii, WASMMetrics* m) {
    if (m) {
        auto topLeft = m->toViewhost(radii.topLeft());
        auto topRight = m->toViewhost(radii.topRight());
        auto bottomLeft = m->toViewhost(radii.bottomLeft());
        auto bottomRight = m->toViewhost(radii.bottomRight());
        return emscripten::val(apl::Radii(topLeft, topRight, bottomLeft, bottomRight));
    } else
        return emscripten::val(radii);
}

emscripten::val
getValFromObject(const apl::Rect& rect, WASMMetrics* m) {
    if (m) {
        auto x = m->toViewhost(rect.getX());
        auto y = m->toViewhost(rect.getY());
        auto w = m->toViewhost(rect.getWidth());
        auto h = m->toViewhost(rect.getHeight());
        return emscripten::val(apl::Rect(x, y, w, h));
    } else
        return emscripten::val(rect);
}

apl::Object
getObjectFromVal(emscripten::val val) {
    if (val.isTrue() || val.isFalse()) {
        return val.as<bool>();
    } else if (val.isString()) {
        return val.as<std::string>();
    } else if (val.isNumber()) {
        return val.as<double>();
    } else if (val.isArray()) {
        // Create an array
        auto arr = getObjectArrayFromVal(val);
        if (arr)
            return apl::Object(arr);
    } else if (val.typeOf().as<std::string>() == "object") {
        auto map = getObjectMapFromVal(val);
        if (map)
            return apl::Object(map);
    }

    return apl::Object::NULL_OBJECT();;
}

apl::ObjectArrayPtr
getObjectArrayFromVal(emscripten::val val) {
    if (val.isArray()) {
        // Create an array
        auto arr = std::make_shared<apl::ObjectArray>();
        for (auto v : emscripten::vecFromJSArray<emscripten::val>(val)) {
            arr->emplace_back(getObjectFromVal(v));
        }
        return arr;
    }

    return nullptr;
}

apl::ObjectMapPtr
getObjectMapFromVal(emscripten::val val) {
    if (val.typeOf().as<std::string>() == "object") {
        // Create a map.
        auto keys = val::global("Object").call<emscripten::val>("keys", val);
        auto map = std::make_shared<apl::ObjectMap>();
        if (keys.isArray()) {
            for (auto key : emscripten::vecFromJSArray<std::string>(keys)) {
                map->emplace(key, getObjectFromVal(val[key]));
            }
            return map;
        }
    }

    return nullptr;
}

} // namespace emscripten