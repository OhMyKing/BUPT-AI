import torch
import os

class ModelManager:
    """模型管理器，负责加载和管理所有模型实例"""
    
    _instance = None
    
    def __new__(cls):
        """单例模式"""
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """初始化模型管理器"""
        if self._initialized:
            return
            
        self._initialized = True
        self.models = {}
        
        # 检测是否有可用的CUDA设备
        if torch.cuda.is_available():
            self.device = "cuda"
            print(f"使用GPU: {torch.cuda.get_device_name(0)}")
        else:
            self.device = "cpu"
            print("使用CPU")
    
    def load_all_models(self):
        """加载所有模型"""
        print("正在预加载所有模型...")
        
        # 1. 加载RMBG模型
        self.load_rmbg_model()
        
        # 2. 加载YOLOv5模型
        self.load_yolo_model()
        
        print("所有模型加载完成！")
    
    def load_rmbg_model(self):
        """加载RMBG模型"""
        if 'rmbg' not in self.models:
            from util.image_processor import init_rmbg_model
            self.models['rmbg'] = init_rmbg_model(device=self.device)
        return self.models['rmbg']
    
    def load_yolo_model(self):
        """加载YOLO模型"""
        if 'yolo' not in self.models:
            print("加载YOLOv5模型...")
            # 使用torch hub加载YOLOv5模型
            model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
            # 只检测人物类别 (COCO数据集中的第0类)
            model.classes = [0]
            # 移动到适当的设备
            model.to(self.device)
            self.models['yolo'] = model
            print("YOLOv5模型加载完成")
        return self.models['yolo']
    
    def get_rmbg_model(self):
        """获取RMBG模型"""
        return self.load_rmbg_model()
    
    def get_yolo_model(self):
        """获取YOLO模型"""
        return self.load_yolo_model()
    
    def unload_model(self, model_name):
        """卸载指定模型以释放内存"""
        if model_name in self.models:
            del self.models[model_name]
            torch.cuda.empty_cache()  # 清理GPU缓存
            print(f"{model_name}模型已卸载")
    
    def unload_all_models(self):
        """卸载所有模型"""
        self.models.clear()
        torch.cuda.empty_cache()  # 清理GPU缓存
        print("所有模型已卸载")

# 创建全局实例
model_manager = ModelManager()