from typing import Any
import requests

from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError


class PublishGuideTaskProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        验证提供的凭证是否有效
        
        Args:
            credentials: 包含base_url的凭证字典
            
        Raises:
            ToolProviderCredentialValidationError: 如果凭证无效
        """
        try:
            base_url = credentials.get("base_url")
            if not base_url:
                raise ToolProviderCredentialValidationError("Base URL is required")
            
            # 去除末尾的斜杠
            base_url = base_url.rstrip("/")
            
            # 验证URL格式
            if not base_url.startswith(("http://", "https://")):
                raise ToolProviderCredentialValidationError(
                    "Base URL must start with http:// or https://"
                )
            
            # 可选：尝试连接到服务器验证URL是否可访问
            # 这里暂时跳过实际连接测试，因为服务器可能还未启动
            
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e))