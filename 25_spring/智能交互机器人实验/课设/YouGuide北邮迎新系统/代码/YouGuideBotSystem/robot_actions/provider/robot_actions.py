from typing import Any
import requests

from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError


class RobotActionsProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        验证提供的凭证是否有效
        
        Args:
            credentials: 包含 base_url 的凭证字典
            
        Raises:
            ToolProviderCredentialValidationError: 如果凭证无效
        """
        try:
            base_url = credentials.get("base_url", "").strip()
            
            if not base_url:
                raise ToolProviderCredentialValidationError("Base URL is required")
            
            # 验证 URL 格式
            if not base_url.startswith(("http://", "https://")):
                raise ToolProviderCredentialValidationError(
                    "Base URL must start with http:// or https://"
                )
            
            # 移除末尾的斜杠
            if base_url.endswith("/"):
                base_url = base_url[:-1]
            
            # 尝试连接服务器（可选的健康检查）
            # 注意：在实际使用中，您可能需要一个专门的健康检查端点
            # 这里我们只是尝试访问根路径
            try:
                response = requests.get(base_url, timeout=5)
                # 即使返回 404 也认为服务器是可达的
            except requests.exceptions.ConnectionError:
                raise ToolProviderCredentialValidationError(
                    f"Cannot connect to server at {base_url}"
                )
            except requests.exceptions.Timeout:
                raise ToolProviderCredentialValidationError(
                    f"Connection to {base_url} timed out"
                )
            except requests.exceptions.RequestException as e:
                raise ToolProviderCredentialValidationError(
                    f"Error connecting to server: {str(e)}"
                )
                
        except ToolProviderCredentialValidationError:
            raise
        except Exception as e:
            raise ToolProviderCredentialValidationError(
                f"Unexpected error validating credentials: {str(e)}"
            )