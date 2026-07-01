#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import rospy
import asyncio
import websockets
import uuid
import gzip
import threading
import queue
import time
import pygame
import subprocess
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from pydub import AudioSegment
from pydub.playback import play
import io

from ros_speech_node.srv import TextService, TextServiceResponse

# 火山引擎TTS配置
VOLCANO_CONFIG = {
    "appid": "1268059006",
    "token": "RiFQd9Rkg8yV_uPI8-7nZR9caeYftj5L",
    "cluster": "volcano_tts",
    "host": "openspeech.bytedance.com",
    "api_url": "wss://openspeech.bytedance.com/api/v1/tts/ws_binary"
}

# 文件路径
TTS_FILE_PATH = "/tmp/volcano_tts_{}.mp3"

# 消息类型定义
MESSAGE_TYPES = {11: "audio-only server response", 12: "frontend server response", 15: "error message from server"}
MESSAGE_TYPE_SPECIFIC_FLAGS = {0: "no sequence number", 1: "sequence number > 0",
                               2: "last message from server (seq < 0)", 3: "sequence number < 0"}

# 默认请求头
DEFAULT_HEADER = bytearray(b'\x11\x10\x11\x00')


class VolcanoTTSClient:
    """火山引擎TTS客户端"""
    
    def __init__(self, config):
        self.config = config
        self.voice_mapping = {
            "zh-CN": {
                "male": ["BV700_V2_streaming", "BV701_V2_streaming"],
                "female": ["BV001_V2_streaming", "BV002_V2_streaming"]
            },
            "en-US": {
                "male": ["BV406_V2_streaming"],
                "female": ["BV407_V2_streaming"]
            }
        }
        
    def get_voice_type(self, language, gender):
        """根据语言和性别选择声音类型"""
        lang_key = "zh-CN" if language.upper() == "CN" else "en-US"
        gender_key = gender.lower()
        
        if lang_key in self.voice_mapping and gender_key in self.voice_mapping[lang_key]:
            return self.voice_mapping[lang_key][gender_key][0]
        
        # 默认使用中文女声
        return "BV001_V2_streaming"
    
    def build_request(self, text, voice_type, reqid):
        """构建TTS请求"""
        request_json = {
            "app": {
                "appid": self.config["appid"],
                "token": "access_token",
                "cluster": self.config["cluster"]
            },
            "user": {
                "uid": "ros_tts_user"
            },
            "audio": {
                "voice_type": voice_type,
                "encoding": "mp3",
                "speed_ratio": 1.0,
                "volume_ratio": 1.0,
                "pitch_ratio": 1.0,
            },
            "request": {
                "reqid": reqid,
                "text": text,
                "text_type": "plain",
                "operation": "submit"
            }
        }
        
        # 构建二进制请求
        payload_bytes = str.encode(json.dumps(request_json))
        payload_bytes = gzip.compress(payload_bytes)
        
        full_request = bytearray(DEFAULT_HEADER)
        full_request.extend((len(payload_bytes)).to_bytes(4, 'big'))
        full_request.extend(payload_bytes)
        
        return full_request
    
    def parse_response(self, response, audio_buffer):
        """解析服务器响应，将音频数据写入缓冲区"""
        try:
            header_size = response[0] & 0x0f
            message_type = response[1] >> 4
            message_type_specific_flags = response[1] & 0x0f
            message_compression = response[2] & 0x0f
            payload = response[header_size*4:]
            
            if message_type == 0xb:  # 音频响应
                if message_type_specific_flags == 0:  # no sequence number as ACK
                    return False
                else:
                    sequence_number = int.from_bytes(payload[:4], "big", signed=True)
                    payload_size = int.from_bytes(payload[4:8], "big", signed=False)
                    audio_data = payload[8:]
                    
                    audio_buffer.write(audio_data)
                    
                    return sequence_number < 0  # 负数表示最后一个包
            
            elif message_type == 0xf:  # 错误消息
                code = int.from_bytes(payload[:4], "big", signed=False)
                msg_size = int.from_bytes(payload[4:8], "big", signed=False)
                error_msg = payload[8:]
                
                if message_compression == 1:
                    error_msg = gzip.decompress(error_msg)
                
                error_msg = str(error_msg, "utf-8")
                rospy.logerr(f"TTS Error: code={code}, message={error_msg}")
                return True
            
            return False
        except Exception as e:
            rospy.logerr(f"Error parsing response: {str(e)}")
            return True
    
    async def synthesize(self, text, voice_type):
        """执行TTS合成，返回音频数据"""
        reqid = str(uuid.uuid4())
        request_data = self.build_request(text, voice_type, reqid)
        
        header = {"Authorization": f"Bearer; {self.config['token']}"}
        audio_buffer = io.BytesIO()
        
        try:
            async with websockets.connect(
                self.config['api_url'], 
                extra_headers=header, 
                ping_interval=None
            ) as ws:
                await ws.send(request_data)
                
                while True:
                    response = await ws.recv()
                    done = self.parse_response(response, audio_buffer)
                    if done:
                        break
                
                audio_buffer.seek(0)
                audio_data = audio_buffer.getvalue()
                
                if len(audio_data) > 0:
                    return True, audio_data, ""
                else:
                    return False, None, "No audio data received"
        
        except Exception as e:
            error_msg = f"TTS synthesis failed: {str(e)}"
            rospy.logerr(error_msg)
            return False, None, error_msg


