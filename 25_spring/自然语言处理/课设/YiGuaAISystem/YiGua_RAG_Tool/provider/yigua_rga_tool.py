from typing import Any
import urllib.request
import json

from dify_plugin import ToolProvider
from dify_plugin.errors.tool import ToolProviderCredentialValidationError


class YiguaRgaToolProvider(ToolProvider):
    def _validate_credentials(self, credentials: dict[str, Any]) -> None:
        """
        验证提供的凭证是否有效
        
        Args:
            credentials: 包含base_url的凭证字典
        
        Raises:
            ToolProviderCredentialValidationError: 当凭证无效时
        """
        try:
            base_url = credentials.get("base_url", "").strip()
            
            # 检查base_url是否提供
            if not base_url:
                raise ToolProviderCredentialValidationError("Base URL is required")
            
            # 确保URL以http://或https://开头
            if not base_url.startswith(("http://", "https://")):
                raise ToolProviderCredentialValidationError("Base URL must start with http:// or https://")
            
            # 移除末尾的斜杠
            if base_url.endswith("/"):
                base_url = base_url[:-1]
            
            # 尝试连接到服务器验证URL是否可达
            # 构建一个简单的测试请求
            test_url = f"{base_url}/api/v1/books/search"
            
            # 创建测试数据
            test_data = json.dumps({
                "dynasties": ["唐"],
                "domains": ["易学"],
                "limit": 1
            }).encode('utf-8')
            
            # 创建请求
            req = urllib.request.Request(
                test_url,
                data=test_data,
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Dify-Plugin/1.0'
                },
                method='POST'
            )
            
            # 发送请求（超时设置为5秒）
            try:
                with urllib.request.urlopen(req, timeout=5) as response:
                    # 只需要确认服务器响应即可，不需要解析结果
                    pass
            except urllib.error.HTTPError as e:
                # 如果返回400-499错误，说明服务器存在但请求格式可能有问题，这是可以接受的
                if 400 <= e.code < 500:
                    pass
                else:
                    raise ToolProviderCredentialValidationError(f"Server returned error: {e.code}")
            except urllib.error.URLError as e:
                raise ToolProviderCredentialValidationError(f"Cannot connect to server: {str(e)}")
            
        except ToolProviderCredentialValidationError:
            raise
        except Exception as e:
            raise ToolProviderCredentialValidationError(f"Credential validation failed: {str(e)}")