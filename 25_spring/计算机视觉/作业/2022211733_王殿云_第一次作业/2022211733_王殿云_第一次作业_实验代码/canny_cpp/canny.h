#ifndef CANNY_H
#define CANNY_H

#include <opencv2/opencv.hpp>

void myCanny(const cv::Mat& src, cv::Mat& dst, double lowThreshold, double highThreshold,
                    int apertureSize = 3, bool L2gradient = false);

#endif