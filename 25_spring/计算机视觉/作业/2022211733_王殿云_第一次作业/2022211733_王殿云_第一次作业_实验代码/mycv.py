import cv2
from collections import deque
import numpy as np
from canny_cpp.my_canny import Canny

def HoughCircles(image, method, dp, minDist, param1=100, param2=100, minRadius=0, maxRadius=0):
    if len(image.shape) > 2:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()

    # 获取图像尺寸
    height, width = gray.shape
    if maxRadius <= 0:
        maxRadius = min(height, width) // 2
    minRadius = max(0, minRadius)

    # 应用高斯模糊减少噪声
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # 使用Canny检测边缘
    edges = Canny(blurred, param1 // 2, param1)

    # 计算梯度 梯度幅值和方向
    sobelx = cv2.Sobel(blurred, cv2.CV_32F, 1, 0)
    sobely = cv2.Sobel(blurred, cv2.CV_32F, 0, 1)
    magnitude = np.sqrt(sobelx ** 2 + sobely ** 2)
    direction = np.arctan2(sobely, sobelx)

    # 创建累加器数组
    acc_width = int(width / dp)
    acc_height = int(height / dp)
    accumulators = {r: np.zeros((acc_height, acc_width), dtype=np.int32)
                    for r in range(minRadius, maxRadius + 1)}

    # 获取边缘点及其梯度
    y_indices, x_indices = np.nonzero(edges)
    for i in range(len(y_indices)):
        y, x = y_indices[i], x_indices[i]

        # 如果梯度幅值太小则跳过
        if magnitude[y, x] < 1e-5:
            continue
        theta = direction[y, x]

        # 对每个可能的半径 计算潜在的圆心
        for r in range(minRadius, maxRadius + 1):
            center_x = int(x - r * np.cos(theta))
            center_y = int(y - r * np.sin(theta))
            if 0 <= center_x < width and 0 <= center_y < height:
                acc_x = int(center_x / dp)
                acc_y = int(center_y / dp)
                if 0 <= acc_x < acc_width and 0 <= acc_y < acc_height:
                    accumulators[r][acc_y, acc_x] += 1

    # 收集所有候选圆并计算累加器值 累加器值降序排序
    candidates = []
    for r in range(minRadius, maxRadius + 1):
        acc = accumulators[r]
        centers = np.argwhere(acc > param2)
        for center_y, center_x in centers:
            x = int(center_x * dp)
            y = int(center_y * dp)
            accumulator_value = acc[center_y, center_x]
            candidates.append((x, y, r, accumulator_value))
    candidates.sort(key=lambda c: c[3], reverse=True)

    # 非极大值抑制
    circles = []
    for x, y, r, _ in candidates:
        too_close = False
        for cx, cy, cr in circles:
            if np.sqrt((x - cx) ** 2 + (y - cy) ** 2) < minDist:
                too_close = True
                break
        if not too_close:
            circles.append([x, y, r])

    if circles:
        return np.array(circles, dtype=np.float32).reshape(1, -1, 3)
    else:
        return np.array([], dtype=np.float32)

if __name__ == "__main__":
    image_path = 'images/1.jpg'

    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    if image is None:
        print(f"错误: 无法加载图像 '{image_path}'")
        exit(1)

    print(f"成功加载图像，大小: {image.shape}")

    circles = HoughCircles(image, cv2.HOUGH_GRADIENT,
                           dp=1, minDist=10,
                           param1=30, param2=15,
                           minRadius=0, maxRadius=100)

    if circles is None:
        print("没有检测到圆")
        cv2.imshow('Original Image', image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        exit(0)

    img_color = image.copy()

    circles = circles[0]

    for circle in circles:
        center = (int(circle[0]), int(circle[1]))
        radius = int(circle[2])
        cv2.circle(img_color, center, radius, (0, 255, 0), 2)
        cv2.circle(img_color, center, 2, (0, 0, 255), 3)

    cv2.imshow('Detected Circles', img_color)
    cv2.waitKey(0)
    cv2.destroyAllWindows()