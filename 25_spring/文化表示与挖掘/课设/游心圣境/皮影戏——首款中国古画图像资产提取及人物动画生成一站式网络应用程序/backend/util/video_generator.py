import os
import time
import base64
import requests
import cv2
import numpy as np
from pathlib import Path
from volcenginesdkarkruntime import Ark

# 初始化Ark客户端
client = Ark(
    api_key="a0bf8330-afec-4af1-8180-add423b65ce2"
)

def image_to_base64_url(image_path):
    """
    将本地图像文件转换为base64 data URL
    
    Args:
        image_path: 图像文件路径
    
    Returns:
        data_url: base64编码的图像URL
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"图像文件不存在: {image_path}")
    
    # 获取文件扩展名来确定MIME类型
    ext = os.path.splitext(image_path)[1].lower()
    mime_types = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
    }
    
    mime_type = mime_types.get(ext, 'image/png')
    
    # 读取图像文件并转换为base64
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    base64_data = base64.b64encode(image_data).decode('utf-8')
    data_url = f"data:{mime_type};base64,{base64_data}"
    
    print(f"✅ 成功加载本地图像: {image_path}")
    print(f"📏 图像大小: {len(image_data)} 字节")
    
    return data_url

def create_video_task(image_path, prompt, duration=5):
    """
    创建视频生成任务
    
    Args:
        image_path: 图像文件路径
        prompt: 视频生成提示词
        duration: 视频时长(秒)
    
    Returns:
        task_id: 生成任务ID
    """
    print("----- 创建视频生成任务 -----")
    
    # 将本地图像转换为base64 data URL
    try:
        image_data_url = image_to_base64_url(image_path)
    except Exception as e:
        print(f"处理图像文件时出错: {e}")
        raise
    
    # 组装完整的提示词
    full_prompt = f"{prompt} --dur {duration}"
    
    # 创建任务
    create_result = client.content_generation.tasks.create(
        model="doubao-seedance-1-0-lite-i2v-250428", 
        content=[
            {
                "type": "text",
                "text": full_prompt
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": image_data_url
                }
            }
        ]
    )
    
    print(f"任务创建成功，任务ID: {create_result.id}")
    return create_result.id

def check_task_status(task_id):
    """
    检查任务状态
    
    Args:
        task_id: 任务ID
    
    Returns:
        result: 任务状态信息
    """
    get_result = client.content_generation.tasks.get(task_id=task_id)
    return get_result

def wait_for_completion(task_id, max_wait_time=300, check_interval=5):
    """
    等待任务完成
    
    Args:
        task_id: 任务ID
        max_wait_time: 最大等待时间(秒)
        check_interval: 检查间隔(秒)
    
    Returns:
        result: 完成的任务结果
    """
    print(f"----- 等待任务完成 (最大等待时间: {max_wait_time}秒) -----")
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        result = check_task_status(task_id)
        status = result.status
        
        print(f"当前状态: {status}")
        
        if status == "succeeded":
            print("任务完成成功！")
            return result
        elif status == "failed":
            print("任务失败")
            print(f"失败原因: {getattr(result, 'error', '未知错误')}")
            raise Exception(f"视频生成任务失败: {getattr(result, 'error', '未知错误')}")
        elif status == "cancelled":
            print("任务已取消")
            raise Exception("视频生成任务被取消")
        elif status in ["queued", "running"]:
            print(f"任务进行中，{check_interval}秒后再次检查...")
            time.sleep(check_interval)
        else:
            print(f"未知状态: {status}")
            time.sleep(check_interval)
    
    print("等待超时")
    raise Exception("视频生成任务超时")

def download_video(video_url, output_path):
    """
    下载生成的视频
    
    Args:
        video_url: 视频URL
        output_path: 输出文件路径
    
    Returns:
        output_path: 下载后的文件路径
    """
    print(f"----- 下载视频到 {output_path} -----")
    try:
        response = requests.get(video_url, stream=True)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"视频下载完成: {output_path}")
        return output_path
    except Exception as e:
        print(f"下载失败: {e}")
        raise

def remove_black_background(input_video_path, output_video_path, black_threshold=30, blur_kernel=5):
    """
    去除视频的黑色背景，生成透明背景的视频
    
    Args:
        input_video_path: 输入视频路径
        output_video_path: 输出视频路径
        black_threshold: 黑色阈值
        blur_kernel: 模糊核大小
    
    Returns:
        success: 处理成功标志
    """
    print(f"----- 开始处理视频背景 -----")
    print(f"输入视频: {input_video_path}")
    print(f"输出视频: {output_video_path}")
    
    # 打开输入视频
    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        print(f"无法打开视频文件: {input_video_path}")
        return False
    
    # 获取视频属性
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"📹 视频信息: {width}x{height}, {fps}fps, {total_frames}帧")
    
    # 设置输出视频编码器 (使用支持透明度的格式)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height), True)
    
    if not out.isOpened():
        print(f"无法创建输出视频文件: {output_video_path}")
        cap.release()
        return False
    
    frame_count = 0
    processed_frames = 0
    
    print("🎬 开始处理视频帧...")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # 创建蒙版来检测黑色背景
        # 转换为HSV色彩空间以更好地检测黑色
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # 创建黑色检测蒙版
        # 检测V通道（明度）较低的像素
        _, _, v = cv2.split(hsv)
        black_mask = v < black_threshold
        
        # 对蒙版进行形态学操作以减少噪声
        kernel = np.ones((blur_kernel, blur_kernel), np.uint8)
        black_mask = cv2.morphologyEx(black_mask.astype(np.uint8), cv2.MORPH_CLOSE, kernel)
        black_mask = cv2.morphologyEx(black_mask, cv2.MORPH_OPEN, kernel)
        
        # 应用高斯模糊来平滑边缘
        black_mask = cv2.GaussianBlur(black_mask.astype(np.float32), (blur_kernel, blur_kernel), 0)
        
        # 创建输出帧
        output_frame = frame.copy()
        
        # 将黑色区域设置为绿色（作为色度键背景）
        # 这样可以在后续的视频编辑软件中轻松去除
        green_background = np.zeros_like(frame)
        green_background[:, :] = [0, 255, 0]  # 纯绿色
        
        # 混合原始帧和绿色背景
        for c in range(3):
            output_frame[:, :, c] = (frame[:, :, c] * (1 - black_mask) + 
                                   green_background[:, :, c] * black_mask)
        
        # 写入处理后的帧
        out.write(output_frame.astype(np.uint8))
        processed_frames += 1
        
        # 显示进度
        if frame_count % 30 == 0:  # 每30帧显示一次进度
            progress = (frame_count / total_frames) * 100
            print(f"⏳ 处理进度: {progress:.1f}% ({frame_count}/{total_frames})")
    
    # 释放资源
    cap.release()
    out.release()
    
    print(f"✅ 视频后处理完成！")
    print(f"📊 处理统计: 总共处理了 {processed_frames} 帧")
    
    return True

def generate_video(image_path, output_dir, prompt, duration=5):
    """
    生成视频并处理
    
    Args:
        image_path: 输入图像路径
        output_dir: 输出目录
        prompt: 视频生成提示词
        duration: 视频时长(秒)
    
    Returns:
        processed_video_path: 处理后的视频路径
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取基础文件名（不包括扩展名）
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    
    try:
        # 1. 创建视频生成任务
        task_id = create_video_task(image_path, prompt, duration)
        
        # 2. 等待任务完成
        result = wait_for_completion(task_id)
        
        if result and result.status == "succeeded":
            # 3. 获取视频URL
            if hasattr(result, 'content') and result.content:
                video_url = getattr(result.content, 'video_url', None)
                
                if video_url:
                    original_filename = os.path.join(output_dir, f"{base_name}_original.mp4")
                    downloaded_file = download_video(video_url, original_filename)
                    
                    return downloaded_file
                else:
                    raise Exception("未找到视频下载链接")
            else:
                raise Exception("任务完成但未找到content字段")
        else:
            raise Exception("视频生成任务失败")
    
    except Exception as e:
        print(f"生成视频时出错: {e}")
        raise