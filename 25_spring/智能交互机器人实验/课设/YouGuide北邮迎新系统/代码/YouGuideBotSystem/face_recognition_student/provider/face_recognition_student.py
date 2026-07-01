from typing import Any
import urllib.request
import urllib.error

from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError


class FaceRecognitionStudentProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        验证配置的服务器地址是否有效
        
        Args:
            credentials: 包含face_recognition_url和student_info_url的凭证字典
            
        Raises:
            ToolProviderCredentialValidationError: 如果验证失败
        """
        try:
            # 验证必需的凭证字段
            face_recognition_url = credentials.get('face_recognition_url')
            student_info_url = credentials.get('student_info_url')
            
            if not face_recognition_url:
                raise ToolProviderCredentialValidationError("Face recognition URL is required")
                
            if not student_info_url:
                raise ToolProviderCredentialValidationError("Student info URL is required")
            
            # 验证URL格式
            if not face_recognition_url.startswith(('http://', 'https://')):
                raise ToolProviderCredentialValidationError("Face recognition URL must start with http:// or https://")
                
            if not student_info_url.startswith(('http://', 'https://')):
                raise ToolProviderCredentialValidationError("Student info URL must start with http:// or https://")
            
            # 可选：尝试连接验证服务器是否可达
            # 由于可能需要特定的网络环境，这里只做格式验证
            
        except ToolProviderCredentialValidationError:
            raise
        except Exception as e:
            raise ToolProviderCredentialValidationError(f"Credential validation failed: {str(e)}")