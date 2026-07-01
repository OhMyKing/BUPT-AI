#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Robot Voice Recorder - 改进版
修复音频格式转换问题
"""

import os
import rospy
import numpy as np
import wave
import threading
import time
from datetime import datetime
from collections import deque
from std_msgs.msg import String, UInt8MultiArray

class VoiceActivityDetector:
    """简单的语音活动检测器"""
    
    def __init__(self, sample_rate=16000, frame_length=0.02, energy_threshold=0.01, silence_duration=2.0):
        self.sample_rate = sample_rate
        self.frame_length = frame_length
        self.frame_size = int(sample_rate * frame_length)
        self.energy_threshold = energy_threshold
        self.silence_duration = silence_duration
        self.silence_frames = int(silence_duration / frame_length)
        
        self.recent_frames = deque(maxlen=self.silence_frames)
        self.is_speaking = False
        
    def add_audio_data(self, audio_data):
        """添加音频数据并检测语音活动"""
        # 直接将UInt8数据作为原始PCM数据处理
        # 假设数据已经是16位PCM格式
        if len(audio_data) >= 2:
            # 将UInt8数组转换为int16数组
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
        else:
            return self.is_speaking
            
        # 计算能量
        if len(audio_array) > 0:
            energy = np.mean(np.abs(audio_array.astype(np.float32))) / 32768.0
            
            # 检测是否有语音
            has_voice = energy > self.energy_threshold
            self.recent_frames.append(has_voice)
            
            # 更新语音状态
            if has_voice:
                self.is_speaking = True
            elif len(self.recent_frames) == self.silence_frames:
                # 检查最近的帧是否都是静音
                if not any(self.recent_frames):
                    self.is_speaking = False
                    
        return self.is_speaking

class RobotVoiceRecorder:
    """机器人语音录制器"""
    
    def __init__(self):
        rospy.init_node('robot_voice_recorder', anonymous=True)
        
        # 创建录音目录
        self.record_dir = './record'
        if not os.path.exists(self.record_dir):
            os.makedirs(self.record_dir)
            
        # 录音参数
        self.sample_rate = 16000
        self.channels = 1
        self.sample_width = 2  # 16-bit
        
        # 音频格式配置（可通过参数调整）
        self.audio_format = rospy.get_param('~audio_format', 'pcm16')  # pcm16, pcm32, etc
        self.input_channels = rospy.get_param('~input_channels', 1)    # 输入通道数
        self.channel_to_record = rospy.get_param('~channel_to_record', 0)  # 要录制的通道
        
        # 状态变量
        self.is_recording = False
        self.audio_buffer = []
        self.current_filename = None
        self.recording_lock = threading.Lock()
        
        # 调试模式
        self.debug_mode = rospy.get_param('~debug', False)
        self.first_data_received = False
        
        # VAD检测器
        self.vad = VoiceActivityDetector(
            sample_rate=self.sample_rate,
            energy_threshold=0.005,
            silence_duration=3.0
        )
        
        # ROS订阅者
        self.wakeup_sub = rospy.Subscriber('/micarrays/wakeup', String, self.wakeup_callback)
        self.audio_sub = rospy.Subscriber('/audio/stream', UInt8MultiArray, self.audio_callback)
        
        rospy.loginfo("机器人语音录制器已启动")
        rospy.loginfo(f"录音文件将保存到: {os.path.abspath(self.record_dir)}")
        rospy.loginfo(f"音频格式: {self.audio_format}, 输入通道数: {self.input_channels}")
        
    def wakeup_callback(self, msg):
        """处理唤醒信号"""
        try:
            rospy.loginfo(f"收到唤醒信号: {msg.data}")
            
            with self.recording_lock:
                if not self.is_recording:
                    self.start_recording()
                else:
                    rospy.loginfo("已在录音中，忽略唤醒信号")
                    
        except Exception as e:
            rospy.logerr(f"处理唤醒信号时出错: {e}")
            
    def audio_callback(self, msg):
        """处理音频流数据"""
        try:
            # 调试：第一次接收数据时打印信息
            if not self.first_data_received and self.debug_mode:
                self.first_data_received = True
                rospy.loginfo(f"首次接收音频数据，长度: {len(msg.data)} 字节")
                # 打印前几个字节用于调试
                if len(msg.data) >= 10:
                    rospy.loginfo(f"前10个字节: {list(msg.data[:10])}")
            
            with self.recording_lock:
                if self.is_recording:
                    # 处理音频数据
                    processed_audio = self.process_audio_data(msg.data)
                    
                    if processed_audio is not None:
                        # 添加处理后的音频数据到缓冲区
                        self.audio_buffer.extend(processed_audio)
                        
                        # VAD检测
                        is_speaking = self.vad.add_audio_data(processed_audio)
                        
                        if not is_speaking and len(self.audio_buffer) > self.sample_rate * 2 * 2:  # 至少2秒的录音
                            # 检测到静音，停止录音
                            self.stop_recording()
                            
        except Exception as e:
            rospy.logerr(f"处理音频数据时出错: {e}")
            
    def process_audio_data(self, raw_data):
        """处理原始音频数据，返回16位PCM数据"""
        try:
            # 方案1：假设数据已经是16位PCM格式（最常见）
            if self.audio_format == 'pcm16':
                # 直接返回原始数据
                return raw_data
                
            # 方案2：假设数据是32位PCM，需要转换为16位
            elif self.audio_format == 'pcm32':
                audio_samples = []
                # 每4个字节一个样本
                for i in range(0, len(raw_data) - 3, 4):
                    # 32位转16位（取高16位）
                    val = int.from_bytes(raw_data[i:i+4], byteorder='little', signed=True)
                    sample = np.int16(val >> 16)
                    audio_samples.append(sample)
                # 转换回字节数组
                return np.array(audio_samples, dtype=np.int16).tobytes()
                
            # 方案3：多通道音频，提取指定通道
            elif self.audio_format == 'multi_channel':
                audio_samples = []
                bytes_per_sample = 2 if '16' in self.audio_format else 4
                bytes_per_frame = bytes_per_sample * self.input_channels
                
                # 提取指定通道
                for i in range(0, len(raw_data) - bytes_per_frame + 1, bytes_per_frame):
                    channel_offset = self.channel_to_record * bytes_per_sample
                    sample_data = raw_data[i + channel_offset:i + channel_offset + bytes_per_sample]
                    
                    if bytes_per_sample == 2:
                        sample = int.from_bytes(sample_data, byteorder='little', signed=True)
                    else:  # 32位转16位
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
            
    def start_recording(self):
        """开始录音"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.current_filename = os.path.join(self.record_dir, f"record_{timestamp}.wav")
            
            self.audio_buffer = []
            self.is_recording = True
            
            # 重置VAD状态
            self.vad.recent_frames.clear()
            self.vad.is_speaking = True
            
            rospy.loginfo(f"开始录音: {self.current_filename}")
            
        except Exception as e:
            rospy.logerr(f"开始录音时出错: {e}")
            self.is_recording = False
            
    def stop_recording(self):
        """停止录音并保存文件"""
        try:
            if not self.is_recording:
                return
                
            self.is_recording = False
            
            if len(self.audio_buffer) > 0:
                self.save_audio_file()
                rospy.loginfo(f"录音完成: {self.current_filename}")
            else:
                rospy.logwarn("录音缓冲区为空，未保存文件")
                
        except Exception as e:
            rospy.logerr(f"停止录音时出错: {e}")
            
    def save_audio_file(self):
        """保存音频文件"""
        try:
            # 音频数据已经是字节格式
            audio_data = bytes(self.audio_buffer)
            
            # 转换为numpy数组用于验证
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            
            if len(audio_array) == 0:
                rospy.logwarn("没有有效的音频样本")
                return
                
            # 保存为WAV文件
            with wave.open(self.current_filename, 'wb') as wav_file:
                wav_file.setnchannels(self.channels)
                wav_file.setsampwidth(self.sample_width)
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(audio_data)
                
            # 打印文件信息
            duration = len(audio_array) / float(self.sample_rate)
            file_size = os.path.getsize(self.current_filename)
            rospy.loginfo(f"已保存录音文件:")
            rospy.loginfo(f"  文件: {self.current_filename}")
            rospy.loginfo(f"  时长: {duration:.2f}秒")
            rospy.loginfo(f"  大小: {file_size}字节")
            rospy.loginfo(f"  样本数: {len(audio_array)}")
            
            # 调试模式下打印更多信息
            if self.debug_mode:
                rospy.loginfo(f"  最小值: {np.min(audio_array)}")
                rospy.loginfo(f"  最大值: {np.max(audio_array)}")
                rospy.loginfo(f"  平均值: {np.mean(audio_array):.2f}")
            
        except Exception as e:
            rospy.logerr(f"保存音频文件时出错: {e}")
            
    def run(self):
        """运行录制器"""
        rospy.loginfo("等待唤醒信号...")
        
        try:
            rospy.spin()
        except KeyboardInterrupt:
            rospy.loginfo("收到中断信号，正在停止...")
            
            # 如果正在录音，先停止录音
            with self.recording_lock:
                if self.is_recording:
                    self.stop_recording()
                    
        except Exception as e:
            rospy.logerr(f"运行时出错: {e}")

def main():
    """主函数"""
    try:
        recorder = RobotVoiceRecorder()
        recorder.run()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"主程序出错: {e}")

if __name__ == '__main__':
    main()