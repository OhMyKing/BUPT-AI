import os
import shutil
import time
import logging

class SFM:
    """SFM演示类，用于模拟SFM重建过程"""
    
    def __init__(self):
        # 预设的数据路径
        project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.demo_ply_path = os.path.join(project_dir, "datas", "cloud_11_view.ply")
        self.demo_cameras_dir = os.path.join(project_dir, "datas", "gt_dense_cameras")
        
    def reconstruct(self, images_dir):
        """
        模拟SFM重建过程
        
        Args:
            images_dir: 图片文件夹路径
            
        Returns:
            tuple: (ply文件路径, 相机参数目录路径)
        """
        logging.info(f"开始模拟SFM重建，图片目录: {images_dir}")
        
        # 检查图片目录
        if not os.path.exists(images_dir):
            raise ValueError(f"图片目录不存在: {images_dir}")
            
        # 列出图片文件
        image_files = [f for f in os.listdir(images_dir) 
                      if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        logging.info(f"找到 {len(image_files)} 张图片")
        
        # 模拟处理时间（根据图片数量）
        process_time = min(2 + len(image_files) * 0.1, 5)  # 最多5秒
        logging.info(f"模拟处理时间: {process_time:.1f} 秒")
        time.sleep(process_time)
        
        # 检查演示文件是否存在
        if not os.path.exists(self.demo_ply_path):
            raise FileNotFoundError(f"演示PLY文件不存在: {self.demo_ply_path}")
        
        if not os.path.exists(self.demo_cameras_dir):
            raise FileNotFoundError(f"演示相机参数目录不存在: {self.demo_cameras_dir}")
        
        logging.info("SFM重建完成（演示）")
        
        # 返回预设的文件路径
        return self.demo_ply_path, self.demo_cameras_dir
