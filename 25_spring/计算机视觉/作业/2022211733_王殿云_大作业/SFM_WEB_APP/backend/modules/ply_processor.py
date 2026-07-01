import numpy as np
import struct

class PLYProcessor:
    """PLY文件处理器"""
    
    def read_ply(self, filepath):
        """读取PLY文件"""
        with open(filepath, 'rb') as f:
            # 读取头部
            header = []
            while True:
                line = f.readline().decode('utf-8').strip()
                header.append(line)
                if line == 'end_header':
                    break
            
            # 解析头部信息
            vertex_count = 0
            has_color = False
            binary = False
            little_endian = True
            
            for line in header:
                if line.startswith('element vertex'):
                    vertex_count = int(line.split()[-1])
                elif line.startswith('property uchar red'):
                    has_color = True
                elif line.startswith('format binary_little_endian'):
                    binary = True
                    little_endian = True
                elif line.startswith('format binary_big_endian'):
                    binary = True
                    little_endian = False
                elif line.startswith('format ascii'):
                    binary = False
            
            # 读取顶点数据
            if binary:
                # 二进制格式
                endian = '<' if little_endian else '>'
                
                if has_color:
                    # xyz + rgb
                    dtype = np.dtype([
                        ('x', f'{endian}f4'),
                        ('y', f'{endian}f4'),
                        ('z', f'{endian}f4'),
                        ('red', 'u1'),
                        ('green', 'u1'),
                        ('blue', 'u1')
                    ])
                else:
                    # 只有xyz
                    dtype = np.dtype([
                        ('x', f'{endian}f4'),
                        ('y', f'{endian}f4'),
                        ('z', f'{endian}f4')
                    ])
                
                data = np.fromfile(f, dtype=dtype, count=vertex_count)
                
                points = np.column_stack((data['x'], data['y'], data['z']))
                
                if has_color:
                    colors = np.column_stack((
                        data['red'] / 255.0,
                        data['green'] / 255.0,
                        data['blue'] / 255.0
                    ))
                else:
                    colors = np.ones((vertex_count, 3))
                    
            else:
                # ASCII格式
                points = []
                colors = []
                
                for i in range(vertex_count):
                    line = f.readline().decode('utf-8').strip()
                    values = line.split()
                    
                    x, y, z = float(values[0]), float(values[1]), float(values[2])
                    points.append([x, y, z])
                    
                    if has_color and len(values) >= 6:
                        r = float(values[3]) / 255.0
                        g = float(values[4]) / 255.0
                        b = float(values[5]) / 255.0
                        colors.append([r, g, b])
                    else:
                        colors.append([1.0, 1.0, 1.0])
                
                points = np.array(points)
                colors = np.array(colors)
        
        return points, colors
    
    def write_ply(self, filepath, points, colors=None):
        """写入PLY文件"""
        vertex_count = len(points)
        has_color = colors is not None
        
        with open(filepath, 'wb') as f:
            # 写入头部
            f.write(b'ply\n')
            f.write(b'format binary_little_endian 1.0\n')
            f.write(f'element vertex {vertex_count}\n'.encode())
            f.write(b'property float x\n')
            f.write(b'property float y\n')
            f.write(b'property float z\n')
            
            if has_color:
                f.write(b'property uchar red\n')
                f.write(b'property uchar green\n')
                f.write(b'property uchar blue\n')
            
            f.write(b'end_header\n')
            
            # 写入顶点数据
            for i in range(vertex_count):
                # 写入位置（恢复Y坐标）
                x, y, z = points[i]
                f.write(struct.pack('<fff', x, -y, z))
                
                # 写入颜色
                if has_color:
                    r = int(colors[i][0] * 255)
                    g = int(colors[i][1] * 255)
                    b = int(colors[i][2] * 255)
                    f.write(struct.pack('<BBB', r, g, b))
    
    def estimate_normals(self, points, k_neighbors=30):
        """估算点云法向量"""
        from sklearn.neighbors import NearestNeighbors
        
        # 构建KD树
        nbrs = NearestNeighbors(n_neighbors=k_neighbors, algorithm='auto').fit(points)
        distances, indices = nbrs.kneighbors(points)
        
        normals = np.zeros_like(points)
        
        for i in range(len(points)):
            # 获取邻域点
            neighbors = points[indices[i]]
            
            # 计算协方差矩阵
            centered = neighbors - np.mean(neighbors, axis=0)
            cov = centered.T @ centered
            
            # 特征值分解
            eigenvalues, eigenvectors = np.linalg.eigh(cov)
            
            # 最小特征值对应的特征向量是法向量
            normal = eigenvectors[:, 0]
            
            # 确保法向量朝向一致（这里简单地让它们朝上）
            if normal[1] < 0:
                normal = -normal
            
            normals[i] = normal
        
        return normals