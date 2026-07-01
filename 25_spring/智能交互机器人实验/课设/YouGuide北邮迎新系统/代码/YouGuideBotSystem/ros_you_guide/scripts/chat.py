#!/usr/bin/env python3
"""
语音对话主程序
集成ASR、LLM、TTS（通过ROS节点）和图像获取，实现完整的语音对话流
"""

import asyncio
import threading
import io
import re
import json
import time
import cv2
import base64
from typing import Optional, List, Tuple
import queue

import rospy
from std_msgs.msg import String
from sensor_msgs.msg import Image
from cv_bridge import CvBridge, CvBridgeError
from ros_speech_node.srv import TextService

from clients.llm_client import LLMClient


class StreamingSentenceSplitter:
    """流式分句器 - 改进版，支持段落分隔"""
    
    def __init__(self):
        # 分句标点符号
        self.sentence_delimiters = r'[。！？；!?;]'
        self.buffer = ""
        self.newline_count = 0  # 追踪连续换行符
        
    def process_chunk(self, chunk: str) -> List[str]:
        """
        处理文本块，返回完整的句子列表
        
        Args:
            chunk: 文本片段
            
        Returns:
            完整句子列表
        """
        sentences = []
        
        # 逐字符处理，以便正确处理换行符
        for char in chunk:
            if char == '\n':
                self.newline_count += 1
                # 如果遇到连续的换行符（段落分隔），立即输出缓冲区内容
                if self.newline_count >= 2 and self.buffer.strip():
                    sentences.append(self.buffer.strip())
                    self.buffer = ""
                    self.newline_count = 0
            else:
                # 如果之前有单个换行符，将其作为空格加入
                if self.newline_count == 1:
                    self.buffer += " "
                self.newline_count = 0
                self.buffer += char
                
                # 检查是否是句子结束符
                if re.match(self.sentence_delimiters, char):
                    # 如果是句子结束符，输出当前句子
                    sentence = self.buffer.strip()
                    if sentence:
                        sentences.append(sentence)
                    self.buffer = ""
        
        # 如果缓冲区累积了足够长的内容（比如一个完整的句子但没有标点），也输出
        # 这对于处理没有标点的段落很有用
        if len(self.buffer) > 80 and not any(char in self.buffer for char in '。！？.!?'):
            # 尝试在逗号处分割
            if '，' in self.buffer or ',' in self.buffer:
                parts = re.split(r'[，,]', self.buffer)
                for i, part in enumerate(parts[:-1]):
                    if part.strip():
                        # 保留逗号
                        delimiter = '，' if '，' in self.buffer else ','
                        sentences.append(part.strip() + delimiter)
                self.buffer = parts[-1]
                
        return sentences
        
    def flush(self) -> Optional[str]:
        """清空缓冲区，返回剩余内容"""
        if self.buffer.strip():
            result = self.buffer.strip()
            self.buffer = ""
            self.newline_count = 0
            return result
        return None


class ASRListener:
    """ASR监听器"""
    
    def __init__(self):
        self.final_text_queue = queue.Queue()
        self.current_session_id = None
        self.waiting_for_result = False
        
        # 订阅ASR话题
        rospy.Subscriber('/asr/final_result', String, self.final_callback)
        rospy.Subscriber('/asr/session', String, self.session_callback)
        
        rospy.loginfo("ASR监听器已初始化")
    
    def final_callback(self, msg):
        """处理最终识别结果"""
        try:
            data = json.loads(msg.data)
            final_text = data.get('text', '')
            
            if final_text and self.waiting_for_result:
                rospy.loginfo(f"收到ASR最终结果: {final_text}")
                self.final_text_queue.put(final_text)
                self.waiting_for_result = False
                
        except Exception as e:
            rospy.logerr(f"处理ASR最终结果时出错: {e}")
    
    def session_callback(self, msg):
        """处理会话状态消息"""
        try:
            data = json.loads(msg.data)
            session_type = data.get('type', '')
            
            if session_type == 'session_start':
                self.current_session_id = data.get('session_id', '')
                rospy.loginfo(f"ASR会话开始: {self.current_session_id}")
            elif session_type == 'session_end':
                rospy.loginfo(f"ASR会话结束: {data.get('session_id', '')}")
                
        except Exception as e:
            rospy.logerr(f"处理ASR会话消息时出错: {e}")
    
    def wait_for_speech(self, timeout=30):
        """等待语音输入"""
        self.waiting_for_result = True
        try:
            # 等待最终结果
            final_text = self.final_text_queue.get(timeout=timeout)
            return final_text
        except queue.Empty:
            self.waiting_for_result = False
            return None


