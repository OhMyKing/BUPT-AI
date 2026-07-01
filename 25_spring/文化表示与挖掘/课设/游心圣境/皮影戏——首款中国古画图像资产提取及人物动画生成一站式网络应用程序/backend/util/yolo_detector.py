import os
import cv2
import numpy as np
import torch
from pathlib import Path
from util.model_manager import model_manager

def detect_characters(image_path, output_dir, conf_threshold=0.6, padding=40):
    """
    使用YOLOv5检测图像中的人物
    
    Args:
        image_path: 输入图像路径
        output_dir: 输出目录
        conf_threshold: 置信度阈值
        padding: 边界框填充像素
    
    Returns:
        detections: 检测到的人物列表
        detected_image_path: 标记了检测结果的图像路径
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取预加载的模型
    model = model_manager.get_yolo_model()
    model.conf = conf_threshold  # 设置置信度阈值
    
    # 读取图像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"无法加载图像: {image_path}")
    
    # 执行检测
    results = model(image_path)
    
    # 提取检测结果
    detections = []
    
    # 创建用于可视化的图像副本
    visualized_image = image.copy()
    
    if len(results.xyxy[0]) > 0:
        for i, det in enumerate(results.xyxy[0].cpu().numpy()):
            x1, y1, x2, y2, conf, cls = det
            if int(cls) == 0:  # 人物类
                # 添加padding并确保边界在图像内
                x1_pad = max(0, int(x1) - padding)
                y1_pad = max(0, int(y1) - padding)
                x2_pad = min(image.shape[1], int(x2) + padding)
                y2_pad = min(image.shape[0], int(y2) + padding)
                
                # 计算宽度和高度
                width = x2_pad - x1_pad
                height = y2_pad - y1_pad
                
                # 添加到检测列表
                detection = {
                    'id': i,
                    'x': x1_pad,
                    'y': y1_pad,
                    'width': width,
                    'height': height,
                    'confidence': float(conf)
                }
                detections.append(detection)
                
                # 在可视化图像上绘制边界框
                cv2.rectangle(visualized_image, (x1_pad, y1_pad), (x2_pad, y2_pad), (0, 255, 0), 2)
                
                # 添加置信度标注
                conf_text = f"{conf:.2f}"
                text_size = cv2.getTextSize(conf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                text_x = x1_pad
                text_y = y1_pad - 5
                cv2.putText(visualized_image, conf_text, (text_x, text_y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # 保存标记了检测结果的图像
    detected_image_path = os.path.join(output_dir, 'detected.jpg')
    cv2.imwrite(detected_image_path, visualized_image)
    
    return detections, detected_image_path

def detect_with_custom_threshold(image_path, output_dir, conf_threshold=0.6):
    """
    使用自定义置信度阈值进行人物检测，用于前端交互式调整
    """
    return detect_characters(image_path, output_dir, conf_threshold)