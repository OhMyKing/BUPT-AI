import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.cluster import DBSCAN
import open3d as o3d
import time
from tqdm import tqdm

class PointCloudProcessor:
    """点云处理器 - 增加进度输出版本"""
    
    def __init__(self, verbose=True):
        self.verbose = verbose
    
    def _log(self, message):
        """打印日志信息"""
        if self.verbose:
            print(f"[{time.strftime('%H:%M:%S')}] {message}")
    
    def statistical_outlier_removal(self, points, colors=None, nb_neighbors=20, std_ratio=2.0):
        """
        统计离群点去除
        基于每个点到其k个最近邻的平均距离的统计分析
        """
        start_time = time.time()
        n_points = len(points)
        self._log(f"开始统计离群点去除，处理 {n_points} 个点...")
        
        # 构建KD树 - 耗时操作
        self._log("构建KD树...")
        nbrs = NearestNeighbors(n_neighbors=nb_neighbors + 1).fit(points)
        
        # 分批处理邻居搜索，避免内存溢出
        batch_size = 10000
        mean_distances = np.zeros(n_points)
        
        self._log("计算邻居距离...")
        for i in tqdm(range(0, n_points, batch_size), desc="计算邻居距离", disable=not self.verbose):
            batch_end = min(i + batch_size, n_points)
            batch_points = points[i:batch_end]
            distances, indices = nbrs.kneighbors(batch_points)
            mean_distances[i:batch_end] = np.mean(distances[:, 1:], axis=1)
        
        # 计算全局统计信息
        self._log("计算统计阈值...")
        global_mean = np.mean(mean_distances)
        global_std = np.std(mean_distances)
        threshold = global_mean + std_ratio * global_std
        
        # 找出内点
        inlier_mask = mean_distances < threshold
        
        # 过滤点云
        filtered_points = points[inlier_mask]
        filtered_colors = colors[inlier_mask] if colors is not None else None
        
        elapsed = time.time() - start_time
        self._log(f"统计离群点去除完成: {len(filtered_points)}/{n_points} 个点保留 ({elapsed:.2f}秒)")
        
        return filtered_points, filtered_colors
    
    def radius_outlier_removal(self, points, colors=None, radius=0.1, min_neighbors=10):
        """
        半径离群点去除
        移除在给定半径内邻居数量少于阈值的点
        """
        start_time = time.time()
        n_points = len(points)
        self._log(f"开始半径离群点去除，处理 {n_points} 个点...")
        
        # 构建KD树
        self._log("构建KD树...")
        nbrs = NearestNeighbors(radius=radius).fit(points)
        
        # 分批处理以显示进度
        batch_size = 5000
        neighbor_counts = np.zeros(n_points)
        
        self._log("计算邻居数量...")
        for i in tqdm(range(0, n_points, batch_size), desc="计算邻居", disable=not self.verbose):
            batch_end = min(i + batch_size, n_points)
            batch_points = points[i:batch_end]
            neighbors = nbrs.radius_neighbors(batch_points, return_distance=False)
            neighbor_counts[i:batch_end] = [len(n) for n in neighbors]
        
        # 找出内点
        inlier_mask = neighbor_counts >= min_neighbors
        
        # 过滤点云
        filtered_points = points[inlier_mask]
        filtered_colors = colors[inlier_mask] if colors is not None else None
        
        elapsed = time.time() - start_time
        self._log(f"半径离群点去除完成: {len(filtered_points)}/{n_points} 个点保留 ({elapsed:.2f}秒)")
        
        return filtered_points, filtered_colors
    
    def dbscan_clustering(self, points, colors=None, eps=0.05, min_samples=10):
        """
        DBSCAN聚类去噪
        使用基于密度的聚类算法识别和去除噪声点
        """
        start_time = time.time()
        n_points = len(points)
        self._log(f"开始DBSCAN聚类，处理 {n_points} 个点...")
        
        # 对大数据集进行下采样
        if n_points > 50000:
            self._log(f"点云过大，先进行下采样...")
            sample_indices = np.random.choice(n_points, 50000, replace=False)
            sample_points = points[sample_indices]
            
            # 在下采样数据上执行DBSCAN
            clustering = DBSCAN(eps=eps, min_samples=min_samples, n_jobs=-1).fit(sample_points)
            
            # 将剩余点分配到最近的聚类
            self._log("将剩余点分配到聚类...")
            from sklearn.neighbors import KNeighborsClassifier
            
            # 训练分类器
            valid_mask = clustering.labels_ != -1
            if not np.any(valid_mask):
                return points, colors
            
            clf = KNeighborsClassifier(n_neighbors=5)
            clf.fit(sample_points[valid_mask], clustering.labels_[valid_mask])
            
            # 预测所有点的标签
            labels = np.full(n_points, -1, dtype=int)
            labels[sample_indices] = clustering.labels_
            
            # 批量预测剩余点
            remaining_mask = np.ones(n_points, dtype=bool)
            remaining_mask[sample_indices] = False
            if np.any(remaining_mask):
                remaining_points = points[remaining_mask]
                labels[remaining_mask] = clf.predict(remaining_points)
        else:
            # 执行DBSCAN聚类
            self._log("执行DBSCAN聚类...")
            clustering = DBSCAN(eps=eps, min_samples=min_samples, n_jobs=-1).fit(points)
            labels = clustering.labels_
        
        # 统计聚类结果
        unique_labels, counts = np.unique(labels[labels != -1], return_counts=True)
        
        if len(unique_labels) == 0:
            self._log("没有找到有效聚类")
            return points, colors
        
        # 保留所有非噪声聚类
        inlier_mask = labels != -1
        
        # 过滤点云
        filtered_points = points[inlier_mask]
        filtered_colors = colors[inlier_mask] if colors is not None else None
        
        elapsed = time.time() - start_time
        self._log(f"DBSCAN聚类完成: {len(filtered_points)}/{n_points} 个点保留")
        self._log(f"发现 {len(unique_labels)} 个聚类 ({elapsed:.2f}秒)")
        
        return filtered_points, filtered_colors
    
    def poisson_reconstruction(self, points, depth=9):
        """
        泊松表面重建
        从点云生成网格表面
        """
        start_time = time.time()
        n_points = len(points)
        self._log(f"开始泊松表面重建，处理 {n_points} 个点...")
        
        try:
            # 创建Open3D点云对象
            pcd = o3d.geometry.PointCloud()
            pcd.points = o3d.utility.Vector3dVector(points)
            
            # 估算法向量 - 耗时操作
            self._log("估算法向量...")
            pcd.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(
                    radius=0.1, max_nn=30
                )
            )
            
            # 统一法向量方向
            self._log("统一法向量方向...")
            pcd.orient_normals_consistent_tangent_plane(30)
            
            # 执行泊松重建 - 最耗时的操作
            self._log(f"执行泊松重建 (深度={depth})...")
            mesh, _ = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                pcd, depth=depth
            )
            
            # 清理网格
            self._log("清理网格...")
            mesh.remove_degenerate_triangles()
            mesh.remove_duplicated_triangles()
            mesh.remove_duplicated_vertices()
            mesh.remove_non_manifold_edges()
            
            # 获取顶点
            vertices = np.asarray(mesh.vertices)
            triangles = np.asarray(mesh.triangles)
            
            elapsed = time.time() - start_time
            self._log(f"泊松重建完成: 生成了 {len(vertices)} 个顶点, {len(triangles)} 个三角形 ({elapsed:.2f}秒)")
            
            return vertices, triangles
            
        except Exception as e:
            self._log(f"泊松重建失败: {e}")
            return points, None
    
    def voxel_downsample(self, points, colors=None, voxel_size=0.05):
        """
        体素下采样
        减少点云密度，保持整体形状
        """
        start_time = time.time()
        n_points = len(points)
        self._log(f"开始体素下采样，处理 {n_points} 个点...")
        
        # 计算每个点所属的体素
        self._log("计算体素索引...")
        voxel_indices = np.floor(points / voxel_size).astype(int)
        
        # 使用字典来存储每个体素的点
        voxel_dict = {}
        
        self._log("分组点到体素...")
        for i in tqdm(range(n_points), desc="分组体素", disable=not self.verbose):
            key = tuple(voxel_indices[i])
            if key not in voxel_dict:
                voxel_dict[key] = []
            voxel_dict[key].append(i)
        
        # 每个体素保留一个代表点（中心点）
        self._log("计算体素中心...")
        downsampled_points = []
        downsampled_colors = []
        
        for voxel_points in tqdm(voxel_dict.values(), desc="计算中心", disable=not self.verbose):
            # 计算体素内所有点的平均位置
            avg_point = np.mean(points[voxel_points], axis=0)
            downsampled_points.append(avg_point)
            
            if colors is not None:
                # 计算平均颜色
                avg_color = np.mean(colors[voxel_points], axis=0)
                downsampled_colors.append(avg_color)
        
        downsampled_points = np.array(downsampled_points)
        downsampled_colors = np.array(downsampled_colors) if colors is not None else None
        
        elapsed = time.time() - start_time
        self._log(f"体素下采样完成: {n_points} -> {len(downsampled_points)} 个点 ({elapsed:.2f}秒)")
        
        return downsampled_points, downsampled_colors
    
    def compute_point_density(self, points, k_neighbors=50):
        """
        计算每个点的局部密度
        """
        start_time = time.time()
        n_points = len(points)
        self._log(f"开始计算点密度，处理 {n_points} 个点...")
        
        self._log("构建KD树...")
        nbrs = NearestNeighbors(n_neighbors=k_neighbors).fit(points)
        
        # 分批处理
        batch_size = 10000
        densities = np.zeros(n_points)
        
        self._log("计算局部密度...")
        for i in tqdm(range(0, n_points, batch_size), desc="计算密度", disable=not self.verbose):
            batch_end = min(i + batch_size, n_points)
            batch_points = points[i:batch_end]
            distances, _ = nbrs.kneighbors(batch_points)
            
            # 使用到第k个邻居的距离作为密度的反向指标
            densities[i:batch_end] = 1.0 / (distances[:, -1] + 1e-6)
        
        elapsed = time.time() - start_time
        self._log(f"点密度计算完成 ({elapsed:.2f}秒)")
        
        return densities