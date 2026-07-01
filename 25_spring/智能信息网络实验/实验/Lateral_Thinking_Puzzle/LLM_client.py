import anthropic
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from zhipuai import ZhipuAI
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# LLM提供者抽象基类
class LLMProvider(ABC):
    """抽象基类，定义LLM提供者的通用接口"""
    
    @abstractmethod
    def initialize(self):
        """初始化LLM服务连接"""
        pass
    
    @abstractmethod
    def ask_question(self, system_prompt: str, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        向LLM发送问题并获取回答
        
        Args:
            system_prompt: 系统提示
            question: 用户问题
            conversation_history: 可选的对话历史记录
            
        Returns:
            str: LLM的回答
        """
        pass

# Anthropic LLM提供者实现
class AnthropicProvider(LLMProvider):
    """使用Anthropic API的LLM提供者实现"""
    
    def __init__(self, api_key: str, model: str = "claude-3-7-sonnet-20250219", max_tokens: int = 100):
        """
        初始化Anthropic提供者
        
        Args:
            api_key: Anthropic API密钥
            model: 使用的模型名称
            max_tokens: 生成响应的最大令牌数
        """
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.client = None
    
    def initialize(self):
        """初始化Anthropic客户端"""
        self.client = anthropic.Anthropic(api_key=self.api_key)
    
    def ask_question(self, system_prompt: str, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """使用Anthropic API发送问题并获取回答"""
        if not self.client:
            self.initialize()
        
        # 构建消息列表    
        if conversation_history:
            # 如果提供了对话历史，使用它
            messages = conversation_history
        else:
            # 否则只包含当前问题
            messages = [{"role": "user", "content": question}]
        
        # 如果最后一条消息不是当前问题，添加它
        if not messages or messages[-1]["content"] != question:
            messages.append({"role": "user", "content": question})
            
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=messages
            )
            return message.content[0].text
        except Exception as e:
            print(f"Anthropic API调用错误: {e}")
            print(f"问题: {question}")
            print(f"对话历史: {messages}")
            return "API错误"

# OpenAI LLM提供者实现
class OpenAIProvider(LLMProvider):
    """使用OpenAI API的LLM提供者实现"""
    
    def __init__(self, api_key: str, model: str = "gpt-4o", max_tokens: int = 100):
        """
        初始化OpenAI提供者
        
        Args:
            api_key: OpenAI API密钥
            model: 使用的模型名称
            max_tokens: 生成响应的最大令牌数
        """
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.client = None
    
    def initialize(self):
        """初始化OpenAI客户端"""
        import openai
        self.client = openai.OpenAI(api_key=self.api_key)
    
    def ask_question(self, system_prompt: str, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """使用OpenAI API发送问题并获取回答"""
        if not self.client:
            self.initialize()
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # 添加对话历史（如果提供）
        if conversation_history:
            messages.extend(conversation_history)
        else:
            messages.append({"role": "user", "content": question})
        
        # 如果最后一条消息不是当前问题，添加它
        if messages[-1]["role"] != "user" or messages[-1]["content"] != question:
            messages.append({"role": "user", "content": question})
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API调用错误: {e}")
            print(f"问题: {question}")
            print(f"对话历史: {messages}")
            return "API错误"
        
class ChatGLM4Provider(LLMProvider):
    """使用智谱AI ChatGLM4的LLM提供者实现"""
    
    def __init__(self, api_key: str, model: str = "glm-4-plus", max_tokens: int = 100):
        """
        初始化ChatGLM4提供者
        
        Args:
            api_key: 智谱AI API密钥
            model: 使用的模型名称
            max_tokens: 生成响应的最大令牌数
        """
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.client = None
    
    def initialize(self):
        """初始化智谱AI客户端"""
        self.client = ZhipuAI(api_key=self.api_key)
    
    def ask_question(self, system_prompt: str, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """使用智谱AI API发送问题并获取回答"""
        if not self.client:
            self.initialize()
        
        # 构建消息列表
        messages = []
        
        # 添加系统提示（如果存在）
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # 添加对话历史（如果存在）
        if conversation_history:
            messages.extend(conversation_history)
        
        # 添加当前问题
        messages.append({"role": "user", "content": question})
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"ChatGLM4 API调用错误: {e}")
            print(f"问题: {question}")
            print(f"消息列表: {messages}")
            return "API错误"
    
class Qwen25LocalProvider(LLMProvider):
    """使用本地Qwen2.5模型的LLM提供者实现"""
    
    def __init__(self, model_name: str = "Qwen/Qwen2.5-1.5B-Instruct", max_tokens: int = 100):
        """
        初始化Qwen2.5本地提供者
        
        Args:
            model_name: 使用的模型名称，默认为"Qwen/Qwen2.5-1.5B-Instruct"
            max_tokens: 生成响应的最大令牌数
        """
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.model = None
        self.tokenizer = None
    
    def initialize(self):
        """初始化Qwen2.5模型和tokenizer"""
        try:
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype="auto",
                device_map="auto"
            )
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            print(f"成功加载Qwen2.5模型: {self.model_name}")
        except Exception as e:
            print(f"初始化Qwen2.5模型时出错: {e}")
            raise
    
    def ask_question(self, system_prompt: str, question: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """使用本地Qwen2.5模型生成回答"""
        if not self.model or not self.tokenizer:
            self.initialize()
        
        # 构建消息列表
        if conversation_history:
            messages = conversation_history.copy()
        else:
            messages = []
        
        # 添加系统提示（如果尚未添加）
        if system_prompt and (not messages or messages[0].get("role") != "system"):
            messages.insert(0, {"role": "system", "content": system_prompt})
        
        # 添加当前问题（如果尚未添加）
        if not messages or messages[-1]["role"] != "user" or messages[-1]["content"] != question:
            messages.append({"role": "user", "content": question})
        
        try:
            # 应用聊天模板
            text = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            
            # 转换为模型输入
            model_inputs = self.tokenizer([text], return_tensors="pt").to(self.model.device)
            
            # 生成回答
            generated_ids = self.model.generate(
                **model_inputs,
                max_new_tokens=self.max_tokens
            )
            
            # 提取生成的文本
            generated_ids = [
                output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
            ]
            
            # 解码生成的文本
            response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            return response
        except Exception as e:
            print(f"Qwen2.5本地模型生成错误: {e}")
            print(f"问题: {question}")
            print(f"消息列表: {messages}")
            return f"模型生成错误: {str(e)}"

# 工厂类，简化提供者的创建
class LLMProviderFactory:
    """LLM提供者工厂，简化不同LLM提供者的创建"""
    
    @staticmethod
    def create_chatglm4_provider(api_key: str, model: str = "glm-4-plus", max_tokens: int = 100) -> LLMProvider:
        """创建ChatGLM4提供者实例"""
        from zhipuai import ZhipuAI
        return ChatGLM4Provider(api_key, model, max_tokens)
    
    @staticmethod
    def create_anthropic_provider(api_key: str, model: str = "claude-3-7-sonnet-20250219", max_tokens: int = 100) -> LLMProvider:
        """创建Anthropic提供者实例"""
        import anthropic
        return AnthropicProvider(api_key, model, max_tokens)
    
    @staticmethod
    def create_openai_provider(api_key: str, model: str = "gpt-4", max_tokens: int = 100) -> LLMProvider:
        """创建OpenAI提供者实例"""
        import openai
        return OpenAIProvider(api_key, model, max_tokens)
    
    @staticmethod
    def create_qwen25_local_provider(model_name: str = "Qwen/Qwen2.5-1.5B-Instruct", max_tokens: int = 100) -> LLMProvider:
        """创建本地Qwen2.5提供者实例"""
        return Qwen25LocalProvider(model_name, max_tokens)