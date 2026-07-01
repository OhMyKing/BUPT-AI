import numpy as np
from sklearn.cluster import KMeans
from scipy.spatial import ConvexHull
from sklearn.neighbors import KDTree

class CameraOptimizer:
    """相机位置优化器"""
    
    def detect_sparse_regions(self, points, voxel_size=0.1, min_density=10):
        """
        检测点云中的稀疏区域
        """
        # 体素化点云
        voxel_indices = np.floor(points / voxel_size).astype(int)
        
        # 计算每个体素的点数
        unique_voxels, counts = np.unique(voxel_indices, axis=0, return_counts=True)
        
        # 创建体素网格
        min_voxel = voxel_indices.min(axis=0)
        max_voxel = voxel_indices.max(axis=0)
        grid_size = max_voxel - min_voxel + 1
        
        # 创建密度网格
        density_grid = np.zeros(grid_size)
        for voxel, count in zip(unique_voxels, counts):
            idx = tuple(voxel - min_voxel)
            density_grid[idx] = count
        
        # 找出稀疏体素
        sparse_voxels = []
        for i in range(grid_size[0]):
            for j in range(grid_size[1]):
                for k in range(grid_size[2]):
                    if density_grid[i, j, k] < min_density and density_grid[i, j, k] > 0:
                        voxel_center = (np.array([i, j, k]) + min_voxel + 0.5) * voxel_size
                        sparse_voxels.append({
                            'center': voxel_center,
                            'density': density_grid[i, j, k],
                            'radius': voxel_size * 1.5
                        })
        
        # 合并相邻的稀疏区域
        if len(sparse_voxels) > 0:
            centers = np.array([v['center'] for v in sparse_voxels])
            
            # 使用聚类来合并相近的稀疏区域
            if len(centers) > 5:
                n_clusters = min(5, len(centers))
                kmeans = KMeans(n_clusters=n_clusters, random_state=42)
                labels = kmeans.fit_predict(centers)
                
                merged_regions = []
                for i in range(n_clusters):
                    cluster_mask = labels == i
                    cluster_centers = centers[cluster_mask]
                    
                    # 计算聚类的中心和半径
                    cluster_center = cluster_centers.mean(axis=0)
                    cluster_radius = np.max(np.linalg.norm(
                        cluster_centers - cluster_center, axis=1
                    )) + voxel_size
                    
                    merged_regions.append({
                        'center': cluster_center,
                        'radius': cluster_radius,
                        'density': np.mean([sparse_voxels[j]['density'] 
                                          for j in range(len(sparse_voxels)) if labels[j] == i])
                    })
                
                sparse_voxels = merged_regions
        
        print(f"检测到 {len(sparse_voxels)} 个稀疏区域")
        return sparse_voxels
    
    def suggest_camera_positions(self, points, existing_cameras, sparse_regions, num_suggestions=5):
        """
        基于稀疏区域和现有相机位置，建议新的相机位置
        """
        suggestions = []
        
        # 计算点云的包围盒
        min_bound = points.min(axis=0)
        max_bound = points.max(axis=0)
        center = (min_bound + max_bound) / 2
        diagonal = np.linalg.norm(max_bound - min_bound)
        
        # 为每个稀疏区域生成候选相机位置
        candidate_positions = []
        
        for region in sparse_regions:
            # 在稀疏区域周围生成多个候选位置
            region_center = region['center']
            region_radius = region['radius']
            
            # 确保稀疏区域在合理范围内（避免生成指向上空的相机）
            if region_center[1] > max_bound[1] + diagonal * 0.2:
                print(f"跳过过高的稀疏区域: Y={region_center[1]:.2f}")
                continue
            
            # 生成球面上的候选点 - 使用标准球坐标系
            n_candidates_theta = 8  # 水平方向候选数
            n_candidates_phi = 5    # 垂直方向候选数
            
            for i in range(n_candidates_theta):
                for j in range(n_candidates_phi):
                    # 水平角度（围绕Y轴，0到2π）
                    theta = 2 * np.pi * i / n_candidates_theta
                    
                    # 垂直角度 phi：从正Y轴向下的角度
                    # phi = 0 表示正上方，phi = π/2 表示水平，phi = π 表示正下方
                    # 限制范围从 π/6（30度，较高位置）到 2π/3（120度，稍微低于水平）
                    phi_min = np.pi / 6     # 30度（从正上方算起）
                    phi_max = 2 * np.pi / 3 # 120度（可以从稍微下方观察）
                    phi = phi_min + (phi_max - phi_min) * j / max(1, n_candidates_phi - 1)
                    
                    # 相机距离稀疏区域中心的距离
                    distance = max(region_radius * 4, diagonal * 0.3)
                    
                    # 标准球坐标转换（Y轴向上）
                    x = region_center[0] + distance * np.sin(phi) * np.cos(theta)
                    y = region_center[1] + distance * np.cos(phi)
                    z = region_center[2] + distance * np.sin(phi) * np.sin(theta)
                    
                    cam_pos = np.array([x, y, z])
                    
                    # 确保相机在合理位置（不要太高）
                    if cam_pos[1] > max_bound[1] + diagonal * 0.5:
                        continue
                    
                    # 确保相机在点云包围盒附近
                    if np.all(cam_pos > min_bound - diagonal * 0.5) and \
                       np.all(cam_pos < max_bound + diagonal * 0.5):
                        
                        # 计算相机朝向（指向区域中心）
                        direction = region_center - cam_pos
                        direction = direction / np.linalg.norm(direction)
                        
                        # 使用矩阵方法计算旋转（更可靠）
                        rotation_matrix = self._look_at_matrix(cam_pos, region_center)
                        rotation = self._matrix_to_euler_xyz(rotation_matrix)
                        
                        # 计算该位置的得分
                        score = self._evaluate_camera_position(
                            cam_pos, rotation, points, existing_cameras, sparse_regions
                        )
                        
                        candidate_positions.append({
                            'position': cam_pos,
                            'rotation': rotation,
                            'score': score,
                            'target_region': region_center
                        })
        
        # 如果稀疏区域不足，添加一些全局候选位置
        if len(candidate_positions) < num_suggestions * 2:
            n_extra = max(num_suggestions * 2 - len(candidate_positions), num_suggestions)
            for i in range(n_extra):
                # 水平角度
                theta = 2 * np.pi * i / n_extra
                # 垂直角度：在合理范围内变化
                phi = np.pi / 4 + (np.pi / 3) * ((i % 3) / 3)  # 45-105度范围
                
                distance = diagonal * 0.6
                
                # 标准球坐标转换
                x = center[0] + distance * np.sin(phi) * np.cos(theta)
                y = center[1] + distance * np.cos(phi)
                z = center[2] + distance * np.sin(phi) * np.sin(theta)
                
                cam_pos = np.array([x, y, z])
                
                # 确保全局候选位置不会太高
                if cam_pos[1] > max_bound[1] + diagonal * 0.3:
                    # 调整Y坐标到合理范围
                    cam_pos[1] = max_bound[1] + diagonal * 0.3
                
                # 重新计算朝向点云中心的方向
                rotation_matrix = self._look_at_matrix(cam_pos, center)
                rotation = self._matrix_to_euler_xyz(rotation_matrix)
                
                score = self._evaluate_camera_position(
                    cam_pos, rotation, points, existing_cameras, sparse_regions
                )
                
                candidate_positions.append({
                    'position': cam_pos,
                    'rotation': rotation,
                    'score': score,
                    'target_region': center
                })
        
        # 按得分排序并选择最佳位置
        candidate_positions.sort(key=lambda x: x['score'], reverse=True)
        
        # 选择相互之间有一定距离的候选位置
        selected = []
        min_distance = diagonal * 0.25  # 最小间距
        
        for candidate in candidate_positions:
            # 检查与已选择位置的距离
            too_close = False
            for selected_cam in selected:
                dist = np.linalg.norm(
                    candidate['position'] - selected_cam['position']
                )
                if dist < min_distance:
                    too_close = True
                    break
            
            # 检查与现有相机的距离
            for existing_cam in existing_cameras:
                existing_pos = np.array(existing_cam['position'])
                dist = np.linalg.norm(candidate['position'] - existing_pos)
                if dist < min_distance:
                    too_close = True
                    break
            
            if not too_close:
                selected.append(candidate)
                if len(selected) >= num_suggestions:
                    break
        
        print(f"生成了 {len(selected)} 个建议的相机位置")
        
        # 输出调试信息
        for i, cam in enumerate(selected):
            pos = cam['position']
            target = cam['target_region']
            # 计算实际的俯仰角（相对于水平面）
            direction = target - pos
            horizontal_dist = np.sqrt(direction[0]**2 + direction[2]**2)
            pitch_angle = np.degrees(np.arctan2(-direction[1], horizontal_dist))
            print(f"建议相机{i+1}: 位置({pos[0]:.2f}, {pos[1]:.2f}, {pos[2]:.2f}) -> 目标({target[0]:.2f}, {target[1]:.2f}, {target[2]:.2f}) 俯仰角: {pitch_angle:.1f}°")
        
        return selected
    
    def _look_at_matrix(self, eye, target, up=None):
        """
        生成Look-At矩阵
        eye: 相机位置
        target: 目标位置
        up: 上方向向量，默认为(0,1,0)
        """
        if up is None:
            up = np.array([0, 1, 0])
        
        eye = np.array(eye)
        target = np.array(target)
        up = np.array(up)
        
        # 计算相机朝向
        forward = eye - target
        forward = forward / np.linalg.norm(forward)
        
        # 计算右向量
        right = np.cross(up, forward)
        if np.linalg.norm(right) < 1e-6:
            # up和forward平行，选择不同的up向量
            up = np.array([1, 0, 0]) if abs(forward[1]) > 0.9 else np.array([0, 1, 0])
            right = np.cross(up, forward)
        right = right / np.linalg.norm(right)
        
        # 重新计算up向量
        up = np.cross(forward, right)
        up = up / np.linalg.norm(up)
        
        # 构建旋转矩阵（Three.js坐标系）
        rotation_matrix = np.array([
            [right[0], up[0], forward[0]],
            [right[1], up[1], forward[1]],
            [right[2], up[2], forward[2]]
        ])
        
        return rotation_matrix
    
    def _matrix_to_euler_xyz(self, matrix):
        """
        将旋转矩阵转换为XYZ顺序的欧拉角（Three.js使用的顺序）
        """
        # 提取欧拉角 (XYZ顺序)
        sy = np.sqrt(matrix[0, 0] * matrix[0, 0] + matrix[1, 0] * matrix[1, 0])
        
        singular = sy < 1e-6
        
        if not singular:
            x = np.arctan2(matrix[2, 1], matrix[2, 2])
            y = np.arctan2(-matrix[2, 0], sy)
            z = np.arctan2(matrix[1, 0], matrix[0, 0])
        else:
            x = np.arctan2(-matrix[1, 2], matrix[1, 1])
            y = np.arctan2(-matrix[2, 0], sy)
            z = 0
        
        return np.array([x, y, z])
    
    def _direction_to_rotation_threejs(self, direction):
        """保留此方法以兼容性，但使用新的矩阵方法"""
        # 这个方法现在不推荐使用，但保留以防其他地方调用
        direction = direction / np.linalg.norm(direction)
        
        # 计算水平旋转角（绕Y轴）
        yaw = np.arctan2(direction[0], -direction[2])
        
        # 计算俯仰角（绕X轴）
        horizontal_length = np.sqrt(direction[0]**2 + direction[2]**2)
        
        # 处理边界情况：当horizontal_length为0时
        if horizontal_length < 1e-6:
            # 相机指向正上方或正下方
            pitch = np.pi / 2 if direction[1] > 0 else -np.pi / 2
        else:
            pitch = np.arctan2(direction[1], horizontal_length)
        
        roll = 0
        return np.array([pitch, yaw, roll])
    
    def _evaluate_camera_position(self, position, rotation, points, 
                                existing_cameras, sparse_regions):
        """
        评估相机位置的质量
        """
        score = 0.0
        
        # 从旋转矩阵计算相机朝向
        cam_forward = self._rotation_to_forward_vector(rotation)
        
        # 1. 稀疏区域覆盖度
        for region in sparse_regions:
            # 计算相机到稀疏区域的距离
            dist = np.linalg.norm(position - region['center'])
            
            # 计算视角（相机是否朝向该区域）
            to_region = region['center'] - position
            to_region_norm = to_region / np.linalg.norm(to_region)
            
            # 计算角度
            dot_product = np.clip(np.dot(cam_forward, to_region_norm), -1, 1)
            angle = np.arccos(dot_product)
            
            # 如果相机能看到稀疏区域，增加得分
            if angle < np.pi / 3:  # 60度视角
                coverage_score = 1.0 / (1.0 + dist / (region['radius'] * 5))
                density_factor = 1.0 - min(region['density'] / 10.0, 0.8)
                angle_factor = np.cos(angle)  # 角度越小权重越高
                score += coverage_score * density_factor * angle_factor * 25.0
        
        # 2. 与现有相机的互补性
        if len(existing_cameras) > 0:
            existing_positions = np.array([cam['position'] for cam in existing_cameras])
            distances = np.linalg.norm(existing_positions - position, axis=1)
            min_dist = distances.min()
            
            optimal_dist = np.linalg.norm(points.max(axis=0) - points.min(axis=0)) * 0.4
            dist_score = np.exp(-((min_dist - optimal_dist) ** 2) / (optimal_dist ** 2))
            score += dist_score * 3.0
        
        # 3. 点云可见性
        visible_points = 0
        sample_size = min(1000, len(points))
        sample_indices = np.random.choice(len(points), sample_size, replace=False)
        
        for idx in sample_indices:
            point = points[idx]
            to_point = point - position
            dist_to_point = np.linalg.norm(to_point)
            
            if dist_to_point > 0.1 and dist_to_point < 50.0:
                to_point_norm = to_point / dist_to_point
                dot_product = np.clip(np.dot(cam_forward, to_point_norm), -1, 1)
                angle = np.arccos(dot_product)
                
                if angle < np.pi / 4:  # 45度视角
                    visible_points += 1
        
        visibility_score = visible_points / sample_size
        score += visibility_score * 5.0
        
        return score
    
    def _rotation_to_forward_vector(self, rotation):
        """
        从欧拉角计算相机朝向向量
        """
        cos_x, sin_x = np.cos(rotation[0]), np.sin(rotation[0])  # pitch
        cos_y, sin_y = np.cos(rotation[1]), np.sin(rotation[1])  # yaw
        cos_z, sin_z = np.cos(rotation[2]), np.sin(rotation[2])  # roll
        
        # XYZ欧拉角旋转矩阵
        R_x = np.array([[1, 0, 0],
                        [0, cos_x, -sin_x],
                        [0, sin_x, cos_x]])
        
        R_y = np.array([[cos_y, 0, sin_y],
                        [0, 1, 0],
                        [-sin_y, 0, cos_y]])
        
        R_z = np.array([[cos_z, -sin_z, 0],
                        [sin_z, cos_z, 0],
                        [0, 0, 1]])
        
        R = R_z @ R_y @ R_x
        forward = np.array([0, 0, -1])  # Three.js相机默认朝向
        cam_forward = R @ forward
        
        return cam_forward
    
    def compute_coverage_map(self, points, cameras, resolution=0.1):
        """
        计算当前相机配置的覆盖图
        """
        coverage = np.zeros(len(points))
        
        for cam in cameras:
            cam_pos = np.array(cam['position'])
            cam_rot = np.array(cam['rotation'])
            
            cam_forward = self._rotation_to_forward_vector(cam_rot)
            
            for i, point in enumerate(points):
                to_point = point - cam_pos
                dist = np.linalg.norm(to_point)
                
                if dist < 0.1 or dist > 50.0:
                    continue
                
                to_point_norm = to_point / dist
                dot_product = np.clip(np.dot(cam_forward, to_point_norm), -1, 1)
                angle = np.arccos(dot_product)
                
                if angle < np.pi / 3:  # 60度视角
                    coverage[i] += 1
        
        return coverage