class ImageCapture:
    """图像捕获器"""
    
    def __init__(self):
        self.bridge = CvBridge()
        self.latest_image = None
        self.image_lock = threading.Lock()
        
        # 订阅相机话题
        rospy.Subscriber("/camera/color/image_raw", Image, self.image_callback)
        
        rospy.loginfo("图像捕获器已初始化")
    
    def image_callback(self, msg):
        """图像回调函数"""
        try:
            cv2_img = self.bridge.imgmsg_to_cv2(msg, "bgr8")
            with self.image_lock:
                self.latest_image = cv2_img
        except CvBridgeError as e:
            rospy.logerr(f"图像转换错误: {e}")
    
    def get_current_image(self):
        """获取当前图像"""
        with self.image_lock:
            if self.latest_image is not None:
                return self.latest_image.copy()
        return None
    
    def save_image_to_file(self, image, filename="captured_image.jpg"):
        """保存图像到文件"""
        if image is not None:
            cv2.imwrite(filename, image)
            return filename
        return None


class VoiceAssistant:
    """语音助手主类 - 使用ROS TTS节点"""
    
    def __init__(self, llm_api_url: str, llm_api_key: str):
        # 初始化ROS节点
        rospy.init_node('voice_assistant', anonymous=True)
        
        # 初始化LLM客户端
        self.llm_client = LLMClient(llm_api_key, llm_api_url)
        
        # 初始化ASR监听器和图像捕获器
        self.asr_listener = ASRListener()
        self.image_capture = ImageCapture()
        
        # 等待TTS服务可用
        self.tts_service_name = '/volcano_tts_node/text_to_speech_service'
        rospy.loginfo(f"等待TTS服务: {self.tts_service_name}")
        rospy.wait_for_service(self.tts_service_name)
        
        # 创建TTS服务客户端
        self.tts_service = rospy.ServiceProxy(self.tts_service_name, TextService)
        rospy.loginfo("TTS服务已连接")
        
        # 使用异步队列存储待合成的句子
        self.text_queue = asyncio.Queue()
        
        # 控制标志
        self.is_running = False
        self.llm_done = False
        self.tts_done = False
        
        # 调试模式
        self.debug_mode = True
        
        # 默认TTS参数
        self.default_language = "CN"
        self.default_gender = "female"
        
        # 等待初始化完成
        rospy.sleep(1.0)
        
    def call_tts_service(self, text: str, language: str = None, gender: str = None):
        """调用ROS TTS服务"""
        if language is None:
            language = self.default_language
        if gender is None:
            gender = self.default_gender
            
        try:
            response = self.tts_service(
                text=text,
                language=language,
                gender=gender
            )
            if self.debug_mode:
                print(f"[DEBUG] TTS服务响应: {response.filepath}")
            return True
        except rospy.ServiceException as e:
            rospy.logerr(f"TTS服务调用失败: {e}")
            return False
        
    async def process_llm_stream(self, query: str, image_path: Optional[str] = None, 
                                image_url: Optional[str] = None):
        """处理LLM流式响应并分句"""
        splitter = StreamingSentenceSplitter()
        
        try:
            # 流式获取LLM响应
            for chunk in self.llm_client.stream_chat(query, image_path, image_url):
                # 打印原始输出
                print(chunk, end='', flush=True)
                
                # 分句处理
                sentences = splitter.process_chunk(chunk)
                for sentence in sentences:
                    if sentence.strip():
                        if self.debug_mode:
                            print(f"\n[DEBUG] 分句输出: '{sentence}'")
                        await self.text_queue.put(sentence)
                        # 添加短暂延迟，让TTS任务有机会处理
                        await asyncio.sleep(0.001)
                        
            # 处理剩余内容
            remaining = splitter.flush()
            if remaining:
                if self.debug_mode:
                    print(f"\n[DEBUG] 最后分句: '{remaining}'")
                await self.text_queue.put(remaining)
                
        except Exception as e:
            print(f"\nLLM错误: {e}")
        finally:
            self.llm_done = True
            await self.text_queue.put(None)  # 发送结束信号
            
    async def process_tts_stream(self):
        """处理TTS流式合成 - 使用ROS服务"""
        sentence_count = 0
        try:
            while True:
                # 从队列获取句子
                try:
                    sentence = await asyncio.wait_for(self.text_queue.get(), timeout=0.1)
                except asyncio.TimeoutError:
                    # 如果LLM还在运行，继续等待
                    if not self.llm_done:
                        continue
                    else:
                        break
                    
                if sentence is None:  # 结束信号
                    break
                    
                sentence_count += 1
                if self.debug_mode:
                    print(f"\n[DEBUG] 发送第{sentence_count}句到TTS节点: '{sentence[:30]}...'")
                    
                # 调用TTS服务（在异步执行器中运行同步调用）
                loop = asyncio.get_event_loop()
                success = await loop.run_in_executor(
                    None, 
                    self.call_tts_service, 
                    sentence
                )
                
                if success and self.debug_mode:
                    print(f"[DEBUG] TTS任务已加入队列（第{sentence_count}句）")
                    
        finally:
            self.tts_done = True
            if self.debug_mode:
                print(f"\n[DEBUG] 共发送了{sentence_count}个句子到TTS节点")
                
    async def process_query(self, user_input: str, captured_image_path: Optional[str] = None):
        """处理用户查询"""
        # 解析输入
        message, image_path, image_url = self.llm_client.parse_message_with_image(user_input)
        
        # 如果有捕获的图像，使用捕获的图像路径
        if captured_image_path and not image_path and not image_url:
            image_path = captured_image_path
            print(f"[使用捕获的图像: {image_path}]")
        
        print("\nAI: ", end='', flush=True)
        
        # 重置状态
        self.is_running = True
        self.llm_done = False
        self.tts_done = False
        
        # 清空队列
        while not self.text_queue.empty():
            try:
                self.text_queue.get_nowait()
            except asyncio.QueueEmpty:
                break
            
        # 创建并发任务 - 只需要LLM和TTS两个任务
        tasks = await asyncio.gather(
            self.process_llm_stream(message, image_path, image_url),
            self.process_tts_stream(),
            return_exceptions=True
        )
        
        # 检查是否有异常
        for i, result in enumerate(tasks):
            if isinstance(result, Exception):
                print(f"\n任务{i}出现异常: {result}")
        
        print("\n")  # 换行
        
        # 给TTS节点一些时间完成播放
        if self.debug_mode:
            print("[DEBUG] 等待TTS节点完成音频播放...")
        await asyncio.sleep(2.0)  # 可以根据需要调整
        
    async def wait_for_voice_input(self):
        """等待语音输入"""
        print("\n[等待语音输入...]", end='', flush=True)
        
        # 等待ASR结果
        final_text = await asyncio.get_event_loop().run_in_executor(
            None, self.asr_listener.wait_for_speech, 30
        )
        
        if final_text:
            print(f"\r您说: {final_text}")
            
            # 在收到最终文本时立即捕获图像
            current_image = self.image_capture.get_current_image()
            image_path = None
            
            if current_image is not None:
                # 保存图像
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                image_path = f"/tmp/captured_{timestamp}.jpg"
                self.image_capture.save_image_to_file(current_image, image_path)
                print(f"[已捕获图像: {image_path}]")
            
            return final_text, image_path
        else:
            print("\r[语音输入超时]")
            return None, None
    
    def set_tts_params(self, language: str = None, gender: str = None):
        """设置TTS默认参数"""
        if language:
            self.default_language = language
        if gender:
            self.default_gender = gender
        print(f"TTS参数已更新: 语言={self.default_language}, 性别={self.default_gender}")


