import urllib.request
import urllib.parse
import json
import urllib.error
from typing import Dict, Any


def get_student_info(student_info_url: str, student_num: int) -> str:
    """
    根据学号查询学生信息
    
    Args:
        student_info_url: 学生信息API的URL
        student_num: 学生学号
    
    Returns:
        str: 学生信息字符串
    """
    # 准备请求数据
    data = {
        "student_num": student_num
    }
    
    # 将数据转换为JSON字符串并编码
    json_data = json.dumps(data).encode('utf-8')
    
    try:
        # 创建请求对象
        request = urllib.request.Request(
            student_info_url,
            data=json_data,
            headers={
                'Content-Type': 'application/json',
                'Content-Length': str(len(json_data))
            },
            method='POST'
        )
        
        # 发送请求并获取响应
        with urllib.request.urlopen(request, timeout=10) as response:
            # 读取响应数据
            response_data = response.read().decode('utf-8')
            result = json.loads(response_data)
            
            # 检查请求是否成功
            if result.get('success', False):
                student_info = result.get('student_info', '')
                if not student_info:
                    return "未找到学生信息"
                return student_info
            else:
                return f"查询失败: {result.get('message', '未知错误')}"
                
    except urllib.error.HTTPError as e:
        # HTTP错误处理
        error_message = f"HTTP错误 {e.code}: {e.reason}"
        try:
            error_response = json.loads(e.read().decode('utf-8'))
            error_message = error_response.get('message', error_message)
        except:
            pass
            
        return f"请求失败: {error_message}"
        
    except urllib.error.URLError as e:
        # 网络连接错误
        return f"连接错误: {e.reason}"
        
    except json.JSONDecodeError as e:
        # JSON解析错误
        return f"响应数据格式错误: {e}"
        
    except Exception as e:
        # 其他异常
        return f"未知错误: {e}"