import requests
from typing import Dict, Any
from urllib.parse import urljoin, quote

# 定义可用的机器人动作
AVAILABLE_ACTIONS = [
    "举手",
    "伸展手臂", 
    "点头",
    "摇头",
    "鞠躬",
    "下蹲",
    "前进一步",
    "后退一步", 
    "左移一步",
    "右移一步"
]

def execute_robot_action(base_url: str, action: str) -> Dict[str, Any]:
    """
    执行机器人动作
    
    Args:
        base_url: 机器人服务器的基础 URL
        action: 要执行的动作名称
        
    Returns:
        包含执行结果的字典:
        - status: 'success' 或 'fail'
        - message: 描述信息
        - action: 执行的动作名称
        
    Raises:
        Exception: 如果请求失败
    """
    # 验证动作是否有效
    if action not in AVAILABLE_ACTIONS:
        return {
            "status": "fail",
            "message": f"不支持的动作: {action}。可用动作: {', '.join(AVAILABLE_ACTIONS)}",
            "action": action
        }
    
    # 确保 base_url 格式正确
    if not base_url.endswith("/"):
        base_url += "/"
    
    # 构建完整的 URL，对动作名称进行 URL 编码
    action_encoded = quote(action)
    url = urljoin(base_url, f"action/{action_encoded}")
    
    try:
        # 发送 GET 请求到机器人服务器
        response = requests.get(url, timeout=10)
        
        # 检查响应状态
        if response.status_code == 200:
            return {
                "status": "success",
                "message": f"成功执行动作: {action}",
                "action": action,
                "url": url,
                "response_code": response.status_code
            }
        else:
            return {
                "status": "fail",
                "message": f"服务器返回错误状态码: {response.status_code}",
                "action": action,
                "url": url,
                "response_code": response.status_code,
                "response_text": response.text[:200]  # 限制响应文本长度
            }
            
    except requests.exceptions.Timeout:
        return {
            "status": "fail",
            "message": "请求超时，机器人服务器响应过慢",
            "action": action,
            "url": url
        }
    except requests.exceptions.ConnectionError:
        return {
            "status": "fail", 
            "message": "无法连接到机器人服务器，请检查网络连接和服务器地址",
            "action": action,
            "url": url
        }
    except requests.exceptions.RequestException as e:
        return {
            "status": "fail",
            "message": f"请求失败: {str(e)}",
            "action": action,
            "url": url
        }
    except Exception as e:
        return {
            "status": "fail",
            "message": f"执行动作时发生未知错误: {str(e)}",
            "action": action
        }

def get_available_actions():
    """
    获取所有可用的机器人动作列表
    
    Returns:
        动作名称列表
    """
    return AVAILABLE_ACTIONS.copy()