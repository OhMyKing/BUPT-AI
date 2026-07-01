from collections.abc import Generator
from typing import Any

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage

# 导入辅助函数
from utils.robot_controller import execute_robot_action, get_available_actions


class RobotActionsTool(Tool):
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage, None, None]:
        """
        执行机器人动作
        
        Args:
            tool_parameters: 包含 'action' 参数的字典
            
        Yields:
            工具调用消息
        """
        # 获取动作参数
        action = tool_parameters.get("action", "").strip()
        
        # 验证参数
        if not action:
            yield self.create_text_message("错误：未提供动作名称")
            yield self.create_json_message({
                "status": "fail",
                "message": "未提供动作名称",
                "action": None
            })
            return
        
        # 获取服务器 base_url
        try:
            base_url = self.runtime.credentials.get("base_url", "").strip()
            if not base_url:
                yield self.create_text_message("错误：未配置服务器 URL")
                yield self.create_json_message({
                    "status": "fail",
                    "message": "未配置服务器 URL",
                    "action": action
                })
                return
        except Exception as e:
            yield self.create_text_message(f"获取服务器配置失败: {str(e)}")
            return
        
        # 执行动作
        try:
            result = execute_robot_action(base_url, action)
            
            # 返回结果
            if result["status"] == "success":
                yield self.create_text_message(result["message"])
            else:
                yield self.create_text_message(f"执行失败: {result['message']}")
            
            # 返回 JSON 格式的详细结果
            yield self.create_json_message(result)
            
            # 为工作流设置变量
            yield self.create_variable_message("execution_status", result["status"])
            yield self.create_variable_message("executed_action", result["action"])
            
        except Exception as e:
            error_msg = f"执行动作时发生错误: {str(e)}"
            yield self.create_text_message(error_msg)
            yield self.create_json_message({
                "status": "fail",
                "message": error_msg,
                "action": action
            })