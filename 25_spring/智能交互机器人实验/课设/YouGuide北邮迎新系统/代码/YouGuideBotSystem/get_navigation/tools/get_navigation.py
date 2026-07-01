from collections.abc import Generator
from typing import Any

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage

# 导入辅助函数
from utils.navigation_helpers import (
    get_navigation_route,
    format_navigation_response,
    validate_destination,
    PREDEFINED_DESTINATIONS
)


class GetNavigationTool(Tool):
    # 固定的当前位置：南门
    FIXED_CURRENT_LOCATION = {
        "latitude": 40.161826,
        "longitude": 116.298965,
        "name": "南门"
    }
    
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage, None, None]:
        """
        调用导航API获取从南门到目的地的步行路线
        
        Args:
            tool_parameters: 包含destination的参数字典
            
        Yields:
            ToolInvokeMessage: 导航结果消息
        """
        try:
            # 使用固定的当前位置
            current_lat = self.FIXED_CURRENT_LOCATION["latitude"]
            current_lon = self.FIXED_CURRENT_LOCATION["longitude"]
            current_location_name = self.FIXED_CURRENT_LOCATION["name"]
            
            # 获取目的地参数
            destination = tool_parameters.get("destination", "").strip()
            
            # 参数验证
            if not destination:
                yield self.create_text_message("错误：缺少目的地参数")
                return
            
            # 验证目的地
            is_valid, error_msg = validate_destination(destination)
            if not is_valid:
                yield self.create_text_message(f"错误：{error_msg}")
                return
            
            # 获取base_url
            base_url = self.runtime.credentials.get("base_url", "").strip()
            if not base_url:
                yield self.create_text_message("错误：未配置导航API的基础URL")
                return
            
            # 移除末尾的斜杠
            if base_url.endswith("/"):
                base_url = base_url[:-1]
            
            # 调用导航API
            response = get_navigation_route(base_url, current_lat, current_lon, destination)
            
            # 返回JSON格式的原始数据
            yield self.create_json_message(response)
            
            # 返回格式化的文本消息
            formatted_message = format_navigation_response(response)
            # 在消息开头添加起点信息
            complete_message = f"🚶 起点：{current_location_name}\n{formatted_message}"
            yield self.create_text_message(complete_message)
            
            # 如果需要，可以返回特定的变量供工作流使用
            if response.get("success", False):
                yield self.create_variable_message("navigation_success", True)
                yield self.create_variable_message("total_distance", response.get("total_distance", 0))
                yield self.create_variable_message("estimated_time", response.get("estimated_time", 0))
                yield self.create_variable_message("route_suggestion", response.get("route_suggestion", ""))
            else:
                yield self.create_variable_message("navigation_success", False)
            
        except Exception as e:
            # 错误处理
            yield self.create_text_message(f"获取导航信息时发生错误：{str(e)}")
            yield self.create_variable_message("navigation_success", False)