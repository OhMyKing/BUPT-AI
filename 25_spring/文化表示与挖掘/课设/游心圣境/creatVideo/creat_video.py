import os
import time
import base64
import requests
import cv2
import numpy as np
import subprocess
from volcenginesdkarkruntime import Ark

# 初始化Ark客户端
client = Ark(
    api_key="a0bf8330-afec-4af1-8180-add423b65ce2"
)

def image_to_base64_url(image_path):
    """将本地图像文件转换为base64 data URL"""
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
    """创建视频生成任务"""
    print("----- 创建视频生成任务 -----")
    
    # 将本地图像转换为base64 data URL
    try:
        image_data_url = image_to_base64_url(image_path)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        return None
    except Exception as e:
        print(f"❌ 处理图像文件时出错: {e}")
        return None
    
    create_result = client.content_generation.tasks.create(
        model="doubao-seedance-1-0-lite-i2v-250428", 
        content=[
            {
                "type": "text",
                "text": f"{prompt} --dur {duration}"
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
    """检查任务状态"""
    get_result = client.content_generation.tasks.get(task_id=task_id)
    return get_result

def wait_for_completion(task_id, max_wait_time=300, check_interval=10):
    """等待任务完成"""
    print(f"----- 等待任务完成 (最大等待时间: {max_wait_time}秒) -----")
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        result = check_task_status(task_id)
        status = result.status
        
        print(f"当前状态: {status}")
        
        if status == "succeeded":
            print("✅ 任务完成成功！")
            return result
        elif status == "failed":
            print("❌ 任务失败")
            print(f"失败原因: {getattr(result, 'error', '未知错误')}")
            return None
        elif status == "cancelled":
            print("⚠️ 任务已取消")
            return None
        elif status in ["queued", "running"]:
            print(f"⏳ 任务进行中，{check_interval}秒后再次检查...")
            time.sleep(check_interval)
        else:
            print(f"未知状态: {status}")
            time.sleep(check_interval)
    
    print("⏰ 等待超时")
    return None

def download_video(video_url, filename="generated_video.mp4"):
    """下载生成的视频"""
    print(f"----- 下载视频到 {filename} -----")
    try:
        response = requests.get(video_url, stream=True)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"✅ 视频下载完成: {filename}")
        return filename
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        return None


def main():
    """主函数"""
    # 检查本地图像文件是否存在
    image_path = "./俎豆礼容图_0.jpg"
    prompt = """
    古画褐色调和平面质感，画面严格保持在原画范围内。画面中的六个小孩自然地玩耍。人物动作细腻自然，体现古画的典雅韵味。全程画面中只有六个小孩可以运动，其他部分保持静止
    """
    duration = 10
    if not os.path.exists(image_path):
        print(f"❌ 图像文件不存在: {image_path}")
        print("请确保图像文件在当前目录下")
        return
    
    try:
        # 1. 创建任务
        task_id = create_video_task(image_path, prompt, duration)
        
        if not task_id:
            print("❌ 任务创建失败")
            return
        
        # 2. 等待任务完成
        result = wait_for_completion(task_id)
        
        if result and result.status == "succeeded":
            # 3. 获取视频信息
            print("----- 任务完成，获取视频信息 -----")
            
            # 从结果中提取视频URL
            if hasattr(result, 'content') and result.content:
                video_url = getattr(result.content, 'video_url', None)
                
                if video_url:
                    print(f"✅ 找到视频下载链接: {video_url}")
                    
                    # 4. 下载原始视频
                    base_name = os.path.splitext(os.path.basename(image_path))[0]
                    original_filename = f"{base_name}.mp4"
                    downloaded_file = download_video(video_url, original_filename)
                    
                    if downloaded_file:
                        print("\n📁 生成的文件:")
                        print(f"  • 原始视频: {original_filename}")
                        
                else:
                    print("未找到视频下载链接")
            else:
                print("任务完成但未找到content字段")
        
    except Exception as e:
        print(f"发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()