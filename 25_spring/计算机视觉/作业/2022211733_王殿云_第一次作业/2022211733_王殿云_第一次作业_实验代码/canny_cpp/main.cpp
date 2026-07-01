#include <iostream>
#include <opencv2/opencv.hpp>
#include <opencv2/imgproc.hpp>
#include <opencv2/highgui.hpp>
#include <vector>
#include <queue>
#include <cmath>
#include <chrono>
#include <limits>
#include <string>
#include <algorithm>
#include <omp.h>
#include "canny.h"

// 比较优化Canny与OpenCV Canny的性能函数
void comparePerformance(const cv::Mat& src, int iterations = 10) {
    // 创建输出矩阵
    cv::Mat optimizedEdges, opencvEdges;
    
    // Canny参数
    double lowThreshold = 50.0;
    double highThreshold = 150.0;
    int apertureSize = 3;
    bool L2gradient = false;
    
    // 准备图像进行处理
    cv::Mat gray;
    cv::cvtColor(src, gray, cv::COLOR_BGR2GRAY);
    cv::Mat blurred;
    cv::GaussianBlur(gray, blurred, cv::Size(5, 5), 0);
    
    // 存储计时结果的变量
    double optimizedTotal = 0, opencvTotal = 0;
    double optimizedMin = DBL_MAX, optimizedMax = 0;
    double opencvMin = DBL_MAX, opencvMax = 0;
    
    std::cout << "正在进行 " << iterations << " 次迭代的性能比较..." << std::endl;
    
    // 多次运行测试
    for (int i = 0; i < iterations; i++) {
        // 测量优化的Canny
        auto optimizedStart = std::chrono::high_resolution_clock::now();
        myCanny(blurred, optimizedEdges, lowThreshold, highThreshold, apertureSize, L2gradient);
        auto optimizedEnd = std::chrono::high_resolution_clock::now();
        
        // 测量OpenCV Canny
        auto opencvStart = std::chrono::high_resolution_clock::now();
        cv::Canny(blurred, opencvEdges, lowThreshold, highThreshold, apertureSize, L2gradient);
        auto opencvEnd = std::chrono::high_resolution_clock::now();
        
        // 计算持续时间
        double optimizedDuration = std::chrono::duration<double, std::milli>(optimizedEnd - optimizedStart).count();
        double opencvDuration = std::chrono::duration<double, std::milli>(opencvEnd - opencvStart).count();
        
        // 更新统计数据
        optimizedTotal += optimizedDuration;
        opencvTotal += opencvDuration;
        
        optimizedMin = std::min(optimizedMin, optimizedDuration);
        optimizedMax = std::max(optimizedMax, optimizedDuration);
        
        opencvMin = std::min(opencvMin, opencvDuration);
        opencvMax = std::max(opencvMax, opencvDuration);
        
        // 进度报告
        if ((i+1) % 10 == 0 || i == iterations - 1) {
            std::cout << "已完成 " << (i+1) << " 次迭代..." << std::endl;
        }
    }
    
    // 计算平均值
    double optimizedAvg = optimizedTotal / iterations;
    double opencvAvg = opencvTotal / iterations;
    
    // 显示结果
    std::cout << "\n性能比较结果:" << std::endl;
    std::cout << "-----------------------------" << std::endl;
    std::cout << "优化Canny:" << std::endl;
    std::cout << "  平均时间: " << optimizedAvg << " 毫秒" << std::endl;
    std::cout << "  最小时间: " << optimizedMin << " 毫秒" << std::endl;
    std::cout << "  最大时间: " << optimizedMax << " 毫秒" << std::endl;
    
    std::cout << "\nOpenCV Canny:" << std::endl;
    std::cout << "  平均时间: " << opencvAvg << " 毫秒" << std::endl;
    std::cout << "  最小时间: " << opencvMin << " 毫秒" << std::endl;
    std::cout << "  最大时间: " << opencvMax << " 毫秒" << std::endl;
    
    std::cout << "\n相对性能:" << std::endl;
    double ratioToOpencv = optimizedAvg / opencvAvg;
    
    if (ratioToOpencv > 1.0) {
        std::cout << "  优化实现比OpenCV慢 " << ratioToOpencv << " 倍" << std::endl;
    } else {
        std::cout << "  优化实现比OpenCV快 " << (1.0 / ratioToOpencv) << " 倍" << std::endl;
        std::cout << "  优化实现比OpenCV快 " << (1.0 - ratioToOpencv) * 100 << "%" << std::endl;
    }
    
    // 检查结果是否一致
    cv::Mat diff;
    cv::absdiff(optimizedEdges, opencvEdges, diff);
    
    double errorToOpencv = cv::sum(diff)[0] / (src.rows * src.cols);
    
    std::cout << "\n结果差异:" << std::endl;
    std::cout << "  与OpenCV的平均像素差异: " << errorToOpencv << std::endl;
}

int main(int argc, char** argv) {
    // 检查命令行参数
    if (argc < 2) {
        std::cout << "用法: " << argv[0] << " <图像路径> [benchmark] [迭代次数]" << std::endl;
        std::cout << "添加'benchmark'作为第二个参数来运行性能比较" << std::endl;
        std::cout << "可选择指定迭代次数（默认：100）" << std::endl;
        return -1;
    }
    
    // 读取输入图像
    cv::Mat src = cv::imread(argv[1], cv::IMREAD_COLOR);
    
    // 检查图像是否成功加载
    if (src.empty()) {
        std::cout << "无法读取图像: " << argv[1] << std::endl;
        return -1;
    }
    
    // 检查是否请求了基准测试模式
    bool benchmarkMode = (argc > 2 && std::string(argv[2]) == "benchmark");
    
    if (benchmarkMode) {
        // 确定迭代次数
        int iterations = 100;  // 默认值
        if (argc > 3) {
            try {
                iterations = std::stoi(argv[3]);
            } catch (const std::exception& e) {
                std::cout << "无效的迭代次数值，使用默认值：100" << std::endl;
            }
        }
        
        // 运行性能比较
        comparePerformance(src, iterations);
    } else {
        // 普通可视化模式
        // 创建输出图像
        cv::Mat optimizedEdges, opencvEdges;
        
        // 转换为灰度图像(预处理步骤，不是Canny的一部分)
        cv::Mat gray;
        cv::cvtColor(src, gray, cv::COLOR_BGR2GRAY);

        // 使用高斯滤波器降噪
        cv::Mat blurred;
        cv::GaussianBlur(gray, blurred, cv::Size(5, 5), 0);
        
        // 应用优化的Canny
        double lowThreshold = 50.0;
        double highThreshold = 150.0;
        int apertureSize = 3;
        bool L2gradient = false;
        
        myCanny(blurred, optimizedEdges, lowThreshold, highThreshold, apertureSize, L2gradient);
        
        // 应用OpenCV的Canny以进行比较
        cv::Canny(blurred, opencvEdges, lowThreshold, highThreshold, apertureSize, L2gradient);
        
        // 显示结果
        cv::namedWindow("原始图像", cv::WINDOW_AUTOSIZE);
        cv::namedWindow("优化Canny", cv::WINDOW_AUTOSIZE);
        cv::namedWindow("OpenCV Canny", cv::WINDOW_AUTOSIZE);
        
        cv::imshow("原始图像", src);
        cv::imshow("优化Canny", optimizedEdges);
        cv::imshow("OpenCV Canny", opencvEdges);
        
        // 等待按键并关闭窗口
        cv::waitKey(0);
        cv::destroyAllWindows();
    }
    
    return 0;
}