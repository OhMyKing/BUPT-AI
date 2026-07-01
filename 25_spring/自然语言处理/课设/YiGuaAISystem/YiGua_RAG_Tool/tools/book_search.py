from collections.abc import Generator
from typing import Any
import urllib.request
import urllib.parse
import json

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage


class BookSearchTool(Tool):
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage, None, None]:
        """
        调用书目检索API
        
        Args:
            tool_parameters: 包含dynasties、domains和limit的参数字典
            
        Yields:
            ToolInvokeMessage: 工具调用结果消息
        """
        try:
            # 获取base_url
            base_url = self.runtime.credentials.get("base_url", "").strip()
            if base_url.endswith("/"):
                base_url = base_url[:-1]
            
            # 获取参数
            dynasties_str = tool_parameters.get("dynasties", "")
            domains_str = tool_parameters.get("domains", "")
            limit = tool_parameters.get("limit", 10)
            
            # 处理朝代和领域参数
            dynasties = []
            domains = []
            
            if dynasties_str:
                # 分割并清理朝代列表
                dynasties = [d.strip() for d in dynasties_str.split(",") if d.strip()]
            
            if domains_str:
                # 分割并清理领域列表
                domains = [d.strip() for d in domains_str.split(",") if d.strip()]
            
            # 构建请求数据
            request_data = {}
            if dynasties:
                request_data["dynasties"] = dynasties
            if domains:
                request_data["domains"] = domains
            request_data["limit"] = int(limit)
            
            # 转换为JSON
            json_data = json.dumps(request_data, ensure_ascii=False).encode('utf-8')
            
            # 构建完整的URL
            url = f"{base_url}/api/v1/books/search"
            
            # 创建请求
            req = urllib.request.Request(
                url,
                data=json_data,
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Dify-Plugin/1.0'
                },
                method='POST'
            )
            
            # 发送请求
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    # 读取响应
                    response_data = response.read().decode('utf-8')
                    result = json.loads(response_data)
                    
                    # 解析结果 - 修复这里以处理正确的响应格式
                    books = []
                    if isinstance(result, dict):
                        # 检查标准格式 {"data": {"books": [...], "total": n}, "status": "success"}
                        if "data" in result and isinstance(result["data"], dict) and "books" in result["data"]:
                            books = result["data"]["books"]
                        # 兼容其他可能的格式
                        elif "books" in result:
                            books = result["books"]
                    elif isinstance(result, list):
                        books = result
                    
                    # 生成用户友好的文本消息
                    if books:
                        message = f"找到 {len(books)} 本相关书籍：\n\n"
                        for i, book in enumerate(books, 1):
                            title = book.get("title", "未知书名")
                            dynasty = book.get("dynasty", "未知朝代")
                            # 处理domain可能是列表的情况
                            domain = book.get("domain", "未知领域")
                            if isinstance(domain, list):
                                domain = "、".join(domain)
                            author = book.get("author", "未知作者")
                            description = book.get("description", "")
                            
                            message += f"{i}. 《{title}》\n"
                            message += f"   朝代：{dynasty}\n"
                            message += f"   领域：{domain}\n"
                            message += f"   作者：{author}\n"
                            if description:
                                message += f"   简介：{description}\n"
                            message += "\n"
                        
                        yield self.create_text_message(message)
                    else:
                        yield self.create_text_message("未找到符合条件的书籍。")
                    
                    # 返回JSON格式的结果
                    yield self.create_json_message({
                        "books": books,
                        "count": len(books),
                        "status": result.get("status", "unknown")
                    })
                    
                    # 为工作流创建变量
                    if books:
                        # 提取书名列表，供后续text_search使用
                        book_titles = [book.get("title", "") for book in books if book.get("title")]
                        yield self.create_variable_message("book_titles", book_titles)
                    
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                yield self.create_text_message(f"API请求失败 (HTTP {e.code}): {error_body}")
            except urllib.error.URLError as e:
                yield self.create_text_message(f"网络连接错误: {str(e)}")
            except json.JSONDecodeError as e:
                yield self.create_text_message(f"响应解析错误: {str(e)}")
                
        except Exception as e:
            yield self.create_text_message(f"书目检索错误: {str(e)}")