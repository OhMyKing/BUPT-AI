#!/usr/bin/env python
# -*- coding: utf-8 -*-

import rospy
from std_msgs.msg import String, UInt8MultiArray
from ros_mic_arrays.srv import setBeamSrv
import wave
import numpy as np
import threading
import time
import os
import json
import signal
import sys

class AudioTester:
    def __init__(self):
        # 初始化节点
        rospy.init_node('audio_tester', anonymous=True)
        
        # 音频参数（根据main.cpp中的设置）
        self.channels = 8
        self.sample_rate = 16000
        self.sample_format = 'S32_LE'  # 32位有符号整数
        self.bytes_per_sample = 4
        
        # 数据存储
        self.audio_buffer = []
        self.is_recording = False
        self.save_audio = False
        self.output_dir = os.path.expanduser("~/audio_test_output")
        self.current_recording_file = None
        
        # 统计信息
        self.total_bytes_received = 0
        self.total_packets_received = 0
        self.wakeup_count = 0
        self.last_wakeup_info = None
        self.start_time = time.time()
        
        # 创建输出目录
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            
        # 订阅音频流
        self.audio_sub = rospy.Subscriber('/audio/stream', UInt8MultiArray, 
                                         self.audio_callback, queue_size=1000)
        
        # 订阅唤醒词检测
        self.wakeup_sub = rospy.Subscriber('/micarrays/wakeup', String, 
                                          self.wakeup_callback, queue_size=10)
        
        # 波束设置服务客户端
        rospy.wait_for_service('/ros_mic_arrays/set_real_beam', timeout=5.0)
        self.set_beam_service = rospy.ServiceProxy('/ros_mic_arrays/set_real_beam', setBeamSrv)
        
        # 状态显示线程
        self.display_thread = threading.Thread(target=self.display_status)
        self.display_thread.daemon = True
        self.display_thread.start()
        
        rospy.loginfo("Audio Tester initialized successfully!")
        
    def audio_callback(self, msg):
        """处理音频数据"""
        self.total_packets_received += 1
        self.total_bytes_received += len(msg.data)
        
        if self.is_recording and self.save_audio:
            self.audio_buffer.extend(msg.data)
            
    def wakeup_callback(self, msg):
        """处理唤醒词检测事件"""
        self.wakeup_count += 1
        
        try:
            # 尝试解析JSON格式的唤醒词信息
            wakeup_info = eval(msg.data)  # 注意：实际使用中应该用json.loads()
            self.last_wakeup_info = wakeup_info
            
            rospy.loginfo("=" * 50)
            rospy.loginfo("WAKE UP DETECTED!")
            rospy.loginfo(f"Keyword: {wakeup_info.get('key_word', 'unknown')}")
            rospy.loginfo(f"Score: {wakeup_info.get('score', 'N/A')}")
            rospy.loginfo(f"Angle: {wakeup_info.get('angle', 'N/A')}°")
            rospy.loginfo("=" * 50)
            
            # 自动开始新的录音（如果启用了保存功能）
            if self.save_audio and not self.is_recording:
                self.start_recording()
                
        except Exception as e:
            rospy.logwarn(f"Failed to parse wakeup message: {e}")
            rospy.loginfo(f"Raw wakeup message: {msg.data}")
            
    def set_beam(self, beam_id):
        """设置波束方向"""
        try:
            response = self.set_beam_service(beam_id)
            rospy.loginfo(f"Successfully set beam to {beam_id}")
            return True
        except rospy.ServiceException as e:
            rospy.logerr(f"Service call failed: {e}")
            return False
            
    def start_recording(self):
        """开始录音"""
        if self.is_recording:
            rospy.logwarn("Already recording!")
            return
            
        self.audio_buffer = []
        self.is_recording = True
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        self.current_recording_file = os.path.join(self.output_dir, f"recording_{timestamp}.wav")
        rospy.loginfo(f"Started recording to {self.current_recording_file}")
        
    def stop_recording(self):
        """停止录音并保存文件"""
        if not self.is_recording:
            rospy.logwarn("Not recording!")
            return
            
        self.is_recording = False
        
        if len(self.audio_buffer) > 0:
            self.save_wav_file()
            rospy.loginfo(f"Saved recording to {self.current_recording_file}")
        else:
            rospy.logwarn("No audio data to save!")
            
    def save_wav_file(self):
        """保存WAV文件"""
        # 将字节数据转换为numpy数组
        audio_data = np.array(self.audio_buffer, dtype=np.uint8)
        
        # 重新解释为32位有符号整数（S32_LE）
        audio_data = audio_data.view(np.int32)
        
        # 归一化到16位范围（WAV文件通常使用16位）
        audio_data = (audio_data >> 16).astype(np.int16)
        
        # 重塑为多通道格式
        num_samples = len(audio_data) // self.channels
        audio_data = audio_data[:num_samples * self.channels].reshape(-1, self.channels)
        
        # 保存为WAV文件
        with wave.open(self.current_recording_file, 'wb') as wav_file:
            wav_file.setnchannels(self.channels)
            wav_file.setsampwidth(2)  # 16位
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(audio_data.tobytes())
            
    def display_status(self):
        """定期显示状态信息"""
        while not rospy.is_shutdown():
            time.sleep(2)
            
            elapsed_time = time.time() - self.start_time
            data_rate = self.total_bytes_received / elapsed_time / 1024  # KB/s
            packet_rate = self.total_packets_received / elapsed_time
            
            print("\n" + "=" * 60)
            print("AUDIO TEST STATUS")
            print("=" * 60)
            print(f"Elapsed Time: {elapsed_time:.1f} seconds")
            print(f"Total Data Received: {self.total_bytes_received / 1024 / 1024:.2f} MB")
            print(f"Data Rate: {data_rate:.2f} KB/s")
            print(f"Packet Rate: {packet_rate:.1f} packets/s")
            print(f"Wakeup Count: {self.wakeup_count}")
            
            if self.last_wakeup_info:
                print(f"Last Wakeup: {self.last_wakeup_info}")
                
            if self.is_recording:
                print(f"RECORDING: {len(self.audio_buffer)} bytes")
            else:
                print("Not recording")
                
            print("=" * 60)
            
    def run_interactive_test(self):
        """运行交互式测试"""
        print("\n" + "=" * 60)
        print("ROS MIC ARRAY AUDIO TESTER")
        print("=" * 60)
        print("Commands:")
        print("  r - Start recording")
        print("  s - Stop recording and save")
        print("  t - Toggle auto-save on wakeup")
        print("  b <id> - Set beam direction (0-7)")
        print("  w - Trigger test wakeup")
        print("  q - Quit")
        print("=" * 60)
        
        while not rospy.is_shutdown():
            try:
                cmd = raw_input("\nEnter command: ").strip().lower()
                
                if cmd == 'r':
                    self.start_recording()
                elif cmd == 's':
                    self.stop_recording()
                elif cmd == 't':
                    self.save_audio = not self.save_audio
                    rospy.loginfo(f"Auto-save on wakeup: {'ON' if self.save_audio else 'OFF'}")
                elif cmd.startswith('b '):
                    try:
                        beam_id = int(cmd.split()[1])
                        self.set_beam(beam_id)
                    except (ValueError, IndexError):
                        rospy.logwarn("Invalid beam ID. Use: b <0-7>")
                elif cmd == 'w':
                    # 发布测试唤醒消息
                    test_msg = String()
                    test_msg.data = "{'key_word': 'test', 'score': '100', 'angle': '0'}"
                    rospy.loginfo("Publishing test wakeup message...")
                    # 注意：这只是为了测试，实际唤醒应该由麦克风阵列硬件产生
                elif cmd == 'q':
                    break
                else:
                    print("Unknown command. Try again.")
                    
            except KeyboardInterrupt:
                break
                
        rospy.loginfo("Shutting down audio tester...")
        
def signal_handler(sig, frame):
    """处理Ctrl+C信号"""
    print("\nShutting down...")
    rospy.signal_shutdown("User interrupted")
    sys.exit(0)

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        tester = AudioTester()
        tester.run_interactive_test()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"Error: {e}")