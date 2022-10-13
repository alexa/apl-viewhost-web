
get_directory_property(ENUMGEN_BIN DIRECTORY ${APL_CORE_PATH} DEFINITION ENUMGEN_BIN)

include(config.cmake)
include_directories(include)
add_executable(apl-wasm
    src/audioplayer.cpp
    src/audioplayerfactory.cpp
    src/mediaplayer.cpp
    src/mediaplayerfactory.cpp
    src/main.cpp
    src/logbridge.cpp
    src/log.cpp
    src/configurationchange.cpp
    src/content.cpp
    src/rootconfig.cpp
    src/extension.cpp
    src/extensionclient.cpp
    src/component.cpp
    src/embindutils.cpp
    src/context.cpp
    src/textmeasurement.cpp
    src/dimension.cpp
    src/event.cpp
    src/action.cpp
    src/graphic.cpp
    src/graphicelement.cpp
    src/graphicpattern.cpp
    src/livearray.cpp
    src/livemap.cpp
    src/localemethods.cpp
    src/wasmmetrics.cpp
    src/metrics.cpp
    src/session.cpp
    src/utils/jsparser.cpp)
target_link_libraries(apl-wasm apl)
target_link_libraries(apl-wasm ${YOGA_LIB})
target_include_directories(apl-wasm PRIVATE include)

#install required files
set(JS_DIR ${CMAKE_SOURCE_DIR}/js)
set(SANDBOX_DIR ${CMAKE_SOURCE_DIR}/sandbox)
set(WEB_PUBLIC_DIR ${SANDBOX_DIR}/apl-wasm-sandbox/public)
set(DIST_DIR ${JS_DIR}/apl-wasm/lib)
install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/apl-wasm.js
    DESTINATION ${WEB_PUBLIC_DIR})
install(FILES
        ${CMAKE_CURRENT_BINARY_DIR}/apl-wasm.js
        DESTINATION ${DIST_DIR})
if(WASM_ASMJS)
    install(FILES
        ${CMAKE_CURRENT_BINARY_DIR}/apl-wasm.js.mem
        DESTINATION ${WEB_PUBLIC_DIR})
endif(WASM_ASMJS)

add_custom_target(generate-wasm-enums ALL
        COMMAND cd ${APL_PROJECT_DIR} && ${ENUMGEN_BIN}
        -f "AnimationQuality"
        -f "AudioPlayerEventType"
        -f "AudioTrack"
        -f "BlendMode"
        -f "CommandAudioTrack"
        -f "CommandControlMedia"
        -f "CommandHighlightMode"
        -f "CommandPosition"
        -f "CommandPropertyKey"
        -f "CommandScrollAlign"
        -f "CommandType"
        -f "ComponentType"
        -f "ContainerDirection"
        -f "DimensionType"
        -f "Display"
        -f "DisplayState"
        -f "DocumentPropertyKey"
        -f "EventType"
        -f "EventMediaType"
        -f "EventProperty"
        -f "FilterProperty"
        -f "FilterType"
        -f "FlexboxAlign"
        -f "FlexboxJustifyContent"
        -f "FocusDirection"
        -f "FontStyle"
        -f "GradientProperty"
        -f "GradientSpreadMethod"
        -f "GradientType"
        -f "GradientUnits"
        -f "GraphicElementType"
        -f "GraphicFilterType"
        -f "GraphicFilterProperty"
        -f "GraphicLayoutDirection"
        -f "GraphicLineCap"
        -f "GraphicLineJoin"
        -f "GraphicTextAnchor"
        -f "GraphicPropertyKey"
        -f "GraphicScale"
        -f "ImageAlign"
        -f "ImageScale"
        -f "KeyboardType"
        -f "LayoutDirection"
        -f "LogLevel"
        -f "MediaPlayerEventType"
        -f "Navigation"
        -f "NoiseFilterKind"
        -f "PointerEventType"
        -f "PointerType"
        -f "Position"
        -f "PropertyKey"
        -f "ScreenShape"
        -f "ScrollDirection"
        -f "Snap"
        -f "SpanAttributeName"
        -f "SpanType"
        -f "SubmitKeyType"
        -f "TextAlign"
        -f "TextAlignVertical"
        -f "TrackState"
        -f "UpdateType"
        -f "VectorGraphicScale"
        -f "VideoScale"
        -l typescript -o ${JS_DIR}/apl-html/src/enums
        ${APL_CORE_PATH}/aplcore/include/**/*.h
        ${APL_CORE_PATH}/aplcore/include/apl/**/*.h
        DEPENDS enumgen
        )

add_dependencies(apl-wasm generate-wasm-enums)

if(CMAKE_BUILD_TYPE MATCHES Debug)
    set(YARN_BUILD_COMMAND "build:wasm:dev")
else()
    set(YARN_BUILD_COMMAND "build:wasm:prod")
endif()

add_custom_target(wasm-build
    COMMAND bash -c "yarn install"
    COMMAND bash -c "yarn ${YARN_BUILD_COMMAND}"
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/js
    DEPENDS apl-wasm generate-wasm-enums)

add_custom_target(wasm-build-test
        COMMAND bash -c "yarn install"
        COMMAND bash -c "yarn build:wasm:test"
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/js
        DEPENDS apl-wasm generate-wasm-enums)

add_custom_target(wasm-test
        COMMAND bash -c "yarn test"
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/js/apl-wasm
        DEPENDS wasm-build-test)
