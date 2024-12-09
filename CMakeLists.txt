cmake_minimum_required(VERSION 3.6)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

project(apl-wasm VERSION 1.0.0 LANGUAGES C CXX)

option(APL_CORE_PATH "Path to APLCoreEngine" OFF)

# Web Assembly
option(WASM "Build WebAssembly binary" OFF)
option(BUNDLE_MODE "Bundle the WebAssembly binary to the js" ON)
option(ASMJS "Build ASM.js" OFF)
option(WEBSOCKET "Build Websocket Server" OFF)
option(EMSCRIPTEN_SOURCEMAPS "Builds source maps." OFF)
option(WASM_PROFILING "WASM profiling mode." OFF)

if(WASM)
    # make sure we enable exception support when building APL core, since PEGTL
    # relies on it
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fexceptions")
    if(BUNDLE_MODE)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s SINGLE_FILE=1")
    endif()
endif()

if(${APL_CORE_PATH} STREQUAL "OFF")
    set(APL_CORE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/../APLCoreEngine)
endif()

set(APL_CORE_BUILD_DIR ${CMAKE_CURRENT_BINARY_DIR}/apl)
add_subdirectory(${APL_CORE_PATH} ${APL_CORE_BUILD_DIR})

# Get Common APLCoreProperties
get_directory_property(APL_PROJECT_DIR DIRECTORY ${APL_CORE_PATH} DEFINITION APL_PROJECT_DIR)
get_directory_property(RAPIDJSON_INCLUDE DIRECTORY ${APL_CORE_PATH} DEFINITION RAPIDJSON_INCLUDE)
get_directory_property(PEGTL_INCLUDE DIRECTORY ${APL_CORE_PATH} DEFINITION PEGTL_INCLUDE)
get_directory_property(YOGA_INCLUDE DIRECTORY ${APL_CORE_PATH} DEFINITION YOGA_INCLUDE)
get_directory_property(YOGA_LIB DIRECTORY ${APL_CORE_PATH} DEFINITION YOGA_LIB)

# Set common include paths
include_directories(${APL_CORE_BUILD_DIR}/aplcore/include)
include_directories(${APL_CORE_PATH}/aplcore/include)
include_directories(${PEGTL_INCLUDE})
include_directories(${RAPIDJSON_INCLUDE})
include_directories(${YOGA_INCLUDE})

add_subdirectory(wasm)