class AudioPlayer:
    """音频播放器"""
    
    def __init__(self):
        # 尝试初始化pygame
        try:
            pygame.mixer.init()
            self.use_pygame = True
            rospy.loginfo("Using pygame for audio playback")
        except:
            self.use_pygame = False
            rospy.loginfo("pygame not available, will try alternative methods")
    
    def play_audio_data(self, audio_data):
        """播放音频数据"""
        try:
            if self.use_pygame:
                # 使用pygame播放
                pygame.mixer.music.load(io.BytesIO(audio_data))
                pygame.mixer.music.play()
                
                # 等待播放完成
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)
                return True
            else:
                # 使用系统命令播放
                # 先保存到临时文件
                temp_file = f"/tmp/temp_audio_{int(time.time())}.mp3"
                with open(temp_file, 'wb') as f:
                    f.write(audio_data)
                
                # 尝试不同的播放命令
                commands = [
                    ['ffplay', '-nodisp', '-autoexit', temp_file],
                    ['play', temp_file],
                    ['aplay', temp_file],
                    ['cvlc', '--play-and-exit', temp_file]
                ]
                
                played = False
                for cmd in commands:
                    try:
                        subprocess.run(cmd, stdout=subprocess.DEVNULL, 
                                     stderr=subprocess.DEVNULL, check=True)
                        played = True
                        break
                    except:
                        continue
                
                # 清理临时文件
                try:
                    os.remove(temp_file)
                except:
                    pass
                
                if not played:
                    rospy.logwarn("No audio player available")
                    return False
                
                return True
                
        except Exception as e:
            rospy.logerr(f"Audio playback failed: {str(e)}")
            return False


class TTSTask:
    """TTS任务"""
    def __init__(self, text, language, gender, task_id=None):
        self.text = text
        self.language = language
        self.gender = gender
        self.task_id = task_id or str(uuid.uuid4())
        self.audio_data = None
        self.error = None
        self.timestamp = time.time()


