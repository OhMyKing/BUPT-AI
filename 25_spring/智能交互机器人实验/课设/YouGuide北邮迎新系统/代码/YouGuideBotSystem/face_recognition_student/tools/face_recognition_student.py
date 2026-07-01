from collections.abc import Generator
from typing import Any

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage

# 导入辅助函数
from utils.face_recognition import recognize_face
from utils.student_info import get_student_info


class FaceRecognitionStudentTool(Tool):
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage, None, None]:
        """
        执行人脸识别并获取学生信息
        
        该工具会自动：
        1. 调用人脸识别API获取学生ID
        2. 使用学生ID查询学生信息
        3. 返回完整的学生信息
        """
        try:
            # 从凭证中获取服务器地址
            face_recognition_url = self.runtime.credentials.get('face_recognition_url')
            student_info_url = self.runtime.credentials.get('student_info_url')
            
            if not face_recognition_url or not student_info_url:
                yield self.create_text_message("错误：服务器地址未配置")
                yield self.create_json_message({
                    "status": "error",
                    "message": "服务器地址未配置"
                })
                return
            
            # 步骤1：进行人脸识别
            yield self.create_text_message("正在进行人脸识别...")
            
            try:
                student_id = recognize_face(face_recognition_url)
                yield self.create_text_message(f"人脸识别成功，学生ID: {student_id}")
            except Exception as e:
                error_msg = f"人脸识别失败: {str(e)}"
                yield self.create_text_message(error_msg)
                yield self.create_json_message({
                    "status": "error", 
                    "message": error_msg
                })
                return
            
            # 步骤2：查询学生信息
            yield self.create_text_message(f"正在查询学生信息...")
            
            student_info = get_student_info(student_info_url, student_id)
            
            # 返回结果
            yield self.create_text_message(f"查询完成")
            yield self.create_text_message(f"学生信息: {student_info}")
            
            # 返回JSON格式的结果
            yield self.create_json_message({
                "student_id": student_id,
                "student_info": student_info,
                "status": "success"
            })
            
            # 设置输出变量（用于工作流）
            yield self.create_variable_message("student_id", str(student_id))
            yield self.create_variable_message("student_info", str(student_info))
            
        except Exception as e:
            error_msg = f"工具执行错误: {str(e)}"
            yield self.create_text_message(error_msg)
            yield self.create_json_message({
                "status": "error",
                "message": error_msg
            })