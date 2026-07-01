import numpy as np
import cv2
from sklearn.cluster import KMeans, MiniBatchKMeans

from feature_extraction import extract_sift_features, extract_dense_sift_features, apply_root_sift

def build_codebook(features_list, codebook_size):
    """
    使用KMeans构建词袋模型的码本
    
    Args:
        features_list (list): 所有图像的特征描述符列表
        codebook_size (int): 码本大小（聚类中心数量）
        
    Returns:
        sklearn.cluster.KMeans: 训练好的KMeans模型（即码本）
    """
    # 将所有特征合并成一个大矩阵
    all_features = np.vstack([f for f in features_list if f is not None and len(f) > 0])
    
    print(f"聚类 {all_features.shape[0]} 个特征到 {codebook_size} 个视觉词...")
    
    # 使用MiniBatchKMeans进行大规模聚类，速度更快
    if all_features.shape[0] > 100000:
        kmeans = MiniBatchKMeans(n_clusters=codebook_size, 
                                 batch_size=1000, 
                                 random_state=42)
    else:
        kmeans = KMeans(n_clusters=codebook_size, 
                       random_state=42, 
                       n_init=10)
    
    kmeans.fit(all_features)
    return kmeans

def compute_bovw_features(image_paths, codebook, dense_sift=False, root_sift=False, step_size=8):
    """
    计算图像的词袋模型(BoVW)特征表示
    
    Args:
        image_paths (list): 图像路径列表
        codebook (sklearn.cluster.KMeans): 训练好的码本
        dense_sift (bool): 是否使用密集SIFT
        root_sift (bool): 是否应用RootSIFT归一化
        step_size (int): 密集SIFT的步长
        
    Returns:
        numpy.ndarray: 词袋模型特征，每行代表一张图像的特征表示
    """
    bovw_features = []
    
    for img_path in image_paths:
        # 提取SIFT特征
        if dense_sift:
            descriptors = extract_dense_sift_features(img_path, step_size=step_size)
        else:
            descriptors = extract_sift_features(img_path)
        
        # 应用RootSIFT
        if root_sift and descriptors is not None and len(descriptors) > 0:
            descriptors = apply_root_sift(descriptors)
        
        # 计算词袋模型表示
        if descriptors is not None and len(descriptors) > 0:
            # 预测每个特征向量所属的聚类
            visual_words = codebook.predict(descriptors)
            
            # 计算直方图
            hist, _ = np.histogram(visual_words, bins=codebook.n_clusters, range=(0, codebook.n_clusters-1))
            
            # 归一化直方图
            if np.sum(hist) > 0:
                hist = hist / np.sum(hist)
        else:
            # 如果没有提取到特征，则使用零向量
            hist = np.zeros(codebook.n_clusters)
        
        bovw_features.append(hist)
    
    return np.array(bovw_features)

def compute_spatial_pyramid_features(image_paths, codebook, levels=2, dense_sift=False, root_sift=False, step_size=8):
    """
    计算图像的空间金字塔匹配特征表示
    
    Args:
        image_paths (list): 图像路径列表
        codebook (sklearn.cluster.KMeans): 训练好的码本
        levels (int): 金字塔层数
        dense_sift (bool): 是否使用密集SIFT
        root_sift (bool): 是否应用RootSIFT归一化
        step_size (int): 密集SIFT的步长
        
    Returns:
        numpy.ndarray: 空间金字塔特征，每行代表一张图像的特征表示
    """
    spatial_pyramid_features = []
    
    for img_path in image_paths:
        # 读取图像
        img = cv2.imread(img_path)
        if img is None:
            # 如果图像无法读取，使用零向量
            feature_dim = codebook.n_clusters * (4**levels - 1) // 3  # 计算空间金字塔特征维度
            spatial_pyramid_features.append(np.zeros(feature_dim))
            continue
        
        # 转换为灰度图
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        
        # 提取特征并进行预测
        if dense_sift:
            keypoints = []
            for y in range(0, h, step_size):
                for x in range(0, w, step_size):
                    keypoints.append(cv2.KeyPoint(x, y, step_size))
            
            sift = cv2.SIFT_create()
            _, descriptors = sift.compute(gray, keypoints)
            
            # 记录关键点位置
            kp_locations = np.array([[kp.pt[0], kp.pt[1]] for kp in keypoints])
        else:
            sift = cv2.SIFT_create()
            keypoints, descriptors = sift.detectAndCompute(gray, None)
            
            if keypoints:
                # 记录关键点位置
                kp_locations = np.array([[kp.pt[0], kp.pt[1]] for kp in keypoints])
            else:
                # 如果没有检测到关键点，则使用零向量
                feature_dim = codebook.n_clusters * (4**levels - 1) // 3
                spatial_pyramid_features.append(np.zeros(feature_dim))
                continue
        
        # 应用RootSIFT
        if root_sift and descriptors is not None and len(descriptors) > 0:
            descriptors = apply_root_sift(descriptors)
        
        if descriptors is None or len(descriptors) == 0:
            # 如果没有提取到特征，使用零向量
            feature_dim = codebook.n_clusters * (4**levels - 1) // 3
            spatial_pyramid_features.append(np.zeros(feature_dim))
            continue
        
        # 预测视觉词
        visual_words = codebook.predict(descriptors)
        
        # 计算空间金字塔表示
        pyramid_features = []
        
        # 基于参考论文中的权重方案，对于level l, 权重为 1/2^(L-l)其中L是金字塔的最大层数
        weights = [1.0 / (2 ** (levels - l)) for l in range(levels + 1)]
        
        # 构建金字塔
        for level in range(levels + 1):
            num_bins = 2 ** level
            bin_w = w / num_bins
            bin_h = h / num_bins
            
            # 遍历每个网格
            for i in range(num_bins):
                for j in range(num_bins):
                    # 计算当前网格的边界
                    x_min = i * bin_w
                    x_max = (i + 1) * bin_w
                    y_min = j * bin_h
                    y_max = (j + 1) * bin_h
                    
                    # 找出在当前网格内的特征点索引
                    indices = np.where(
                        (kp_locations[:, 0] >= x_min) & 
                        (kp_locations[:, 0] < x_max) & 
                        (kp_locations[:, 1] >= y_min) & 
                        (kp_locations[:, 1] < y_max)
                    )[0]
                    
                    # 计算该网格内的视觉词直方图
                    if len(indices) > 0:
                        grid_visual_words = visual_words[indices]
                        hist, _ = np.histogram(
                            grid_visual_words, 
                            bins=codebook.n_clusters, 
                            range=(0, codebook.n_clusters - 1)
                        )
                    else:
                        hist = np.zeros(codebook.n_clusters)
                    
                    # 按照论文中的权重方案加权
                    hist = hist * weights[level]
                    
                    # L1归一化
                    if np.sum(hist) > 0:
                        hist = hist / np.sum(hist)
                    
                    pyramid_features.append(hist)
        
        # 将所有网格的特征拼接起来
        final_feature = np.concatenate(pyramid_features)
        
        # 归一化整体特征
        if np.sum(final_feature) > 0:
            final_feature = final_feature / np.sum(final_feature)
        
        spatial_pyramid_features.append(final_feature)
    
    return np.array(spatial_pyramid_features)