async def main():
    """主函数"""
    print("=== 语音对话助手 (ROS TTS版) ===")
    print("\n功能说明:")
    print("  - 通过语音输入进行对话")
    print("  - 自动捕获当前图像")
    print("  - 使用ROS TTS节点进行语音合成和播放")
    print("\n命令说明:")
    print("  /new     - 开始新会话")
    print("  /exit    - 退出程序")
    print("  /help    - 显示帮助")
    print("  /debug   - 切换调试模式")
    print("  /manual  - 切换到手动输入模式")
    print("  /voice   - 设置语音参数 (例: /voice CN male)")
    print("=" * 50)
    
    # 配置参数
    LLM_API_URL = "http://192.168.3.218:5001/v1"
    LLM_API_KEY = "app-vAbeBcF9tedUdMeyLHIrvWc7"
    
    # 创建助手实例
    assistant = VoiceAssistant(LLM_API_URL, LLM_API_KEY)
    
    print("\n开始对话...\n")
    
    manual_mode = False  # 手动输入模式标志
    
    try:
        while True:
            if manual_mode:
                # 手动输入模式
                user_input = input("您(手动): ").strip()
                
                if not user_input:
                    continue
                    
                # 处理命令
                if user_input.lower() in ['/exit', '/quit']:
                    print("再见！")
                    break
                elif user_input.lower() == '/new':
                    assistant.llm_client.clear_conversation()
                    print("会话已清除")
                    continue
                elif user_input.lower() == '/debug':
                    assistant.debug_mode = not assistant.debug_mode
                    print(f"调试模式: {'开启' if assistant.debug_mode else '关闭'}")
                    continue
                elif user_input.lower() == '/manual':
                    manual_mode = False
                    print("已切换到语音输入模式")
                    continue
                elif user_input.lower().startswith('/voice'):
                    # 解析语音参数
                    parts = user_input.split()
                    if len(parts) >= 2:
                        language = parts[1].upper()
                        gender = parts[2].lower() if len(parts) >= 3 else None
                        assistant.set_tts_params(language, gender)
                    else:
                        print("用法: /voice <语言> [性别]")
                        print("语言: CN, EN")
                        print("性别: male, female")
                    continue
                elif user_input.lower() == '/help':
                    print("\n--- 帮助信息 ---")
                    print("在手动模式下，直接输入文本")
                    print("支持添加图片：消息 +img:图片路径或URL")
                    print("使用 /manual 切换回语音输入模式")
                    print("使用 /voice 设置TTS参数")
                    print("---------------\n")
                    continue
                    
                # 处理查询
                await assistant.process_query(user_input)
                
            else:
                # 语音输入模式
                print("\n按下 Ctrl+C 进入命令模式，或等待语音输入...")
                
                try:
                    # 等待语音输入
                    final_text, image_path = await assistant.wait_for_voice_input()
                    
                    if final_text:
                        # 处理语音查询
                        await assistant.process_query(final_text, image_path)
                    else:
                        print("未检测到语音输入，请重试")
                        
                except KeyboardInterrupt:
                    # 捕获Ctrl+C，进入命令输入
                    print("\n\n进入命令模式 (输入 /help 查看命令)")
                    command = input("命令: ").strip()
                    
                    if command.lower() in ['/exit', '/quit']:
                        print("再见！")
                        break
                    elif command.lower() == '/new':
                        assistant.llm_client.clear_conversation()
                        print("会话已清除")
                    elif command.lower() == '/debug':
                        assistant.debug_mode = not assistant.debug_mode
                        print(f"调试模式: {'开启' if assistant.debug_mode else '关闭'}")
                    elif command.lower() == '/manual':
                        manual_mode = True
                        print("已切换到手动输入模式")
                    elif command.lower().startswith('/voice'):
                        # 解析语音参数
                        parts = command.split()
                        if len(parts) >= 2:
                            language = parts[1].upper()
                            gender = parts[2].lower() if len(parts) >= 3 else None
                            assistant.set_tts_params(language, gender)
                        else:
                            print("用法: /voice <语言> [性别]")
                            print("语言: CN, EN")
                            print("性别: male, female")
                    elif command.lower() == '/help':
                        print("\n--- 帮助信息 ---")
                        print("语音模式下会自动监听语音输入")
                        print("说话结束后会自动识别并处理")
                        print("识别时会自动捕获当前图像")
                        print("使用 /manual 切换到手动输入模式")
                        print("使用 /voice 设置TTS参数")
                        print("---------------\n")
                    else:
                        print("未知命令，输入 /help 查看帮助")
                        
    except Exception as e:
        print(f"\n发生错误: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if not rospy.is_shutdown():
            rospy.signal_shutdown("程序退出")


if __name__ == "__main__":
    # 运行异步主函数
    asyncio.run(main())