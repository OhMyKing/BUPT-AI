import requests
from typing import Dict, Any, Tuple

# 预定义的目的地列表
PREDEFINED_DESTINATIONS = {
    "雁北A": {"latitude": 40.164607, "longitude": 116.295085},
    "雁北C": {"latitude": 40.165055, "longitude": 116.294815},
    "雁北D1": {"latitude": 40.164938, "longitude": 116.29522},
    "雁北D2": {"latitude": 40.165727, "longitude": 116.294914},
    "雁南S2": {"latitude": 40.164042, "longitude": 116.295833},
    "雁南S3": {"latitude": 40.163463, "longitude": 116.295712},
    "雁南S4": {"latitude": 40.163084, "longitude": 116.295802},
    "雁南S5": {"latitude": 40.162101, "longitude": 116.296661},
    "雁南S6": {"latitude": 40.16203, "longitude": 116.295664},
    "南门": {"latitude": 40.161826, "longitude": 116.298965},
    "西门": {"latitude": 40.163026, "longitude": 116.290438},
    "人工智能学院资料领取点": {"latitude": 40.162028, "longitude": 116.298729},
    "计算机学院资料领取点": {"latitude": 40.162237, "longitude": 116.298639},
    "通信学院资料领取点": {"latitude": 40.16248, "longitude": 116.298536},
    "现代邮政学院资料领取点": {"latitude": 40.162709, "longitude": 116.298442},
    "电子学院资料领取点": {"latitude": 40.162954, "longitude": 116.298329}
}

def validate_destination(destination: str) -> Tuple[bool, str]:
    """
    验证目的地是否在预定义列表中
    
    Args:
        destination: 目的地名称
        
    Returns:
        (是否有效, 错误信息或空字符串)
    """
    if destination not in PREDEFINED_DESTINATIONS:
        available_destinations = ", ".join(PREDEFINED_DESTINATIONS.keys())
        return False, f"目的地 '{destination}' 不在支持的列表中。支持的目的地有：{available_destinations}"
    return True, ""

def get_navigation_route(base_url: str, current_lat: float, current_lon: float, destination: str) -> Dict[str, Any]:
    """
    调用导航API获取路线建议
    
    Args:
        base_url: API基础URL
        current_lat: 当前纬度
        current_lon: 当前经度
        destination: 目的地名称
        
    Returns:
        API响应的字典数据
        
    Raises:
        Exception: 如果API调用失败
    """
    # 验证目的地
    is_valid, error_msg = validate_destination(destination)
    if not is_valid:
        raise ValueError(error_msg)
    
    # 构建请求URL
    url = f"{base_url}/api/route_suggestion"
    params = {
        "current_lat": current_lat,
        "current_lon": current_lon,
        "destination": destination
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise Exception(f"导航API调用失败: {str(e)}")
    except ValueError as e:
        raise Exception(f"解析API响应失败: {str(e)}")

def format_navigation_response(response: Dict[str, Any]) -> str:
    """
    格式化导航响应为用户友好的文本
    
    Args:
        response: API响应数据
        
    Returns:
        格式化的导航信息
    """
    if not response.get("success", False):
        return "获取导航信息失败"
    
    parts = []
    
    # 目的地信息
    parts.append(f"📍 目的地：{response.get('destination', '未知')}")
    
    # 距离和时间
    total_distance = response.get('total_distance', 0)
    estimated_time = response.get('estimated_time', 0)
    minutes = estimated_time // 60
    seconds = estimated_time % 60
    
    parts.append(f"📏 总距离：{total_distance}米")
    parts.append(f"⏱️ 预计步行时间：{minutes}分钟{seconds}秒" if seconds > 0 else f"⏱️ 预计步行时间：{minutes}分钟")
    
    # 步数
    steps_count = response.get('steps_count', 0)
    parts.append(f"👣 总步数：{steps_count}步")
    
    # 路线建议
    route_suggestion = response.get('route_suggestion', '')
    if route_suggestion:
        # 清理HTML标签
        cleaned_suggestion = route_suggestion.replace('<b>', '**').replace('</b>', '**')
        parts.append(f"\n🗺️ 路线详情：\n{cleaned_suggestion}")
    
    return "\n".join(parts)