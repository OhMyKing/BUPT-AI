import cv2
import numpy as np

def extract_sift_features(image_path):
    """
    从图像中提取SIFT特征
    
    Args:
        image_path (str): 图像路径
        
    Returns:
        numpy.ndarray: SIFT特征描述符，每行是一个128维的特征向量
    """
    # 读取图像
    img = cv2.imread(image_path)
    if img is None:
        print(f"无法读取图像: {image_path}")
        return None
    
    # 转换为灰度图
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 创建SIFT检测器
    sift = cv2.SIFT_create()
    
    # 检测关键点并计算描述符
    _, descriptors = sift.detectAndCompute(gray, None)
    
    return descriptors

def extract_dense_sift_features(image_path, step_size=8):
    """
    从图像中提取密集SIFT特征
    
    Args:
        image_path (str): 图像路径
        step_size (int): 密集采样的步长
        
    Returns:
        numpy.ndarray: 密集SIFT特征描述符，每行是一个128维的特征向量
    """
    # 读取图像
    img = cv2.imread(image_path)
    if img is None:
        print(f"无法读取图像: {image_path}")
        return None
    
    # 转换为灰度图
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 创建SIFT检测器
    sift = cv2.SIFT_create()
    
    # 创建密集采样点
    h, w = gray.shape
    keypoints = []
    for y in range(0, h, step_size):
        for x in range(0, w, step_size):
            # 论文中推荐的设置: 16x16 像素的图像块和8像素的步长
            keypoints.append(cv2.KeyPoint(x, y, 16))  # 使用16x16像素的图像块
    
    # 计算描述符
    _, descriptors = sift.compute(gray, keypoints)
    
    return descriptors

def apply_root_sift(descriptors):
    """
    应用RootSIFT归一化
    
    Args:
        descriptors (numpy.ndarray): SIFT特征描述符
        
    Returns:
        numpy.ndarray: RootSIFT归一化后的特征描述符
    """
    if descriptors is None or len(descriptors) == 0:
        return None
        
    # L1归一化
    eps = 1e-7  # 防止除以零
    descriptors = descriptors / (np.sum(descriptors, axis=1, keepdims=True) + eps)
    
    # 平方根变换 (Element-wise sqrt)
    descriptors = np.sqrt(descriptors)
    
    return descriptors