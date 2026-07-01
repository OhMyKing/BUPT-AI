from collections.abc import Generator
from typing import Any
import requests
import json

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage

class PublishGuideTaskTool(Tool):
    # 预定义的目的地列表
    PREDEFINED_DESTINATIONS = [
        "雁北A", "雁北C", "雁北D1", "雁北D2", 
        "雁南S2", "雁南S3", "雁南S4", "雁南S5", "雁南S6", 
        "南门", "西门", 
        "人工智能学院资料领取点", "计算机学院资料领取点", 
        "通信学院资料领取点", "现代邮政学院资料领取点", "电子学院资料领取点"
    ]
    
    # 当前机器人ID（写死）
    ROBOT_ID = 5
    
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage, None, None]:
        """
        发布引导任务到最近的引导机器人
        
        Args:
            tool_parameters: 包含destination参数的字典
            
        Yields:
            ToolInvokeMessage: 工具调用结果消息
        """
        # 获取目的地参数
        destination = tool_parameters.get("destination", "").strip()
        
        # 参数验证
        if not destination:
            yield self.create_text_message("错误：目的地参数不能为空")
            yield self.create_json_message({
                "success": False,
                "message": "目的地参数不能为空"
            })
            return
        
        # 验证目的地是否在预定义列表中
        if destination not in self.PREDEFINED_DESTINATIONS:
            yield self.create_text_message(
                f"错误：无效的目的地。请选择以下目的地之一：{', '.join(self.PREDEFINED_DESTINATIONS)}"
            )
            yield self.create_json_message({
                "success": False,
                "message": f"无效的目的地：{destination}",
                "valid_destinations": self.PREDEFINED_DESTINATIONS
            })
            return
        
        try:
            # 获取基础URL
            base_url = self.runtime.credentials.get("base_url", "http://127.0.0.1:5005").rstrip("/")
            
            # 构建请求URL
            url = f"{base_url}/api/publish_guide_task"
            
            # 准备请求数据
            request_data = {
                "robot_id": self.ROBOT_ID,
                "destination": destination
            }
            
            # 发送POST请求
            response = requests.post(
                url,
                json=request_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # 检查响应状态
            response.raise_for_status()
            
            # 解析响应数据
            response_data = response.json()
            
            # 构建成功消息
            if response_data.get("success", False):
                task_details = response_data.get("task_details", {})
                success_message = (
                    f"引导任务发布成功！\n"
                    f"目的地：{task_details.get('destination', destination)}\n"
                    f"分配的引导机器人ID：{task_details.get('guide_robot_id', 'N/A')}\n"
                    f"距离引导机器人：{task_details.get('distance_to_guide', 'N/A')} 米"
                )
                
                yield self.create_text_message(success_message)
                yield self.create_json_message(response_data)
                
                # 创建变量输出，方便在工作流中使用
                yield self.create_variable_message("guide_task_success", True)
                yield self.create_variable_message("guide_robot_id", task_details.get('guide_robot_id'))
                yield self.create_variable_message("distance_to_guide", task_details.get('distance_to_guide'))
            else:
                # 处理业务逻辑失败
                error_message = response_data.get("message", "引导任务发布失败")
                yield self.create_text_message(f"错误：{error_message}")
                yield self.create_json_message(response_data)
                yield self.create_variable_message("guide_task_success", False)
                
        except requests.exceptions.Timeout:
            error_msg = "请求超时，请检查服务器是否正常运行"
            yield self.create_text_message(f"错误：{error_msg}")
            yield self.create_json_message({
                "success": False,
                "message": error_msg
            })
            
        except requests.exceptions.ConnectionError:
            error_msg = f"无法连接到服务器 {base_url}，请检查服务器是否启动"
            yield self.create_text_message(f"错误：{error_msg}")
            yield self.create_json_message({
                "success": False,
                "message": error_msg
            })
            
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP错误 {e.response.status_code}: {e.response.text}"
            yield self.create_text_message(f"错误：{error_msg}")
            yield self.create_json_message({
                "success": False,
                "message": error_msg,
                "status_code": e.response.status_code
            })
            
        except json.JSONDecodeError:
            error_msg = "服务器返回的数据格式无效"
            yield self.create_text_message(f"错误：{error_msg}")
            yield self.create_json_message({
                "success": False,
                "message": error_msg
            })
            
        except Exception as e:
            error_msg = f"发生未知错误：{str(e)}"
            yield self.create_text_message(f"错误：{error_msg}")
            yield self.create_json_message({
                "success": False,
                "message": error_msg
            })