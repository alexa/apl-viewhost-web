# WASM or ASM.js
if(WASM_ASMJS)
    message("Compiling for asm.js")
    if(NOT CMAKE_BUILD_TYPE OR CMAKE_BUILD_TYPE MATCHES DEBUG)
        # For Release or Minsizerel it should take care of memory init file itself (default on O2+).
        set(WASM_FLAGS "--memory-init-file 1")
    endif()
    set(WASM_FLAGS "${WASM_FLAGS} -s WASM=0")
else(WASM_ASMJS)
    message("Compiling for WebAssembly")
    # don't use this with asm.js, because it turns off optimizations
    set(WASM_FLAGS "-s WASM=1")
endif(WASM_ASMJS)

# this prevents exporting node specific code
set(WASM_FLAGS "${WASM_FLAGS} -s ENVIRONMENT='web' -s SINGLE_FILE=1")

set(WASM_FLAGS "${WASM_FLAGS} -s NO_FILESYSTEM=1")

# Bigger values do more inlining and produce bigger code for little performance increase
set(WASM_FLAGS "${WASM_FLAGS} --llvm-lto 1")

set(WASM_FLAGS "${WASM_FLAGS} -s ALLOW_MEMORY_GROWTH=1")

# Align behavior with C++
if("${EMSCRIPTEN_VERSION}" VERSION_LESS 1.39.0)
    set(WASM_FLAGS "${WASM_FLAGS} -s BINARYEN_TRAP_MODE='clamp'")
endif()

if(NOT CMAKE_BUILD_TYPE OR CMAKE_BUILD_TYPE MATCHES DEBUG)
    set(WASM_FLAGS "${WASM_FLAGS} -s DISABLE_EXCEPTION_CATCHING=0")
    set(WASM_FLAGS "${WASM_FLAGS} -s DEMANGLE_SUPPORT=1")
else()
    set(WASM_FLAGS "${WASM_FLAGS} -s ASSERTIONS=0")
    set(WASM_FLAGS "${WASM_FLAGS} -s USE_CLOSURE_COMPILER=1")
    set(WASM_FLAGS "${WASM_FLAGS} -s DEMANGLE_SUPPORT=0")
    # turn off run-time type identification to reduce size
    # set(WASM_FLAGS "${WASM_FLAGS} -fno-rtti")
    # set(WASM_FLAGS "${WASM_FLAGS} -fno-exceptions")
endif()

if(WASM_PROFILING)
    set(WASM_FLAGS "${WASM_FLAGS} --profiling")
endif()

#set compiler flags
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${WASM_FLAGS} --bind")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${WASM_FLAGS} --bind")

# Set optimization level from build type
if(CMAKE_BUILD_TYPE MATCHES DEBUG)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -O1")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O1")
else()
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -O3")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3")
endif()
