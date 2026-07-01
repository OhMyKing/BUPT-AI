#include "canny.h"
#include <opencv2/imgproc.hpp>
#include <vector>
#include <queue>
#include <cmath>
#include <algorithm>
#include <omp.h>

// Canny边缘检测
void myCanny(const cv::Mat& src, cv::Mat& dst, double lowThreshold, double highThreshold, 
                    int apertureSize, bool L2gradient) {
    CV_Assert(src.depth() == CV_8U || src.depth() == CV_16S);
    
    // 1. 计算梯度 (使用Sobel算子)
    cv::Mat dx, dy;
    double scale = 1.0;
    if (apertureSize == 7) {
        scale = 1/16.0;
    }
    
    cv::Sobel(src, dx, CV_16S, 1, 0, apertureSize, scale, 0, cv::BORDER_REPLICATE);
    cv::Sobel(src, dy, CV_16S, 0, 1, apertureSize, scale, 0, cv::BORDER_REPLICATE);
    
    // 临时矩阵用于存储中间结果
    const int cn = src.channels();
    const int cols = src.cols * cn;
    const int rows = src.rows;

    // 创建并填充border以简化后续处理
    cv::Mat mag(rows + 2, cols + 2, CV_32F);
    mag.setTo(0);
    
    // 2. 计算梯度幅值（使用SIMD优化，如果可用）
    #pragma omp parallel for
    for (int i = 0; i < rows; i++) {
        const short* _dx = dx.ptr<short>(i);
        const short* _dy = dy.ptr<short>(i);
        float* _mag = mag.ptr<float>(i + 1) + 1;  // 考虑边界
        
        if (L2gradient) {
            // 使用L2范数 (欧几里得距离)
            #if CV_SIMD || CV_SIMD_SCALABLE
            int j = 0;
            const int simdSize = cv::v_float32::nlanes;
            for (; j <= cols - simdSize; j += simdSize) {
                cv::v_int16 vx = cv::v_load((const short*)(_dx + j));
                cv::v_int16 vy = cv::v_load((const short*)(_dy + j));
                
                cv::v_int32 vx_0, vx_1;
                cv::v_int32 vy_0, vy_1;
                
                cv::v_expand(vx, vx_0, vx_1);
                cv::v_expand(vy, vy_0, vy_1);
                
                cv::v_float32 vfx_0 = cv::v_cvt_f32(vx_0);
                cv::v_float32 vfx_1 = cv::v_cvt_f32(vx_1);
                cv::v_float32 vfy_0 = cv::v_cvt_f32(vy_0);
                cv::v_float32 vfy_1 = cv::v_cvt_f32(vy_1);
                
                cv::v_float32 vmagSq_0 = vfx_0 * vfx_0 + vfy_0 * vfy_0;
                cv::v_float32 vmagSq_1 = vfx_1 * vfx_1 + vfy_1 * vfy_1;
                
                cv::v_float32 vmag_0 = cv::v_sqrt(vmagSq_0);
                cv::v_float32 vmag_1 = cv::v_sqrt(vmagSq_1);
                
                cv::v_store(_mag + j, vmag_0);
                cv::v_store(_mag + j + simdSize/2, vmag_1);
            }
            
            // 处理剩余元素
            for (; j < cols; j++) {
                int gx = _dx[j];
                int gy = _dy[j];
                _mag[j] = std::sqrt((float)(gx * gx + gy * gy));
            }
            #else
            for (int j = 0; j < cols; j++) {
                int gx = _dx[j];
                int gy = _dy[j];
                _mag[j] = std::sqrt((float)(gx * gx + gy * gy));
            }
            #endif
        } else {
            // 使用L1范数 (曼哈顿距离)
            #if CV_SIMD || CV_SIMD_SCALABLE
            int j = 0;
            const int simdSize = cv::v_int16::nlanes;
            for (; j <= cols - simdSize; j += simdSize) {
                cv::v_int16 vx = cv::v_load((const short*)(_dx + j));
                cv::v_int16 vy = cv::v_load((const short*)(_dy + j));
                
                // 计算绝对值
                vx = cv::v_abs(vx);
                vy = cv::v_abs(vy);
                
                cv::v_int32 vx_0, vx_1;
                cv::v_int32 vy_0, vy_1;
                
                cv::v_expand(vx, vx_0, vx_1);
                cv::v_expand(vy, vy_0, vy_1);
                
                cv::v_float32 vfx_0 = cv::v_cvt_f32(vx_0);
                cv::v_float32 vfx_1 = cv::v_cvt_f32(vx_1);
                cv::v_float32 vfy_0 = cv::v_cvt_f32(vy_0);
                cv::v_float32 vfy_1 = cv::v_cvt_f32(vy_1);
                
                cv::v_float32 vmag_0 = vfx_0 + vfy_0;
                cv::v_float32 vmag_1 = vfx_1 + vfy_1;
                
                cv::v_store(_mag + j, vmag_0);
                cv::v_store(_mag + j + simdSize/2, vmag_1);
            }
            
            // 处理剩余元素
            for (; j < cols; j++) {
                _mag[j] = std::abs((float)_dx[j]) + std::abs((float)_dy[j]);
            }
            #else
            for (int j = 0; j < cols; j++) {
                _mag[j] = std::abs((float)_dx[j]) + std::abs((float)_dy[j]);
            }
            #endif
        }
    }
    
    // 如果是多通道，取各通道的最大梯度
    if (cn > 1) {
        cv::Mat magMaxChannels(rows, src.cols, CV_32F);
        
        #pragma omp parallel for
        for (int i = 0; i < rows; i++) {
            const float* magRow = mag.ptr<float>(i + 1) + 1;
            float* maxRow = magMaxChannels.ptr<float>(i);
            
            for (int j = 0, jn = 0; j < src.cols; j++, jn += cn) {
                float maxVal = magRow[jn];
                for (int k = 1; k < cn; k++) {
                    maxVal = std::max(maxVal, magRow[jn + k]);
                }
                maxRow[j] = maxVal;
            }
        }
        
        // 用单通道梯度替换多通道梯度以简化后续处理
        mag = cv::Mat(rows + 2, src.cols + 2, CV_32F, 0.0f);
        
        for (int i = 0; i < rows; i++) {
            const float* maxRow = magMaxChannels.ptr<float>(i);
            float* magRow = mag.ptr<float>(i + 1) + 1;
            
            for (int j = 0; j < src.cols; j++) {
                magRow[j] = maxRow[j];
            }
        }
    }
    
    // 创建非极大值抑制掩码
    cv::Mat nmsMask(rows, src.cols, CV_8UC1, cv::Scalar(0));
    
    // 3. 非极大值抑制
    const int TG22 = 13573; // tan(22.5度) * 2^16
    
    #pragma omp parallel for
    for (int i = 0; i < rows; i++) {
        const short* _dx = dx.ptr<short>(i);
        const short* _dy = dy.ptr<short>(i);
        const float* _mag_p = mag.ptr<float>(i);      // previous row
        const float* _mag_c = mag.ptr<float>(i + 1);  // current row
        const float* _mag_n = mag.ptr<float>(i + 2);  // next row
        uchar* _mask = nmsMask.ptr<uchar>(i);
        
        for (int j = 0; j < src.cols; j++) {
            int jj = j;
            if (cn > 1) {
                // 对于多通道，我们已经计算了单通道的最大值
                jj = j * cn;
            }
            
            float m = _mag_c[j + 1];  // current pixel's magnitude with border offset
            
            if (m > lowThreshold) {  // 仅检查高于低阈值的点
                int xs = _dx[jj];
                int ys = _dy[jj];
                int x = std::abs(xs);
                int y = std::abs(ys) << 15;
                
                // 方向量化为水平、垂直和对角线
                int tg22x = x * TG22;
                
                // 水平梯度占主导
                if (y < tg22x) {
                    if (m > _mag_c[j] && m >= _mag_c[j + 2]) {
                        if (m > highThreshold)
                            _mask[j] = 2;  // 强边缘
                        else
                            _mask[j] = 1;  // 弱边缘
                    }
                }
                // 垂直梯度占主导
                else {
                    int tg67x = tg22x + (x << 16);
                    if (y > tg67x) {
                        if (m > _mag_p[j + 1] && m >= _mag_n[j + 1]) {
                            if (m > highThreshold)
                                _mask[j] = 2;  // 强边缘
                            else
                                _mask[j] = 1;  // 弱边缘
                        }
                    }
                    // 对角线方向
                    else {
                        int s = (xs ^ ys) < 0 ? -1 : 1;
                        if (m > _mag_p[j + 1 - s] && m > _mag_n[j + 1 + s]) {
                            if (m > highThreshold)
                                _mask[j] = 2;  // 强边缘
                            else
                                _mask[j] = 1;  // 弱边缘
                        }
                    }
                }
            }
        }
    }
    
    // 4. 滞后阈值连接（使用更高效的队列和并行处理）
    cv::Mat edgeMap = cv::Mat::zeros(rows, src.cols, CV_8UC1);
    
    // 使用并行区域查找强边缘点
    std::vector<std::vector<cv::Point>> strongEdgesByThreads;
    
    #pragma omp parallel
    {
        std::vector<cv::Point> localStrongEdges;
        
        #pragma omp for nowait
        for (int i = 0; i < rows; i++) {
            const uchar* nmsMaskRow = nmsMask.ptr<uchar>(i);
            uchar* edgeMapRow = edgeMap.ptr<uchar>(i);
            
            for (int j = 0; j < src.cols; j++) {
                if (nmsMaskRow[j] == 2) {  // 强边缘
                    edgeMapRow[j] = 255;
                    localStrongEdges.push_back(cv::Point(j, i));
                }
            }
        }
        
        #pragma omp critical
        strongEdgesByThreads.push_back(std::move(localStrongEdges));
    }
    
    // 合并所有线程找到的强边缘点
    std::vector<cv::Point> allStrongEdges;
    for (const auto& threadEdges : strongEdgesByThreads) {
        allStrongEdges.insert(allStrongEdges.end(), threadEdges.begin(), threadEdges.end());
    }
    
    // 连接弱边缘点
    const int dx8[8] = {-1, -1, 0, 1, 1, 1, 0, -1};
    const int dy8[8] = {0, -1, -1, -1, 0, 1, 1, 1};
    
    std::queue<cv::Point> borderPoints;
    for (const auto& point : allStrongEdges) {
        borderPoints.push(point);
    }
    
    while (!borderPoints.empty()) {
        cv::Point p = borderPoints.front();
        borderPoints.pop();
        
        // 检查8邻域
        for (int k = 0; k < 8; k++) {
            cv::Point np(p.x + dx8[k], p.y + dy8[k]);
            
            if (np.x >= 0 && np.x < src.cols && 
                np.y >= 0 && np.y < rows && 
                nmsMask.at<uchar>(np) == 1 &&  // 弱边缘
                edgeMap.at<uchar>(np) == 0) {  // 尚未处理
                
                edgeMap.at<uchar>(np) = 255;  // 标记为边缘
                borderPoints.push(np);
            }
        }
    }
    
    // 将结果复制到输出图像
    edgeMap.copyTo(dst);
}