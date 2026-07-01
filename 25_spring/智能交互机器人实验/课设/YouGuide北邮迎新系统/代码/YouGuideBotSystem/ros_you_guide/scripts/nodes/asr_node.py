#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Robot Realtime ASR Node
实时语音识别ROS节点 - 唤醒后启动ASR服务并发布识别结果
"""

import os
import rospy
import asyncio
import threading
import queue
import gzip
import json
import time
import uuid
import numpy as np
import random  # 添加random模块
from datetime import datetime
from collections import deque
from std_msgs.msg import String, UInt8MultiArray
import websockets

# 导入TTS服务
from ros_speech_node.srv import TextService

# ASR Protocol Constants
PROTOCOL_VERSION = 0b0001
DEFAULT_HEADER_SIZE = 0b0001

# Message Type:
FULL_CLIENT_REQUEST = 0b0001
AUDIO_ONLY_REQUEST = 0b0010
FULL_SERVER_RESPONSE = 0b1001
SERVER_ACK = 0b1011
SERVER_ERROR_RESPONSE = 0b1111

# Message Type Specific Flags
NO_SEQUENCE = 0b0000
POS_SEQUENCE = 0b0001
NEG_SEQUENCE = 0b0010
NEG_WITH_SEQUENCE = 0b0011

# Message Serialization
NO_SERIALIZATION = 0b0000
JSON = 0b0001

# Message Compression
NO_COMPRESSION = 0b0000
GZIP = 0b0001


class AsrProtocol:
    """ASR协议处理类"""
    
    @staticmethod
    def generate_header(
            message_type=FULL_CLIENT_REQUEST,
            message_type_specific_flags=NO_SEQUENCE,
            serial_method=JSON,
            compression_type=GZIP,
            reserved_data=0x00
    ):
        """生成消息头"""
        header = bytearray()
        header_size = 1
        header.append((PROTOCOL_VERSION << 4) | header_size)
        header.append((message_type << 4) | message_type_specific_flags)
        header.append((serial_method << 4) | compression_type)
        header.append(reserved_data)
        return header
    
    @staticmethod
    def generate_before_payload(sequence: int):
        """生成payload前的序列号"""
        before_payload = bytearray()
        before_payload.extend(sequence.to_bytes(4, 'big', signed=True))
        return before_payload
    
    @staticmethod
    def parse_response(res):
        """解析服务器响应"""
        protocol_version = res[0] >> 4
        header_size = res[0] & 0x0f
        message_type = res[1] >> 4
        message_type_specific_flags = res[1] & 0x0f
        serialization_method = res[2] >> 4
        message_compression = res[2] & 0x0f
        reserved = res[3]
        header_extensions = res[4:header_size * 4]
        payload = res[header_size * 4:]
        
        result = {
            'is_last_package': False,
        }
        
        payload_msg = None
        payload_size = 0
        
        if message_type_specific_flags & 0x01:
            seq = int.from_bytes(payload[:4], "big", signed=True)
            result['payload_sequence'] = seq
            payload = payload[4:]
        
        if message_type_specific_flags & 0x02:
            result['is_last_package'] = True
        
        if message_type == FULL_SERVER_RESPONSE:
            payload_size = int.from_bytes(payload[:4], "big", signed=True)
            payload_msg = payload[4:]
        elif message_type == SERVER_ACK:
            seq = int.from_bytes(payload[:4], "big", signed=True)
            result['seq'] = seq
            if len(payload) >= 8:
                payload_size = int.from_bytes(payload[4:8], "big", signed=False)
                payload_msg = payload[8:]
        elif message_type == SERVER_ERROR_RESPONSE:
            code = int.from_bytes(payload[:4], "big", signed=False)
            result['code'] = code
            payload_size = int.from_bytes(payload[4:8], "big", signed=False)
            payload_msg = payload[8:]
        
        if payload_msg is None:
            return result
        
        if message_compression == GZIP:
            payload_msg = gzip.decompress(payload_msg)
        
        if serialization_method == JSON:
            payload_msg = json.loads(str(payload_msg, "utf-8"))
        elif serialization_method != NO_SERIALIZATION:
            payload_msg = str(payload_msg, "utf-8")
        
        result['payload_msg'] = payload_msg
        result['payload_size'] = payload_size
        return result


class VoiceActivityDetector:
    """语音活动检测器"""
    
    def __init__(self, sample_rate=16000, frame_length=0.02, energy_threshold=0.01, silence_duration=3.0):
        self.sample_rate = sample_rate
        self.frame_length = frame_length
        self.frame_size = int(sample_rate * frame_length)
        self.energy_threshold = energy_threshold
        self.silence_duration = silence_duration
        self.silence_frames = int(silence_duration / frame_length)
        
        self.recent_frames = deque(maxlen=self.silence_frames)
        self.is_speaking = False
        self.has_spoken = False  # 标记是否已经检测到过语音
    
    def add_audio_data(self, audio_data):
        """添加音频数据并检测语音活动"""
        if len(audio_data) >= 2:
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
        else:
            return self.is_speaking
        
        if len(audio_array) > 0:
            energy = np.mean(np.abs(audio_array.astype(np.float32))) / 32768.0
            has_voice = energy > self.energy_threshold
            self.recent_frames.append(has_voice)
            
            if has_voice:
                self.is_speaking = True
                self.has_spoken = True
            elif len(self.recent_frames) == self.silence_frames:
                # 只有在检测到过语音后，才考虑结束
                if self.has_spoken and not any(self.recent_frames):
                    self.is_speaking = False
        
        return self.is_speaking
    
    def reset(self):
        """重置VAD状态"""
        self.recent_frames.clear()
        self.is_speaking = False
        self.has_spoken = False


class RealtimeAsrService:
    """实时ASR服务"""
    
    def __init__(self, asr_result_callback, session_end_callback, debug_mode=False):
        self.ws_url = "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel"
        self.uid = "robot_asr"
        self.rate = 16000
        self.bits = 16
        self.channel = 1
        self.format = "pcm"
        self.codec = "raw"
        
        self.asr_result_callback = asr_result_callback
        self.session_end_callback = session_end_callback
        self.debug_mode = debug_mode
        self.audio_queue = queue.Queue()
        self.is_running = False
        self.websocket = None
        self.seq = 1
        self.reqid = None
        
        # 音频分片参数
        self.segment_duration_ms = 100  # 每100ms发送一次
        self.segment_size = int(self.rate * 2 * self.channel * self.segment_duration_ms / 1000)
        
        # 异步事件循环
        self.loop = None
        self.loop_thread = None
        self.audio_buffer = bytearray()
        
        # 用于去重的变量
        self.last_result_text = ""
        self.last_result_time = 0
        self.min_result_interval = 0.1  # 最小结果间隔（秒）
        
    def construct_request(self):
        """构建ASR请求参数"""
        req = {
            "user": {
                "uid": self.uid,
            },
            "audio": {
                'format': self.format,
                "sample_rate": self.rate,
                "bits": self.bits,
                "channel": self.channel,
                "codec": self.codec,
            },
            "request": {
                "model_name": "bigmodel",
                "enable_punc": True,
            }
        }
        return req
    
    async def connect_and_send_initial(self):
        """连接WebSocket并发送初始请求"""
        self.reqid = str(uuid.uuid4())
        self.seq = 1
        
        request_params = self.construct_request()
        payload_bytes = str.encode(json.dumps(request_params))
        payload_bytes = gzip.compress(payload_bytes)
        
        full_client_request = bytearray(AsrProtocol.generate_header(message_type_specific_flags=POS_SEQUENCE))
        full_client_request.extend(AsrProtocol.generate_before_payload(sequence=self.seq))
        full_client_request.extend((len(payload_bytes)).to_bytes(4, 'big'))
        full_client_request.extend(payload_bytes)
        
        header = {
            "X-Api-Resource-Id": "volc.bigasr.sauc.duration",
            "X-Api-Access-Key": "RiFQd9Rkg8yV_uPI8-7nZR9caeYftj5L",
            "X-Api-App-Key": "1268059006",
            "X-Api-Request-Id": self.reqid
        }
        
        self.websocket = await websockets.connect(self.ws_url, extra_headers=header, max_size=1000000000)
        await self.websocket.send(full_client_request)
        
        res = await self.websocket.recv()
        result = AsrProtocol.parse_response(res)
        rospy.loginfo(f"ASR服务连接成功: {result}")
    
    async def send_audio_chunk(self, audio_data, is_last=False):
        """发送音频数据块"""
        if not self.websocket:
            return
        
        self.seq += 1
        if is_last:
            self.seq = -abs(self.seq)
        
        payload_bytes = gzip.compress(audio_data)
        
        if is_last:
            audio_only_request = bytearray(AsrProtocol.generate_header(
                message_type=AUDIO_ONLY_REQUEST, 
                message_type_specific_flags=NEG_WITH_SEQUENCE
            ))
        else:
            audio_only_request = bytearray(AsrProtocol.generate_header(
                message_type=AUDIO_ONLY_REQUEST, 
                message_type_specific_flags=POS_SEQUENCE
            ))
        
        audio_only_request.extend(AsrProtocol.generate_before_payload(sequence=self.seq))
        audio_only_request.extend((len(payload_bytes)).to_bytes(4, 'big'))
        audio_only_request.extend(payload_bytes)
        
        await self.websocket.send(audio_only_request)
        
        # 接收响应
        res = await self.websocket.recv()
        result = AsrProtocol.parse_response(res)
        
        # 调试日志
        if hasattr(self, 'debug_mode') and self.debug_mode:
            rospy.loginfo(f"ASR响应 (seq={self.seq}): {result}")
        
        # 处理识别结果
        try:
            if 'payload_msg' in result and isinstance(result['payload_msg'], dict):
                if 'result' in result['payload_msg'] and isinstance(result['payload_msg']['result'], dict):
                    # result是一个字典，直接处理text字段
                    text = result['payload_msg']['result'].get('text', '')
                    if text:
                        current_time = time.time()
                        # 去重逻辑：只有文本发生变化或时间间隔足够长才发布
                        if (text != self.last_result_text or 
                            current_time - self.last_result_time > self.min_result_interval):
                            self.last_result_text = text
                            self.last_result_time = current_time
                            
                            # 回调处理识别结果
                            self.asr_result_callback({
                                'text': text,
                                'is_final': result.get('is_last_package', False),
                                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
                            })
                elif 'result' in result['payload_msg'] and isinstance(result['payload_msg']['result'], list):
                    # result是一个列表，遍历处理
                    for res_item in result['payload_msg']['result']:
                        if isinstance(res_item, dict) and 'text' in res_item:
                            text = res_item['text']
                            if text:
                                current_time = time.time()
                                # 去重逻辑
                                if (text != self.last_result_text or 
                                    current_time - self.last_result_time > self.min_result_interval):
                                    self.last_result_text = text
                                    self.last_result_time = current_time
                                    
                                    # 回调处理识别结果
                                    self.asr_result_callback({
                                        'text': text,
                                        'is_final': res_item.get('is_final', False),
                                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
                                    })
        except Exception as e:
            rospy.logerr(f"处理ASR响应时出错: {e}")
            rospy.logerr(f"响应内容: {result}")
    
    async def audio_sender(self):
        """音频发送协程"""
        try:
            await self.connect_and_send_initial()
            
            last_send_time = time.time()
            
            while self.is_running:
                current_time = time.time()
                
                # 控制发送速率，每100ms发送一次
                if current_time - last_send_time >= self.segment_duration_ms / 1000.0:
                    if len(self.audio_buffer) >= self.segment_size:
                        # 发送一个分片
                        chunk = self.audio_buffer[:self.segment_size]
                        self.audio_buffer = self.audio_buffer[self.segment_size:]
                        
                        await self.send_audio_chunk(bytes(chunk))
                        last_send_time = current_time
                    elif len(self.audio_buffer) > 0 and not self.is_running:
                        # 如果要停止了，发送剩余数据
                        await self.send_audio_chunk(bytes(self.audio_buffer))
                        self.audio_buffer = bytearray()
                
                await asyncio.sleep(0.01)
            
            # 发送最后的数据
            if len(self.audio_buffer) > 0:
                await self.send_audio_chunk(bytes(self.audio_buffer), is_last=True)
            else:
                # 发送空的结束标志
                await self.send_audio_chunk(b'', is_last=True)
            
            # 等待最后的结果
            await asyncio.sleep(1.0)
            
            # 触发会话结束回调
            if self.session_end_callback:
                self.session_end_callback()
            
        except websockets.exceptions.ConnectionClosed as e:
            rospy.logerr(f"WebSocket连接关闭: code={e.code}, reason={e.reason}")
        except Exception as e:
            rospy.logerr(f"ASR服务错误: {e}")
            import traceback
            rospy.logerr(traceback.format_exc())
        finally:
            if self.websocket:
                await self.websocket.close()
    
    def add_audio_data(self, audio_data):
        """添加音频数据到缓冲区"""
        if self.is_running:
            self.audio_buffer.extend(audio_data)
    
    def start(self):
        """启动ASR服务"""
        if self.is_running:
            return
        
        self.is_running = True
        self.audio_buffer = bytearray()
        self.last_result_text = ""
        self.last_result_time = 0
        
        # 创建新的事件循环
        self.loop = asyncio.new_event_loop()
        
        def run_loop():
            asyncio.set_event_loop(self.loop)
            self.loop.run_until_complete(self.audio_sender())
        
        self.loop_thread = threading.Thread(target=run_loop)
        self.loop_thread.start()
        
        rospy.loginfo("ASR服务已启动")
    
    def stop(self):
        """停止ASR服务"""
        if not self.is_running:
            return
        
        self.is_running = False
        
        if self.loop_thread:
            self.loop_thread.join(timeout=5.0)
        
        rospy.loginfo("ASR服务已停止")


class RobotRealtimeASR:
    """机器人实时ASR节点"""
    
    def __init__(self):
        rospy.init_node('robot_realtime_asr', anonymous=True)
        
        # 音频参数
        self.sample_rate = 16000
        self.channels = 1
        self.sample_width = 2
        
        # 音频格式配置
        self.audio_format = rospy.get_param('~audio_format', 'pcm16')
        self.input_channels = rospy.get_param('~input_channels', 1)
        self.channel_to_record = rospy.get_param('~channel_to_record', 0)
        
        # 调试模式
        self.debug_mode = rospy.get_param('~debug', False)
        
        # 唤醒回应语列表
        self.wakeup_responses = [
            "我在！",
            "有什么能帮助您的？",
            "你好呀",
            "请说！",
            "在呢！",
            "嗯，我听着呢"
        ]
        
        # 状态变量
        self.is_active = False
        self.is_playing_wakeup = False  # 标记是否正在播放唤醒回应
        self.lock = threading.Lock()
        self.session_id = None
        self.session_start_time = None
        self.all_results = []  # 存储本次会话的所有识别结果
        
        # VAD检测器
        self.vad = VoiceActivityDetector(
            sample_rate=self.sample_rate,
            energy_threshold=0.02,
            silence_duration=3.0
        )
        
        # ASR服务
        self.asr_service = RealtimeAsrService(
            self.on_asr_result, 
            self.on_session_end,
            self.debug_mode
        )
        
        # 等待TTS服务
        rospy.wait_for_service('/volcano_tts_node/text_to_speech_service', timeout=10.0)
        self.tts_client = rospy.ServiceProxy('/volcano_tts_node/text_to_speech_service', TextService)
        rospy.loginfo("TTS服务已连接")
        
        # ROS发布者和订阅者
        self.asr_pub = rospy.Publisher('/asr/result', String, queue_size=10)
        self.asr_final_pub = rospy.Publisher('/asr/final_result', String, queue_size=10)
        self.asr_session_pub = rospy.Publisher('/asr/session', String, queue_size=10)
        self.wakeup_sub = rospy.Subscriber('/micarrays/wakeup', String, self.wakeup_callback)
        self.audio_sub = rospy.Subscriber('/audio/stream', UInt8MultiArray, self.audio_callback)
        
        rospy.loginfo("机器人实时ASR节点已启动")
        rospy.loginfo("等待唤醒信号...")
    
    def wakeup_callback(self, msg):
        """处理唤醒信号"""
        try:
            rospy.loginfo(f"收到唤醒信号: {msg.data}")
            
            with self.lock:
                if not self.is_active:
                    # 设置正在播放唤醒回应的标志
                    self.is_playing_wakeup = True
                    
                    # 选择随机的唤醒回应语
                    response_text = random.choice(self.wakeup_responses)
                    rospy.loginfo(f"播放唤醒回应: {response_text}")
                    
                    try:
                        # 调用TTS服务播放唤醒回应
                        self.tts_client(text=response_text, language="CN", gender="female")
                        
                        # 等待TTS播放完成（根据文本长度估算时间）
                        # 大约每个字0.3秒 + 0.5秒缓冲
                        wait_time = len(response_text) * 0.3 + 0.5
                        rospy.sleep(wait_time)
                        
                    except Exception as e:
                        rospy.logerr(f"调用TTS服务失败: {e}")
                        # 即使TTS失败，也继续启动ASR
                    finally:
                        # 清除播放标志
                        self.is_playing_wakeup = False
                    
                    # 启动ASR服务
                    self.start_asr()
                else:
                    rospy.loginfo("ASR已在运行中")
        
        except Exception as e:
            rospy.logerr(f"处理唤醒信号时出错: {e}")
    
    def audio_callback(self, msg):
        """处理音频流数据"""
        try:
            with self.lock:
                # 如果正在播放唤醒回应，忽略音频数据
                if self.is_playing_wakeup:
                    return
                    
                if self.is_active:
                    # 处理音频数据
                    processed_audio = self.process_audio_data(msg.data)
                    
                    if processed_audio is not None:
                        # 发送到ASR服务
                        self.asr_service.add_audio_data(processed_audio)
                        
                        # VAD检测
                        is_speaking = self.vad.add_audio_data(processed_audio)
                        
                        if not is_speaking and self.vad.has_spoken:
                            # 检测到语音结束（已经说过话且现在静音）
                            rospy.loginfo("检测到语音结束，准备停止ASR")
                            self.stop_asr()
        
        except Exception as e:
            rospy.logerr(f"处理音频数据时出错: {e}")
    
    def process_audio_data(self, raw_data):
        """处理原始音频数据，返回16位PCM数据"""
        try:
            if self.audio_format == 'pcm16':
                return raw_data
            
            elif self.audio_format == 'pcm32':
                audio_samples = []
                for i in range(0, len(raw_data) - 3, 4):
                    val = int.from_bytes(raw_data[i:i+4], byteorder='little', signed=True)
                    sample = np.int16(val >> 16)
                    audio_samples.append(sample)
                return np.array(audio_samples, dtype=np.int16).tobytes()
            
            elif self.audio_format == 'multi_channel':
                audio_samples = []
                bytes_per_sample = 2 if '16' in self.audio_format else 4
                bytes_per_frame = bytes_per_sample * self.input_channels
                
                for i in range(0, len(raw_data) - bytes_per_frame + 1, bytes_per_frame):
                    channel_offset = self.channel_to_record * bytes_per_sample
                    sample_data = raw_data[i + channel_offset:i + channel_offset + bytes_per_sample]
                    
                    if bytes_per_sample == 2:
                        sample = int.from_bytes(sample_data, byteorder='little', signed=True)
                    else:
                        val = int.from_bytes(sample_data, byteorder='little', signed=True)
                        sample = np.int16(val >> 16)
                    
                    audio_samples.append(sample)
                
                return np.array(audio_samples, dtype=np.int16).tobytes()
            
            else:
                rospy.logwarn(f"未知的音频格式: {self.audio_format}")
                return None
        
        except Exception as e:
            rospy.logerr(f"处理音频数据时出错: {e}")
            return None
    
    def on_asr_result(self, result):
        """处理ASR识别结果"""
        try:
            # 存储结果
            self.all_results.append(result)
            
            # 发布实时识别结果
            msg = String()
            msg.data = json.dumps(result, ensure_ascii=False)
            self.asr_pub.publish(msg)
            
            # 打印结果
            rospy.loginfo(f"ASR识别结果: {result['text']} (final={result['is_final']})")
            
            # 如果是最终结果，也发布到final_result话题
            if result['is_final']:
                self.asr_final_pub.publish(msg)
        
        except Exception as e:
            rospy.logerr(f"处理ASR结果时出错: {e}")
    
    def on_session_end(self):
        """ASR会话结束回调"""
        try:
            # 发布会话结束消息
            session_msg = {
                'type': 'session_end',
                'session_id': self.session_id,
                'start_time': self.session_start_time,
                'end_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
                'final_text': self.all_results[-1]['text'] if self.all_results else "",
                'all_results': self.all_results
            }
            
            msg = String()
            msg.data = json.dumps(session_msg, ensure_ascii=False)
            self.asr_session_pub.publish(msg)
            
            rospy.loginfo(f"ASR会话结束，最终识别结果: {session_msg['final_text']}")
            
        except Exception as e:
            rospy.logerr(f"处理会话结束时出错: {e}")
    
    def start_asr(self):
        """启动ASR服务"""
        try:
            self.is_active = True
            self.session_id = str(uuid.uuid4())
            self.session_start_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')
            self.all_results = []
            
            # 重置VAD状态
            self.vad.reset()
            
            # 发布会话开始消息
            session_msg = {
                'type': 'session_start',
                'session_id': self.session_id,
                'start_time': self.session_start_time
            }
            
            msg = String()
            msg.data = json.dumps(session_msg, ensure_ascii=False)
            self.asr_session_pub.publish(msg)
            
            # 启动ASR服务
            self.asr_service.start()
            
            rospy.loginfo(f"ASR会话已开始，会话ID: {self.session_id}")
        
        except Exception as e:
            rospy.logerr(f"启动ASR时出错: {e}")
            self.is_active = False
    
    def stop_asr(self):
        """停止ASR服务"""
        try:
            if not self.is_active:
                return
            
            self.is_active = False
            self.is_playing_wakeup = False  # 确保清除播放标志
            
            # 停止ASR服务
            self.asr_service.stop()
            
            rospy.loginfo("ASR服务已停止，等待下次唤醒")
        
        except Exception as e:
            rospy.logerr(f"停止ASR时出错: {e}")
    
    def run(self):
        """运行节点"""
        try:
            rospy.spin()
        except KeyboardInterrupt:
            rospy.loginfo("收到中断信号，正在停止...")
            
            with self.lock:
                if self.is_active:
                    self.stop_asr()
        
        except Exception as e:
            rospy.logerr(f"运行时出错: {e}")


def main():
    """主函数"""
    try:
        asr_node = RobotRealtimeASR()
        asr_node.run()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"主程序出错: {e}")


if __name__ == '__main__':
    main()