class VolcanoTTSNode:
    """火山引擎TTS ROS节点"""
    
    def __init__(self):
        rospy.init_node('volcano_tts_node')
        
        # 初始化组件
        self.tts_client = VolcanoTTSClient(VOLCANO_CONFIG)
        self.audio_player = AudioPlayer()
        
        # 初始化队列
        self.generation_queue = queue.Queue()  # 待生成队列
        self.playback_queue = queue.Queue()    # 待播放队列
        
        # 控制标志
        self.running = True
        self.loop_ready = threading.Event()  # 用于同步事件循环就绪状态
        
        # 创建异步事件循环（用于生成线程）
        self.loop = None
        
        # 启动工作线程
        self.generation_thread = threading.Thread(target=self._generation_worker)
        self.generation_thread.daemon = True
        self.generation_thread.start()
        
        # 等待事件循环就绪
        if not self.loop_ready.wait(timeout=5):
            rospy.logerr("Failed to initialize event loop")
            raise RuntimeError("Event loop initialization timeout")
        
        self.playback_thread = threading.Thread(target=self._playback_worker)
        self.playback_thread.daemon = True
        self.playback_thread.start()
        
        # 创建ROS服务
        self.tts_service = rospy.Service(
            '/volcano_tts_node/text_to_speech_service',
            TextService,
            self.handle_tts_request
        )
        
        # 参数
        self.save_files = rospy.get_param('~save_files', False)
        self.auto_play = rospy.get_param('~auto_play', True)
        
        rospy.loginfo("Volcano TTS node started")
        rospy.loginfo(f"Auto play: {self.auto_play}, Save files: {self.save_files}")
    
    def _generation_worker(self):
        """音频生成工作线程"""
        try:
            # 创建并设置事件循环
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)
            
            # 通知主线程事件循环已就绪
            self.loop_ready.set()
            
            while self.running:
                try:
                    # 从生成队列获取任务
                    task = self.generation_queue.get(timeout=1)
                    
                    if task is None:  # 停止信号
                        break
                    
                    rospy.loginfo(f"Generating audio for: {task.text[:30]}...")
                    
                    # 获取声音类型
                    voice_type = self.tts_client.get_voice_type(task.language, task.gender)
                    rospy.logdebug(f"Using voice type: {voice_type}")
                    
                    # 执行TTS合成
                    success, audio_data, error = self.loop.run_until_complete(
                        self.tts_client.synthesize(task.text, voice_type)
                    )
                    
                    if success and audio_data:
                        task.audio_data = audio_data
                        rospy.loginfo(f"Audio generated successfully, size: {len(audio_data)} bytes")
                        
                        # 如果需要保存文件
                        if self.save_files:
                            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                            filepath = TTS_FILE_PATH.format(timestamp)
                            with open(filepath, 'wb') as f:
                                f.write(audio_data)
                            rospy.loginfo(f"Audio saved to: {filepath}")
                        
                        # 如果启用自动播放，加入播放队列
                        if self.auto_play:
                            self.playback_queue.put(task)
                    else:
                        task.error = error
                        rospy.logerr(f"Generation failed: {error}")
                    
                except queue.Empty:
                    continue
                except Exception as e:
                    rospy.logerr(f"Generation worker error: {str(e)}")
                    import traceback
                    rospy.logerr(traceback.format_exc())
        finally:
            if self.loop:
                self.loop.close()
    
    def _playback_worker(self):
        """音频播放工作线程"""
        while self.running:
            try:
                # 从播放队列获取任务
                task = self.playback_queue.get(timeout=1)
                
                if task is None:  # 停止信号
                    break
                
                if task.audio_data:
                    rospy.loginfo(f"Playing audio: {task.text[:30]}...")
                    success = self.audio_player.play_audio_data(task.audio_data)
                    if success:
                        rospy.loginfo("Playback completed")
                    else:
                        rospy.logwarn("Playback failed")
                
            except queue.Empty:
                continue
            except Exception as e:
                rospy.logerr(f"Playback worker error: {str(e)}")
                import traceback
                rospy.logerr(traceback.format_exc())
    
    def handle_tts_request(self, req):
        """处理TTS服务请求"""
        text = req.text
        language = req.language.upper() if hasattr(req, 'language') else "CN"
        gender = req.gender.lower() if hasattr(req, 'gender') else "female"
        
        rospy.loginfo(f"TTS request received: text='{text[:30]}...', language={language}, gender={gender}")
        
        # 创建任务
        task = TTSTask(text, language, gender)
        
        # 加入生成队列
        self.generation_queue.put(task)
        
        # 返回响应（立即返回，不等待生成完成）
        return TextServiceResponse("", f"Task queued: {task.task_id}")
    
    def get_queue_status(self):
        """获取队列状态"""
        return {
            "generation_queue_size": self.generation_queue.qsize(),
            "playback_queue_size": self.playback_queue.qsize()
        }
    
    def shutdown(self):
        """关闭节点"""
        rospy.loginfo("Shutting down Volcano TTS node")
        self.running = False
        
        # 发送停止信号
        self.generation_queue.put(None)
        self.playback_queue.put(None)
        
        # 等待线程结束
        self.generation_thread.join(timeout=5)
        self.playback_thread.join(timeout=5)
        
        # 清理pygame
        if hasattr(self.audio_player, 'use_pygame') and self.audio_player.use_pygame:
            pygame.mixer.quit()


def main():
    try:
        node = VolcanoTTSNode()
        rospy.on_shutdown(node.shutdown)
        
        # 定期打印队列状态
        rate = rospy.Rate(0.2)  # 每5秒一次
        while not rospy.is_shutdown():
            status = node.get_queue_status()
            if status["generation_queue_size"] > 0 or status["playback_queue_size"] > 0:
                rospy.loginfo(f"Queue status - Generation: {status['generation_queue_size']}, "
                            f"Playback: {status['playback_queue_size']}")
            rate.sleep()
            
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"Node error: {str(e)}")
        import traceback
        rospy.logerr(traceback.format_exc())


if __name__ == '__main__':
    main()