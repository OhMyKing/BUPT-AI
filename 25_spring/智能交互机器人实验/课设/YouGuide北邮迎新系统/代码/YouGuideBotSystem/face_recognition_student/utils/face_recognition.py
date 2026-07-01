import urllib.request
import urllib.error
import json
from typing import Optional


def recognize_face(face_recognition_url: str) -> Optional[int]:
    """
    调用人脸识别接口获取学生ID
    
    Args:
        face_recognition_url: 人脸识别服务器地址
        
    Returns:
        int: 学生ID，如果识别失败返回None
        
    Raises:
        Exception: 如果API调用失败
    """
    try:
        # 创建请求
        request = urllib.request.Request(face_recognition_url, method='GET')
        
        # 发送请求并获取响应
        with urllib.request.urlopen(request, timeout=10) as response:
            # 读取响应数据
            data = response.read()
            
            # 解析JSON
            result = json.loads(data.decode('utf-8'))
            
            # 获取user_id
            user_id = result.get('user_id')
            
            # 如果user_id存在且不为None，转换为int
            if user_id is not None:
                return int(user_id)
            else:
                raise Exception("人脸识别失败：未返回有效的用户ID")
                
    except urllib.error.HTTPError as e:
        raise Exception(f"人脸识别API HTTP错误 {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise Exception(f"人脸识别API连接错误: {e.reason}")
    except json.JSONDecodeError as e:
        raise Exception(f"人脸识别API响应数据格式错误: {e}")
    except Exception as e:
        if "人脸识别失败" in str(e):
            raise
        raise Exception(f"人脸识别API调用失败: {e}")