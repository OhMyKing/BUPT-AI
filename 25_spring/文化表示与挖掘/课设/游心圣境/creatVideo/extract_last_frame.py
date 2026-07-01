import cv2
import os
import sys

def extract_last_frame(video_path, output_name=None):
    """
    提取视频的最后一帧并保存到当前目录
    
    参数:
        video_path: 视频文件的路径
        output_name: 输出图片的文件名（可选）
    """
    # 打开视频文件
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"错误：无法打开视频文件 '{video_path}'")
        return False
    
    # 获取视频总帧数
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if total_frames == 0:
        print("错误：视频文件没有帧")
        cap.release()
        return False
    
    # 定位到最后一帧（帧索引从0开始，所以要减1）
    cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames - 1)
    
    # 读取最后一帧
    ret, frame = cap.read()
    
    if not ret:
        print("错误：无法读取最后一帧")
        cap.release()
        return False
    
    # 如果没有指定输出文件名，则使用默认名称
    if output_name is None:
        # 获取视频文件名（不含扩展名）
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        output_name = f"{video_name}_last_frame.jpg"
    
    # 保存图片到当前目录
    output_path = os.path.join(os.getcwd(), output_name)
    cv2.imwrite(output_path, frame)
    
    # 释放资源
    cap.release()
    
    print(f"成功提取最后一帧并保存到: {output_path}")
    print(f"图片尺寸: {frame.shape[1]}x{frame.shape[0]}")
    
    return True

def main():
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("使用方法: python extract_last_frame.py <视频文件路径> [输出文件名]")
        print("示例: python extract_last_frame.py video.mp4")
        print("示例: python extract_last_frame.py video.mp4 output.png")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    # 检查视频文件是否存在
    if not os.path.exists(video_path):
        print(f"错误：视频文件 '{video_path}' 不存在")
        sys.exit(1)
    
    # 获取输出文件名（如果提供）
    output_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    # 提取最后一帧
    success = extract_last_frame(video_path, output_name)
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()