from collections.abc import Generator
from typing import Any
import urllib.request
import urllib.parse
import json

from dify_plugin import Tool
from dify_plugin.entities.tool import ToolInvokeMessage


class TextSearchTool(Tool):
    def _invoke(self, tool_parameters: dict[str, Any]) -> Generator[ToolInvokeMessage, None, None]:
        """
        调用文本检索API
        
        Args:
            tool_parameters: 包含title、queries和top_k的参数字典
            
        Yields:
            ToolInvokeMessage: 工具调用结果消息
        """
        try:
            # 获取base_url
            base_url = self.runtime.credentials.get("base_url", "").strip()
            if base_url.endswith("/"):
                base_url = base_url[:-1]
            
            # 获取参数
            title_str = tool_parameters.get("title", "")
            queries_str = tool_parameters.get("queries", "")
            top_k = tool_parameters.get("top_k", 5)
            
            # 验证必需参数
            if not title_str:
                yield self.create_text_message("错误：请提供要检索的书名。")
                return
                
            if not queries_str:
                yield self.create_text_message("错误：请提供检索关键词。")
                return
            
            # 处理书名和查询参数
            titles = [t.strip() for t in title_str.split(",") if t.strip()]
            queries = [q.strip() for q in queries_str.split(",") if q.strip()]
            
            # 构建请求数据
            request_data = {
                "title": titles,
                "queries": queries,
                "top_k": int(top_k)
            }
            
            # 转换为JSON
            json_data = json.dumps(request_data, ensure_ascii=False).encode('utf-8')
            
            # 构建完整的URL
            url = f"{base_url}/api/v1/texts/search"
            
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
                    
                    # 解析结果 - 修复以处理正确的响应格式
                    texts = []
                    if isinstance(result, dict):
                        # 检查标准格式 {"data": {"results": [...]}, "status": "success"}
                        if "data" in result and isinstance(result["data"], dict) and "results" in result["data"]:
                            texts = result["data"]["results"]
                        # 兼容其他可能的格式
                        elif "texts" in result:
                            texts = result["texts"]
                        elif "results" in result:
                            texts = result["results"]
                    elif isinstance(result, list):
                        texts = result
                    
                    # 生成用户友好的文本消息
                    if texts:
                        message = f"找到 {len(texts)} 条相关文本：\n\n"
                        
                        # 按书名分组显示结果
                        texts_by_book = {}
                        for text_item in texts:
                            # 注意：返回的是 "title" 而不是 "book_title"
                            book = text_item.get("title", "未知书名")
                            if book not in texts_by_book:
                                texts_by_book[book] = []
                            texts_by_book[book].append(text_item)
                        
                        # 输出每本书的相关文本
                        for book_title, book_texts in texts_by_book.items():
                            message += f"【{book_title}】\n"
                            message += "-" * 40 + "\n"
                            
                            for i, text_item in enumerate(book_texts, 1):
                                text_content = text_item.get("text", "")
                                
                                # 截取文本显示（如果太长）
                                if len(text_content) > 500:
                                    display_text = text_content[:500] + "..."
                                else:
                                    display_text = text_content
                                
                                message += f"\n[段落 {i}]\n"
                                message += f"{display_text}\n"
                                message += "\n"
                            
                            message += "\n"
                        
                        yield self.create_text_message(message)
                    else:
                        yield self.create_text_message(f'在《{"、".join(titles)}》中未找到与"{", ".join(queries)}"相关的内容。')
                    
                    # 返回JSON格式的结果（调整字段名称以保持一致性）
                    # 将 "title" 映射为 "book_title" 以符合原始设计
                    formatted_texts = []
                    for text in texts:
                        formatted_text = {
                            "text": text.get("text", ""),
                            "book_title": text.get("title", "未知书名"),
                            "chapter": text.get("chapter", ""),  # API未返回，留空
                            "relevance_score": text.get("relevance_score", 0)  # API未返回，默认0
                        }
                        formatted_texts.append(formatted_text)
                    
                    yield self.create_json_message({
                        "texts": formatted_texts,
                        "count": len(texts),
                        "search_params": {
                            "titles": titles,
                            "queries": queries,
                            "top_k": top_k
                        },
                        "status": result.get("status", "unknown")
                    })
                    
                    # 为工作流创建变量
                    if texts:
                        # 提取所有文本内容，供后续处理使用
                        all_texts = [t.get("text", "") for t in texts if t.get("text")]
                        yield self.create_variable_message("retrieved_texts", all_texts)
                    
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                yield self.create_text_message(f"API请求失败 (HTTP {e.code}): {error_body}")
            except urllib.error.URLError as e:
                yield self.create_text_message(f"网络连接错误: {str(e)}")
            except json.JSONDecodeError as e:
                yield self.create_text_message(f"响应解析错误: {str(e)}")
                
        except Exception as e:
            yield self.create_text_message(f"文本检索错误: {str(e)}")