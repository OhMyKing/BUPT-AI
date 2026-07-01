cmake_minimum_required(VERSION 3.12)
project(CannyEdgeDetection)

# 设置C++标准
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找OpenCV包
find_package(OpenCV REQUIRED)

# 查找Python和pybind11
find_package(Python COMPONENTS Interpreter Development REQUIRED)
find_package(pybind11 CONFIG REQUIRED)

# MacOS环境下
if(APPLE)
    # 检查是否是M系列芯片（ARM架构）
    execute_process(
        COMMAND sysctl -n machdep.cpu.brand_string
        OUTPUT_VARIABLE CPU_BRAND
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )

    # 检查brew安装的libomp位置
    set(BREW_LIBOMP_PREFIX "/opt/homebrew/opt/libomp")
    if(NOT EXISTS ${BREW_LIBOMP_PREFIX})
        set(BREW_LIBOMP_PREFIX "/usr/local/opt/libomp")
    endif()

    if(EXISTS ${BREW_LIBOMP_PREFIX})
        # 添加OpenMP的编译和链接标志
        set(OpenMP_C_FLAGS "-Xpreprocessor;-fopenmp")
        set(OpenMP_CXX_FLAGS "-Xpreprocessor;-fopenmp")
        set(OpenMP_C_LIB_NAMES "omp")
        set(OpenMP_CXX_LIB_NAMES "omp")
        set(OpenMP_omp_LIBRARY ${BREW_LIBOMP_PREFIX}/lib/libomp.dylib)

        # 将OpenMP包含目录添加到包含路径
        include_directories(${BREW_LIBOMP_PREFIX}/include)
        link_directories(${BREW_LIBOMP_PREFIX}/lib)

        message(STATUS "Using Homebrew libomp from: ${BREW_LIBOMP_PREFIX}")
    else()
        message(WARNING "libomp not found! Please install it with 'brew install libomp'")
    endif()
else()
    # 在非Apple平台上使用标准Find模块
    find_package(OpenMP)
endif()

# 创建Canny的源文件库
add_library(canny_lib STATIC
    canny.cpp
)

# 添加可执行文件
add_executable(canny_edge_detector main.cpp)

# 链接OpenCV库
target_link_libraries(canny_lib ${OpenCV_LIBS})
target_link_libraries(canny_edge_detector canny_lib ${OpenCV_LIBS})

# 链接OpenMP（如果找到）
if(APPLE AND EXISTS ${BREW_LIBOMP_PREFIX})
    target_compile_options(canny_lib PRIVATE -Xpreprocessor -fopenmp)
    target_compile_options(canny_edge_detector PRIVATE -Xpreprocessor -fopenmp)
    target_link_libraries(canny_lib ${OpenMP_omp_LIBRARY})
    target_link_libraries(canny_edge_detector ${OpenMP_omp_LIBRARY})
elseif(OpenMP_CXX_FOUND)
    target_link_libraries(canny_lib OpenMP::OpenMP_CXX)
    target_link_libraries(canny_edge_detector OpenMP::OpenMP_CXX)
endif()

pybind11_add_module(my_canny python_bindings.cpp)
target_link_libraries(my_canny PRIVATE canny_lib ${OpenCV_LIBS})

if(APPLE AND EXISTS ${BREW_LIBOMP_PREFIX})
    target_compile_options(my_canny PRIVATE -Xpreprocessor -fopenmp)
    target_link_libraries(my_canny PRIVATE ${OpenMP_omp_LIBRARY})
elseif(OpenMP_CXX_FOUND)
    target_link_libraries(my_canny PRIVATE OpenMP::OpenMP_CXX)
endif()

message(STATUS "OpenCV version: ${OpenCV_VERSION}")
message(STATUS "OpenCV include dirs: ${OpenCV_INCLUDE_DIRS}")
message(STATUS "OpenCV libraries: ${OpenCV_LIBS}")
message(STATUS "Python libraries: ${Python_LIBRARIES}")
message(STATUS "Python include dirs: ${Python_INCLUDE_DIRS}")

install(TARGETS canny_edge_detector DESTINATION bin)
install(TARGETS my_canny DESTINATION ${Python_SITEARCH})