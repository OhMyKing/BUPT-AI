import os
import time
import uuid
import json
import shutil
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
import torch
from werkzeug.utils import secure_filename
from pathlib import Path

# 导入自定义模块
from util.yolo_detector import detect_characters
from util.image_processor import process_image, process_all_characters
from util.video_generator import generate_video
from util.model_manager import model_manager

app = Flask(__name__, static_folder='static')
CORS(app)  # 允许跨域请求

# 配置文件上传和处理的路径
UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads')
PROCESSED_FOLDER = os.path.join(app.static_folder, 'processed')
VIDEOS_FOLDER = os.path.join(app.static_folder, 'videos')

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
os.makedirs(VIDEOS_FOLDER, exist_ok=True)

# 允许上传的文件类型
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# 在服务器启动时预加载所有模型
model_manager.load_all_models()

def allowed_file(filename):
    """检查文件类型是否允许上传"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """处理图像上传请求"""
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': '没有上传文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': '未选择文件'}), 400
    
    if file and allowed_file(file.filename):
        # 创建唯一的图像ID
        image_id = str(uuid.uuid4())
        
        # 创建图像特定的目录
        image_upload_dir = os.path.join(UPLOAD_FOLDER, image_id)
        image_processed_dir = os.path.join(PROCESSED_FOLDER, image_id)
        image_videos_dir = os.path.join(VIDEOS_FOLDER, image_id)
        
        os.makedirs(image_upload_dir, exist_ok=True)
        os.makedirs(image_processed_dir, exist_ok=True)
        os.makedirs(image_videos_dir, exist_ok=True)
        
        # 保存原始图像
        filename = secure_filename(file.filename)
        file_path = os.path.join(image_upload_dir, filename)
        file.save(file_path)
        
        # 创建图像元数据文件，存储处理进度和相关信息
        metadata = {
            'image_id': image_id,
            'filename': filename,
            'original_path': file_path,
            'status': 'uploaded',
            'detections': [],
            'processed_characters': [],
            'videos': []
        }
        
        metadata_path = os.path.join(image_processed_dir, 'metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)
        
        # 返回图像ID和原始图像URL
        return jsonify({
            'status': 'success',
            'image_id': image_id,
            'filename': filename,
            'url': f'/static/uploads/{image_id}/{filename}'
        })
    
    return jsonify({'status': 'error', 'message': '不支持的文件类型'}), 400

@app.route('/api/detect', methods=['POST'])
def detect_people():
    """使用YOLO检测图像中的人物"""
    data = request.json
    image_id = data.get('image_id')
    conf_threshold = float(data.get('conf_threshold', 0.6))
    
    # 获取图像元数据
    metadata_path = os.path.join(PROCESSED_FOLDER, image_id, 'metadata.json')
    if not os.path.exists(metadata_path):
        return jsonify({'status': 'error', 'message': '图像未找到'}), 404
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # 获取原始图像路径
    original_path = metadata['original_path']
    if not os.path.exists(original_path):
        return jsonify({'status': 'error', 'message': '原始图像文件未找到'}), 404
    
    # 执行YOLO检测
    detections, detected_image_path = detect_characters(
        original_path,
        os.path.join(PROCESSED_FOLDER, image_id),
        conf_threshold
    )
    
    # 更新元数据
    metadata['detections'] = detections
    metadata['status'] = 'detected'
    metadata['detected_image_path'] = detected_image_path
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f)
    
    # 构建检测结果的响应
    result = {
        'status': 'success',
        'detections': detections,
        'image_with_boxes': f'/static/processed/{image_id}/detected.jpg'
    }
    
    return jsonify(result)

@app.route('/api/process', methods=['POST'])
def process_character():
    """处理选中的人物角色，分割背景和前景"""
    data = request.json
    image_id = data.get('image_id')
    
    # 获取图像元数据
    metadata_path = os.path.join(PROCESSED_FOLDER, image_id, 'metadata.json')
    if not os.path.exists(metadata_path):
        return jsonify({'status': 'error', 'message': '图像未找到'}), 404
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # 确保已经完成了检测
    if metadata.get('status') not in ['detected', 'processed'] or not metadata.get('detections'):
        return jsonify({'status': 'error', 'message': '请先完成人物检测'}), 400
    
    original_path = metadata['original_path']
    output_dir = os.path.join(PROCESSED_FOLDER, image_id)
    
    try:
        # 获取预加载的RMBG模型
        rmbg_model = model_manager.get_rmbg_model()
        
        # 处理所有检测到的角色
        character_results, background_path = process_all_characters(
            original_path,
            metadata['detections'],
            output_dir,
            rmbg_model
        )
        
        # 更新元数据
        metadata['processed_characters'] = []  # 清空现有处理结果
        for idx, result in enumerate(character_results):
            processed_character = {
                'id': idx,
                'character_path': result,
                'background_path': background_path
            }
            metadata['processed_characters'].append(processed_character)
        
        metadata['status'] = 'processed'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)
        
        # 构建处理结果的响应
        characters = []
        for idx, result in enumerate(character_results):
            characters.append({
                'id': idx,
                'character_image': f'/static{result.split("static")[1]}'
            })
        
        result = {
            'status': 'success',
            'characters': characters,
            'background_image': f'/static{background_path.split("static")[1]}'
        }
        
        return jsonify(result)

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'处理图像时出错: {str(e)}'}), 500

@app.route('/api/generate-video', methods=['POST'])
def create_video():
    """生成角色动画视频"""
    data = request.json
    image_id = data.get('image_id')
    character_id = int(data.get('character_id', 0))
    prompt = data.get('prompt', '侍女反复鞠躬，最后恢复原始站姿，保留古画画风与平面质感')
    duration = int(data.get('duration', 5))
    
    # 获取图像元数据
    metadata_path = os.path.join(PROCESSED_FOLDER, image_id, 'metadata.json')
    if not os.path.exists(metadata_path):
        return jsonify({'status': 'error', 'message': '图像未找到'}), 404
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # 确保已经完成了图像处理
    if metadata.get('status') != 'processed' or not metadata.get('processed_characters'):
        return jsonify({'status': 'error', 'message': '请先完成图像处理'}), 400
    
    # 获取对应的角色图像
    processed_character = None
    for char in metadata['processed_characters']:
        if char['id'] == character_id:
            processed_character = char
            break
    
    if not processed_character:
        return jsonify({'status': 'error', 'message': '未找到指定的角色'}), 404
    
    character_path = processed_character['character_path']
    
    # 创建视频输出目录
    video_output_dir = os.path.join(VIDEOS_FOLDER, image_id)
    os.makedirs(video_output_dir, exist_ok=True)
    
    # 生成视频
    try:
        video_path = generate_video(
            character_path,
            video_output_dir,
            prompt,
            duration
        )
        
        # 更新元数据
        video_info = {
            'character_id': character_id,
            'video_path': video_path,
            'prompt': prompt,
            'duration': duration
        }
        
        metadata['videos'].append(video_info)
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)
        
        # 构建视频生成结果的响应
        result = {
            'status': 'success',
            'video_url': f'/static{video_path.split("static")[1]}'
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'生成视频时出错: {str(e)}'}), 500

# 其余代码保持不变...

@app.route('/api/files/<image_id>', methods=['GET'])
def get_files(image_id):
    """获取指定图像的所有相关文件"""
    metadata_path = os.path.join(PROCESSED_FOLDER, image_id, 'metadata.json')
    if not os.path.exists(metadata_path):
        return jsonify({'status': 'error', 'message': '图像未找到'}), 404
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    # 构建文件列表
    files = {
        'original': f'/static/uploads/{image_id}/{metadata["filename"]}',
        'characters': [],
        'videos': []
    }
    
    # 添加检测结果图像
    if 'detected_image_path' in metadata:
        files['detected'] = f'/static{metadata["detected_image_path"].split("static")[1]}'
    
    # 添加处理后的角色图像
    for char in metadata.get('processed_characters', []):
        character_info = {
            'id': char['id'],
            'url': f'/static{char["character_path"].split("static")[1]}'
        }
        files['characters'].append(character_info)
        
        # 添加背景图像（只需要添加一次）
        if 'background_path' in char and 'background' not in files:
            files['background'] = f'/static{char["background_path"].split("static")[1]}'
    
    # 添加视频
    for video in metadata.get('videos', []):
        video_info = {
            'character_id': video['character_id'],
            'url': f'/static{video["video_path"].split("static")[1]}'
        }
        files['videos'].append(video_info)
    
    return jsonify({
        'status': 'success',
        'files': files
    })

@app.route('/api/projects', methods=['GET'])
def get_all_projects():
    """获取所有项目列表"""
    projects = []
    
    # 遍历处理目录下的所有子目录
    for image_id in os.listdir(PROCESSED_FOLDER):
        metadata_path = os.path.join(PROCESSED_FOLDER, image_id, 'metadata.json')
        
        # 检查是否存在元数据文件
        if os.path.isfile(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                
                # 构建项目基本信息
                project = {
                    'id': metadata['image_id'],
                    'name': metadata['filename'],
                    'imageUrl': f'/static/uploads/{image_id}/{metadata["filename"]}',
                    'createdAt': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(os.path.getctime(metadata_path))),
                    'status': metadata['status']
                }
                
                # 如果已检测，添加检测信息
                if metadata.get('status') != 'uploaded' and metadata.get('detections'):
                    project['detections'] = metadata['detections']
                    project['detectedImageUrl'] = f'/static/processed/{image_id}/detected.jpg'
                
                # 如果已处理，添加资产信息
                if metadata.get('status') == 'processed' and metadata.get('processed_characters'):
                    characters = []
                    for char in metadata['processed_characters']:
                        characters.append({
                            'id': char['id'],
                            'character_image': f'/static{char["character_path"].split("static")[1]}'
                        })
                    
                    # 获取背景图像
                    background = None
                    if metadata['processed_characters'] and 'background_path' in metadata['processed_characters'][0]:
                        background = f'/static{metadata["processed_characters"][0]["background_path"].split("static")[1]}'
                    
                    project['assets'] = {
                        'characters': characters,
                        'background': background
                    }
                
                # 如果有视频，添加视频信息
                if metadata.get('videos'):
                    videos = []
                    for video in metadata['videos']:
                        videos.append({
                            'character_id': video['character_id'],
                            'url': f'/static{video["video_path"].split("static")[1]}'
                        })
                    project['videos'] = videos
                
                projects.append(project)
            except Exception as e:
                # 跳过有问题的元数据文件
                print(f"Error reading metadata for {image_id}: {e}")
                continue
    
    # 按创建时间排序，最新的排在前面
    projects.sort(key=lambda x: x['createdAt'], reverse=True)
    
    return jsonify({
        'status': 'success',
        'projects': projects
    })

@app.route('/api/projects/<image_id>', methods=['DELETE'])
def delete_project(image_id):
    """删除指定的项目及其所有文件"""
    # 项目相关的目录路径
    upload_dir = os.path.join(UPLOAD_FOLDER, image_id)
    processed_dir = os.path.join(PROCESSED_FOLDER, image_id)
    videos_dir = os.path.join(VIDEOS_FOLDER, image_id)
    
    # 检查项目是否存在
    metadata_path = os.path.join(PROCESSED_FOLDER, image_id, 'metadata.json')
    if not os.path.exists(metadata_path):
        return jsonify({'status': 'error', 'message': '项目未找到'}), 404
    
    try:
        # 删除上传目录
        if os.path.exists(upload_dir):
            shutil.rmtree(upload_dir)
        
        # 删除处理目录
        if os.path.exists(processed_dir):
            shutil.rmtree(processed_dir)
        
        # 删除视频目录
        if os.path.exists(videos_dir):
            shutil.rmtree(videos_dir)
        
        return jsonify({
            'status': 'success',
            'message': '项目已成功删除'
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'删除项目时发生错误: {str(e)}'
        }), 500

@app.route('/static/<path:path>')
def serve_static(path):
    """提供静态文件"""
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5001)