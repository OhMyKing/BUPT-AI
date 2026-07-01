from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import numpy as np
import os
from werkzeug.utils import secure_filename
import tempfile
from datetime import datetime
import logging
import shutil

# 设置日志
logging.basicConfig(level=logging.DEBUG)

# 导入自定义模块
from modules.ply_processor import PLYProcessor
from modules.pointcloud_processor import PointCloudProcessor
from modules.camera_optimizer import CameraOptimizer
from modules.sfm import SFM

app = Flask(__name__)

# 配置CORS - 只在这里配置一次
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # 简化为允许所有来源
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Range", "X-Content-Range"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# 配置
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

# 确保上传文件夹存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 全局存储当前的点云和相机数据
current_data = {
    'pointcloud': None,
    'cameras': [],
    'processed_pointcloud': None,
    'sparse_regions': [],
    'suggested_cameras': []
}

# 初始化处理器
ply_processor = PLYProcessor()
pc_processor = PointCloudProcessor()
camera_optimizer = CameraOptimizer()
sfm = SFM()

# 移除了 handle_preflight 和 after_request 函数，避免重复设置CORS头

@app.route('/api/upload_ply', methods=['POST', 'OPTIONS'])
def upload_ply():
    """上传PLY文件"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        # 保存文件
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 读取PLY文件
        points, colors = ply_processor.read_ply(filepath)
        
        # 存储点云数据
        current_data['pointcloud'] = {
            'points': points,
            'colors': colors,
            'filename': filename
        }
        current_data['processed_pointcloud'] = None
        
        # 返回点云数据
        return jsonify({
            'points': points.flatten().tolist(),
            'colors': colors.flatten().tolist(),
            'num_points': len(points)
        })
        
    except Exception as e:
        logging.error(f"Error in upload_ply: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload_cameras', methods=['POST', 'OPTIONS'])
def upload_cameras():
    """上传相机参数文件"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        if 'files' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        files = request.files.getlist('files')
        cameras = []
        
        for file in files:
            if file.filename == '':
                continue
                
            # 保存文件
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # 解析相机参数
            camera_data = parse_camera_file(filepath, filename)
            if camera_data:
                cameras.append(camera_data)
        
        # 存储相机数据
        current_data['cameras'] = cameras
        
        return jsonify({
            'cameras': cameras,
            'num_cameras': len(cameras)
        })
        
    except Exception as e:
        logging.error(f"Error in upload_cameras: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sfm_reconstruct', methods=['POST', 'OPTIONS'])
def sfm_reconstruct():
    """执行SFM重建"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        # 检查是否有文件
        if 'images' not in request.files:
            return jsonify({'error': '需要上传图片文件'}), 400
        
        # 创建临时目录
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_dir = os.path.join(app.config['UPLOAD_FOLDER'], f'sfm_{timestamp}')
        images_dir = os.path.join(temp_dir, 'images')
        intrinsics_dir = os.path.join(temp_dir, 'intrinsics')
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(intrinsics_dir, exist_ok=True)
        
        # 保存上传的图片
        image_files = request.files.getlist('images')
        saved_images = []
        for file in image_files:
            if file.filename:
                filename = secure_filename(file.filename)
                filepath = os.path.join(images_dir, filename)
                file.save(filepath)
                saved_images.append(filename)
        
        # 保存内参文件（如果有）
        intrinsic_files = []
        if 'intrinsics' in request.files:
            intrinsic_files = request.files.getlist('intrinsics')
            for file in intrinsic_files:
                if file.filename:
                    filename = secure_filename(file.filename)
                    filepath = os.path.join(intrinsics_dir, filename)
                    file.save(filepath)
        
        logging.info(f"开始SFM重建，图片数量: {len(saved_images)}, 内参文件数量: {len(intrinsic_files)}")
        
        # 执行SFM重建（演示版本）
        ply_path, cameras_dir = sfm.reconstruct(images_dir)
        
        # 读取生成的PLY文件
        points, colors = ply_processor.read_ply(ply_path)
        
        # 读取相机参数
        cameras = []
        camera_files = [f for f in os.listdir(cameras_dir) 
                       if f.endswith('.camera') or f.endswith('.txt')]
        
        for filename in sorted(camera_files):
            filepath = os.path.join(cameras_dir, filename)
            camera_data = parse_camera_file(filepath, filename)
            if camera_data:
                cameras.append(camera_data)
        
        # 更新当前数据
        current_data['pointcloud'] = {
            'points': points,
            'colors': colors,
            'filename': 'reconstructed.ply'
        }
        current_data['cameras'] = cameras
        current_data['processed_pointcloud'] = None
        current_data['sparse_regions'] = []
        current_data['suggested_cameras'] = []
        
        # 清理临时文件（可选）
        # shutil.rmtree(temp_dir)
        
        return jsonify({
            'success': True,
            'points': points.flatten().tolist(),
            'colors': colors.flatten().tolist(),
            'num_points': len(points),
            'cameras': cameras,
            'num_cameras': len(cameras),
            'message': f'SFM重建完成，生成了 {len(points)} 个点和 {len(cameras)} 个相机'
        })
        
    except Exception as e:
        logging.error(f"Error in sfm_reconstruct: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/process_pointcloud', methods=['POST', 'OPTIONS'])
def process_pointcloud():
    """处理点云"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        data = request.get_json()
        method = data.get('method')
        
        if not current_data['pointcloud']:
            return jsonify({'error': '没有加载点云'}), 400
        
        # 获取当前点云（使用处理过的，如果有的话）
        if current_data['processed_pointcloud']:
            points = current_data['processed_pointcloud']['points']
            colors = current_data['processed_pointcloud']['colors']
        else:
            points = current_data['pointcloud']['points']
            colors = current_data['pointcloud']['colors']
        
        # 根据方法处理点云
        if method == 'statistical_outlier_removal':
            processed_points, processed_colors = pc_processor.statistical_outlier_removal(
                points, colors, nb_neighbors=20, std_ratio=2.0
            )
        elif method == 'radius_outlier_removal':
            processed_points, processed_colors = pc_processor.radius_outlier_removal(
                points, colors, radius=0.1, min_neighbors=10
            )
        elif method == 'dbscan_clustering':
            processed_points, processed_colors = pc_processor.dbscan_clustering(
                points, colors, eps=0.05, min_samples=10
            )
        elif method == 'poisson_reconstruction':
            # 泊松重建返回的是mesh，这里简化处理
            vertices, faces = pc_processor.poisson_reconstruction(points)
            # 将顶点作为新的点云
            processed_points = vertices
            processed_colors = np.ones_like(vertices) * 0.7  # 灰色
        else:
            return jsonify({'error': '未知的处理方法'}), 400
        
        # 存储处理后的点云
        current_data['processed_pointcloud'] = {
            'points': processed_points,
            'colors': processed_colors
        }
        
        return jsonify({
            'points': processed_points.flatten().tolist(),
            'colors': processed_colors.flatten().tolist(),
            'num_points': len(processed_points)
        })
        
    except Exception as e:
        logging.error(f"Error in process_pointcloud: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze_sparse_regions', methods=['POST', 'OPTIONS'])
def analyze_sparse_regions():
    """分析稀疏区域"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        if not current_data['pointcloud']:
            return jsonify({'error': '没有加载点云'}), 400
        
        # 使用处理过的点云或原始点云
        if current_data['processed_pointcloud']:
            points = current_data['processed_pointcloud']['points']
        else:
            points = current_data['pointcloud']['points']
        
        # 分析稀疏区域
        sparse_regions = camera_optimizer.detect_sparse_regions(
            points, voxel_size=0.1, min_density=10
        )
        
        # 存储结果
        current_data['sparse_regions'] = sparse_regions
        
        # 转换为可JSON序列化的格式
        sparse_regions_json = []
        for region in sparse_regions:
            sparse_regions_json.append({
                'center': region['center'].tolist(),
                'radius': float(region['radius']),
                'density': float(region['density'])
            })
        
        return jsonify({
            'sparse_regions': sparse_regions_json,
            'num_regions': len(sparse_regions)
        })
        
    except Exception as e:
        logging.error(f"Error in analyze_sparse_regions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/optimize_cameras', methods=['POST', 'OPTIONS'])
def optimize_cameras():
    """优化相机位置"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        if not current_data['pointcloud'] or not current_data['cameras']:
            return jsonify({'error': '需要先加载点云和相机'}), 400
        
        # 使用处理过的点云或原始点云
        if current_data['processed_pointcloud']:
            points = current_data['processed_pointcloud']['points']
        else:
            points = current_data['pointcloud']['points']
        
        # 准备现有相机数据
        existing_cameras = []
        for cam in current_data['cameras']:
            existing_cameras.append({
                'position': np.array(cam['position']),
                'rotation': np.array(cam['rotation'])
            })
        
        # 计算建议的相机位置
        suggested_cameras = camera_optimizer.suggest_camera_positions(
            points, 
            existing_cameras, 
            current_data.get('sparse_regions', []),
            num_suggestions=5
        )
        
        # 存储结果
        current_data['suggested_cameras'] = suggested_cameras
        
        # 转换为可JSON序列化的格式
        suggested_cameras_json = []
        for i, cam in enumerate(suggested_cameras):
            suggested_cameras_json.append({
                'position': cam['position'].tolist(),
                'rotation': cam['rotation'].tolist(),
                'filename': f'suggested_camera_{i+1}',
                'score': float(cam['score'])
            })
        
        return jsonify({
            'suggested_cameras': suggested_cameras_json,
            'num_suggestions': len(suggested_cameras)
        })
        
    except Exception as e:
        logging.error(f"Error in optimize_cameras: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/export_pointcloud', methods=['GET', 'OPTIONS'])
def export_pointcloud():
    """导出处理后的点云"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'})
            
        # 使用处理过的点云或原始点云
        if current_data['processed_pointcloud']:
            points = current_data['processed_pointcloud']['points']
            colors = current_data['processed_pointcloud']['colors']
        elif current_data['pointcloud']:
            points = current_data['pointcloud']['points']
            colors = current_data['pointcloud']['colors']
        else:
            return jsonify({'error': '没有点云可导出'}), 400
        
        # 生成临时文件
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'processed_pointcloud_{timestamp}.ply'
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # 写入PLY文件
        ply_processor.write_ply(filepath, points, colors)
        
        # 发送文件
        return send_file(filepath, as_attachment=True, download_name=filename)
        
    except Exception as e:
        logging.error(f"Error in export_pointcloud: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test():
    """测试接口"""
    return jsonify({'status': 'ok', 'message': 'Flask server is running'})

def parse_camera_file(filepath, filename):
    """解析相机参数文件"""
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()
        
        values = []
        for line in lines:
            nums = line.strip().split()
            values.extend([float(x) for x in nums])
        
        if len(values) < 23:
            return None
        
        # 提取相机参数
        K = np.array(values[0:9]).reshape(3, 3)
        R = np.array(values[9:18]).reshape(3, 3)
        t = np.array(values[18:21])
        width = values[21]
        height = values[22]
        
        # 计算相机位置 C = -R^T * t
        C = -R.T @ t
        
        # 计算欧拉角
        rotation = rotation_matrix_to_euler(R)
        
        return {
            'filename': filename,
            'position': C.tolist(),
            'rotation': rotation.tolist(),
            'K': K.tolist(),
            'R': R.tolist(),
            't': t.tolist(),
            'width': width,
            'height': height
        }
        
    except Exception as e:
        print(f"Error parsing camera file {filename}: {e}")
        return None

def rotation_matrix_to_euler(R):
    """将旋转矩阵转换为欧拉角"""
    sy = np.sqrt(R[0, 0] * R[0, 0] + R[1, 0] * R[1, 0])
    singular = sy < 1e-6
    
    if not singular:
        x = np.arctan2(R[2, 1], R[2, 2])
        y = np.arctan2(R[2, 0], sy)
        z = np.arctan2(R[1, 0], R[0, 0])
    else:
        x = np.arctan2(R[1, 2], R[1, 1])
        y = np.arctan2(R[2, 0], sy)
        z = 0
    
    return np.array([x, y, z])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5005)