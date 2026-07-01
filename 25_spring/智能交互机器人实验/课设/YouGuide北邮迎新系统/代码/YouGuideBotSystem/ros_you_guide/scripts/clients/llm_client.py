#!/usr/bin/env python3
"""
LLM客户端封装
提供流式对话和图像处理功能
"""

import json
import requests
import os
from typing import Optional, Dict, Any, Generator, Tuple
import sseclient


class LLMClient:
    def __init__(self, api_key: str, api_url: str = "https://api.dify.ai/v1"):
        """
        初始化LLM客户端
        
        Args:
            api_key: Dify API密钥
            api_url: API基础URL
        """
        self.api_key = api_key
        self.api_url = api_url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        self.conversation_id: Optional[str] = None
        self.user_id = "default-user"
        
    def upload_image(self, image_path: str) -> Optional[str]:
        """上传图像文件"""
        url = f"{self.api_url}/files/upload"
        
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"文件不存在: {image_path}")
            
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        
        file_ext = os.path.splitext(image_path)[1].lower()
        if file_ext not in mime_types:
            raise ValueError(f"不支持的文件格式: {file_ext}")
            
        with open(image_path, 'rb') as f:
            files = {
                'file': (
                    os.path.basename(image_path), 
                    f, 
                    mime_types[file_ext]
                )
            }
            data = {'user': self.user_id}
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            response = requests.post(
                url,
                headers=headers,
                files=files,
                data=data,
                timeout=60
            )
            
        if response.status_code in [200, 201]:
            result = response.json()
            return result.get('id')
        else:
            raise Exception(f"上传失败: {response.status_code} - {response.text}")
            
    def stream_chat(self, query: str, image_path: Optional[str] = None, 
                image_url: Optional[str] = None) -> Generator[str, None, None]:
        """
        流式聊天接口
        
        Args:
            query: 用户问题
            image_path: 本地图片路径
            image_url: 远程图片URL
            
        Yields:
            响应文本片段
        """
        url = f"{self.api_url}/chat-messages"
        
        payload = {
            "query": query,
            "response_mode": "streaming",
            "user": self.user_id,
            "inputs": {},
        }
        
        if self.conversation_id:
            payload["conversation_id"] = self.conversation_id
            
        # 处理图片
        files = []
        if image_path:
            file_id = self.upload_image(image_path)
            files.append({
                "type": "image",
                "transfer_method": "local_file",
                "upload_file_id": file_id
            })
        elif image_url:
            files.append({
                "type": "image",
                "transfer_method": "remote_url",
                "url": image_url
            })
            
        if files:
            payload["files"] = files
            
        response = requests.post(
            url, 
            headers=self.headers, 
            json=payload,
            stream=True,
            timeout=100
        )
        
        if response.status_code != 200:
            raise Exception(f"API错误: {response.status_code} - {response.text}")
            
        try:
            client = sseclient.SSEClient(response)
            
            for event in client.events():
                if not event.data or event.data.strip() == "":
                    continue
                    
                try:
                    # 尝试解析JSON数据
                    data = json.loads(event.data)
                    event_type = data.get("event")
                    
                    # 处理文本回复事件
                    if event_type in ["message", "agent_message"]:
                        answer = data.get("answer", "")
                        if answer:
                            yield answer
                            
                        # 保存会话ID
                        if not self.conversation_id and data.get("conversation_id"):
                            self.conversation_id = data["conversation_id"]
                    
                    # 处理Agent思考事件（工具调用等） - 直接忽略
                    elif event_type == "agent_thought":
                        # 静默忽略工具调用事件
                        pass
                        
                    # 处理消息结束事件
                    elif event_type == "message_end":
                        # 保存会话ID和元数据
                        if not self.conversation_id and data.get("conversation_id"):
                            self.conversation_id = data["conversation_id"]
                        # 消息结束，可以选择是否输出调试信息
                        # print(f"\n[DEBUG] 消息结束，使用量: {data.get('metadata', {}).get('usage', {})}")
                        
                    # 处理文件事件 - 忽略
                    elif event_type == "message_file":
                        pass
                        
                    # 处理TTS事件 - 忽略
                    elif event_type in ["tts_message", "tts_message_end"]:
                        pass
                        
                    # 处理消息替换事件
                    elif event_type == "message_replace":
                        answer = data.get("answer", "")
                        if answer:
                            yield answer
                            
                    # 处理错误事件
                    elif event_type == "error":
                        error_msg = data.get("message", "未知错误")
                        error_code = data.get("code", "unknown")
                        raise Exception(f"API错误[{error_code}]: {error_msg}")
                        
                    # 处理心跳事件 - 忽略
                    elif event_type == "ping":
                        pass
                        
                    # 处理未知事件类型 - 忽略并记录
                    else:
                        # 可选：输出调试信息
                        # print(f"\n[DEBUG] 忽略未知事件类型: {event_type}")
                        pass
                        
                except json.JSONDecodeError as e:
                    # JSON解析失败，可能是非JSON数据，直接忽略
                    # 可选：输出调试信息
                    # print(f"\n[DEBUG] JSON解析失败，忽略: {event.data[:100]}...")
                    continue
                except KeyError as e:
                    # 缺少预期的键，忽略这个事件
                    # print(f"\n[DEBUG] 事件缺少预期字段: {e}")
                    continue
                except Exception as e:
                    # 其他解析错误，记录但不中断流程
                    print(f"\n[WARNING] 事件处理错误: {e}")
                    continue
                    
        except Exception as e:
            # SSE客户端创建或连接错误
            if "Failed to parse" in str(e):
                # 这可能是sseclient库的问题，尝试直接解析响应
                print(f"\n[DEBUG] SSE解析失败，尝试备用方案: {e}")
                yield from self._fallback_stream_parse(response)
            else:
                raise Exception(f"流式连接错误: {e}")

    def _fallback_stream_parse(self, response) -> Generator[str, None, None]:
        """
        备用的流式解析方法，当SSE客户端失败时使用
        """
        try:
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith('data: '):
                    data_str = line[6:]  # 移除 'data: ' 前缀
                    if data_str.strip():
                        try:
                            data = json.loads(data_str)
                            event_type = data.get("event")
                            
                            if event_type in ["message", "agent_message"]:
                                answer = data.get("answer", "")
                                if answer:
                                    yield answer
                                    
                            elif event_type == "error":
                                error_msg = data.get("message", "未知错误")
                                raise Exception(f"API错误: {error_msg}")
                                
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            print(f"\n[ERROR] 备用解析也失败: {e}")
            raise

    def clear_conversation(self):
        """清除当前会话"""
        self.conversation_id = None
        
    def parse_message_with_image(self, user_input: str) -> Tuple[str, Optional[str], Optional[str]]:
        """
        解析用户输入，提取消息和图片信息
        
        Returns:
            (消息内容, 本地图片路径, 远程图片URL)
        """
        image_markers = ['+image:', '+img:', '+图片:']
        
        message = user_input
        image_path = None
        image_url = None
        
        for marker in image_markers:
            if marker in user_input.lower():
                idx = user_input.lower().find(marker)
                message = user_input[:idx].strip()
                image_info = user_input[idx + len(marker):].strip()
                
                if image_info.startswith(('http://', 'https://')):
                    image_url = image_info
                else:
                    image_path = image_info.strip('"\'')
                    if image_path.startswith('~'):
                        image_path = os.path.expanduser(image_path)
                        
                break
                
        return message, image_path, image_url