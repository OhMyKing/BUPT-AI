#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>
#include <opencv2/opencv.hpp>
#include "canny.h"

namespace py = pybind11;

py::array_t<uint8_t> py_canny(py::array_t<uint8_t> input, double lowThreshold, double highThreshold,
                             int apertureSize = 3, bool L2gradient = false) {
    // Get input array info
    py::buffer_info buf = input.request();
    
    // Check dimensions
    if (buf.ndim < 2 || buf.ndim > 3) {
        throw std::runtime_error("Input array must be 2D (grayscale) or 3D (color) image");
    }
    
    // Create cv::Mat from numpy array
    cv::Mat src;
    
    if (buf.ndim == 2) {
        // Grayscale image
        src = cv::Mat(buf.shape[0], buf.shape[1], CV_8UC1, buf.ptr);
    } else {
        // Color image (assume last dimension is channels)
        if (buf.shape[2] != 1 && buf.shape[2] != 3) {
            throw std::runtime_error("Input array must have 1 or 3 channels");
        }
        int type = (buf.shape[2] == 3) ? CV_8UC3 : CV_8UC1;
        src = cv::Mat(buf.shape[0], buf.shape[1], type, buf.ptr);
    }
    
    // Create output Mat
    cv::Mat dst;
    
    // Call the myCanny function
    myCanny(src, dst, lowThreshold, highThreshold, apertureSize, L2gradient);
    
    // Create output numpy array
    py::array_t<uint8_t> output = py::array_t<uint8_t>({dst.rows, dst.cols});
    py::buffer_info output_buf = output.request();
    
    // Copy data to output array
    std::memcpy(output_buf.ptr, dst.data, dst.rows * dst.cols * sizeof(uint8_t));
    
    return output;
}

PYBIND11_MODULE(my_canny, m) {
    m.doc() = "My Canny edge detection module";
    
    m.def("Canny", &py_canny, 
          "My Canny edge detection",
          py::arg("image"), 
          py::arg("threshold1"), 
          py::arg("threshold2"), 
          py::arg("apertureSize") = 3, 
          py::arg("L2gradient") = false);
}