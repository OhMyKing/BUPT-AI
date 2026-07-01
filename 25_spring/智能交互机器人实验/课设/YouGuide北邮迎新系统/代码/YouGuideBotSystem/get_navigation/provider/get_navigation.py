from typing import Any

from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError


class GetNavigationProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        验证提供的凭证
        
        Args:
            credentials: 包含base_url的凭证字典
            
        Raises:
            ToolProviderCredentialValidationError: 如果凭证无效
        """
        try:
            base_url = credentials.get("base_url", "").strip()
            
            # 验证base_url是否存在
            if not base_url:
                raise ToolProviderCredentialValidationError("Base URL is required")
            
            # 验证base_url格式
            if not base_url.startswith(("http://", "https://")):
                raise ToolProviderCredentialValidationError(
                    "Base URL must start with http:// or https://"
                )
            
            # 移除末尾的斜杠（如果有）
            if base_url.endswith("/"):
                base_url = base_url[:-1]
            
            # 可选：尝试连接到API以验证其可用性
            # 这里我们暂时只做格式验证，不进行实际的网络请求
            
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e))