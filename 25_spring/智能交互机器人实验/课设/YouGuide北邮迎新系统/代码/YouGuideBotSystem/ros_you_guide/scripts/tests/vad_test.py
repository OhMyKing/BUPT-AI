#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
音频能量监测器 - 帮助确定合适的VAD静音阈值
"""

import rospy
import numpy as np
import threading
import time
from collections import deque
from std_msgs.msg import UInt8MultiArray

class AudioEnergyMonitor:
    """音频能量监测器"""
    
    def __init__(self):
        rospy.init_node('audio_energy_monitor', anonymous=True)
        
        # 音频参数
        self.sample_rate = 16000
        self.channels = 1
        self.sample_width = 2
        
        # 音频格式配置（从参数服务器获取）
        self.audio_format = rospy.get_param('~audio_format', 'pcm16')
        self.input_channels = rospy.get_param('~input_channels', 1)
        self.channel_to_record = rospy.get_param('~channel_to_record', 0)
        
        # 统计参数
        self.window_size = 50  # 滑动窗口大小
        self.energy_window = deque(maxlen=self.window_size)
        self.db_window = deque(maxlen=self.window_size)
        
        # 用于统计的变量
        self.frame_count = 0
        self.total_energy = 0
        self.max_energy = 0
        self.min_energy = float('inf')
        self.energy_histogram = {}  # 能量分布直方图
        
        # 建议的阈值
        self.suggested_thresholds = {
            'conservative': 0.01,   # 保守（容易触发）
            'moderate': 0.005,      # 中等
            'aggressive': 0.002     # 激进（不容易触发）
        }
        
        # 显示参数
        self.display_interval = 0.1  # 显示更新间隔（秒）
        self.last_display_time = time.time()
        
        # 订阅音频流
        self.audio_sub = rospy.Subscriber('/audio/stream', UInt8MultiArray, self.audio_callback)
        
        rospy.loginfo("="*60)
        rospy.loginfo("音频能量监测器已启动")
        rospy.loginfo("请在不同情况下测试：")
        rospy.loginfo("1. 完全安静时")
        rospy.loginfo("2. 环境噪音时")
        rospy.loginfo("3. 正常说话时")
        rospy.loginfo("4. 大声说话时")
        rospy.loginfo("="*60)
        rospy.loginfo("")
        
        # 启动统计显示线程
        self.stats_thread = threading.Thread(target=self.display_statistics)
        self.stats_thread.daemon = True
        self.stats_thread.start()
    
    def audio_callback(self, msg):
        """处理音频流数据"""
        try:
            # 处理音频数据
            processed_audio = self.process_audio_data(msg.data)
            
            if processed_audio is not None and len(processed_audio) >= 2:
                # 转换为numpy数组
                audio_array = np.frombuffer(processed_audio, dtype=np.int16)
                
                if len(audio_array) > 0:
                    # 计算能量（归一化到0-1范围）
                    energy = np.mean(np.abs(audio_array.astype(np.float32))) / 32768.0
                    
                    # 计算RMS（均方根）
                    rms = np.sqrt(np.mean(audio_array.astype(np.float32)**2)) / 32768.0
                    
                    # 计算分贝值（避免log(0)）
                    if rms > 0:
                        db = 20 * np.log10(rms)
                    else:
                        db = -100  # 极小值
                    
                    # 更新统计
                    self.update_statistics(energy, db)
                    
                    # 实时显示
                    self.display_realtime(energy, rms, db)
        
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
    
    def update_statistics(self, energy, db):
        """更新统计信息"""
        self.frame_count += 1
        self.total_energy += energy
        
        # 更新最大最小值
        if energy > self.max_energy:
            self.max_energy = energy
        if energy < self.min_energy and energy > 0:
            self.min_energy = energy
        
        # 更新滑动窗口
        self.energy_window.append(energy)
        self.db_window.append(db)
        
        # 更新能量分布直方图
        energy_bucket = round(energy, 4)  # 精度到0.0001
        if energy_bucket not in self.energy_histogram:
            self.energy_histogram[energy_bucket] = 0
        self.energy_histogram[energy_bucket] += 1
    
    def display_realtime(self, energy, rms, db):
        """实时显示当前值"""
        current_time = time.time()
        if current_time - self.last_display_time >= self.display_interval:
            self.last_display_time = current_time
            
            # 创建能量条形图
            bar_length = 50
            filled_length = int(bar_length * min(energy * 100, 1.0))  # 放大100倍显示
            bar = '█' * filled_length + '░' * (bar_length - filled_length)
            
            # 判断当前状态
            status = "静音"
            if energy > 0.01:
                status = "说话"
            elif energy > 0.005:
                status = "可能说话"
            elif energy > 0.002:
                status = "环境噪音"
            
            # 清屏并显示
            print("\033[2J\033[H")  # 清屏并移动光标到顶部
            print("="*70)
            print("实时音频能量监测")
            print("="*70)
            print(f"当前能量值: {energy:.6f} | RMS: {rms:.6f} | 分贝: {db:.1f} dB")
            print(f"能量条: [{bar}] {energy*100:.2f}%")
            print(f"状态: {status}")
            print("-"*70)
            
            # 显示建议的阈值比较
            print("阈值比较:")
            for name, threshold in self.suggested_thresholds.items():
                status = "触发" if energy > threshold else "未触发"
                print(f"  {name:12s} (阈值={threshold:.4f}): {status}")
    
    def display_statistics(self):
        """定期显示统计信息"""
        while not rospy.is_shutdown():
            time.sleep(5)  # 每5秒显示一次统计
            
            if self.frame_count > 0:
                avg_energy = self.total_energy / self.frame_count
                
                # 计算滑动窗口统计
                if len(self.energy_window) > 0:
                    window_avg = np.mean(list(self.energy_window))
                    window_std = np.std(list(self.energy_window))
                    window_max = max(self.energy_window)
                    window_min = min(self.energy_window)
                    
                    print("\n" + "="*70)
                    print("统计信息（最近{}帧）:".format(len(self.energy_window)))
                    print(f"  平均能量: {window_avg:.6f} ± {window_std:.6f}")
                    print(f"  能量范围: {window_min:.6f} ~ {window_max:.6f}")
                    print(f"  平均分贝: {np.mean(list(self.db_window)):.1f} dB")
                    
                print(f"\n总体统计（共{self.frame_count}帧）:")
                print(f"  总平均能量: {avg_energy:.6f}")
                print(f"  历史最大值: {self.max_energy:.6f}")
                print(f"  历史最小值: {self.min_energy:.6f}")
                
                # 显示能量分布
                if len(self.energy_histogram) > 0:
                    print("\n能量分布（前10个最常见）:")
                    sorted_hist = sorted(self.energy_histogram.items(), 
                                       key=lambda x: x[1], reverse=True)[:10]
                    for energy_val, count in sorted_hist:
                        percentage = (count / self.frame_count) * 100
                        print(f"  {energy_val:.4f}: {count:6d} 次 ({percentage:5.1f}%)")
                
                # 建议的阈值
                print("\n建议的阈值设置:")
                noise_floor = window_min if len(self.energy_window) > 0 else self.min_energy
                print(f"  噪音底线: {noise_floor:.6f}")
                print(f"  保守阈值: {noise_floor * 2:.6f} (噪音底线 × 2)")
                print(f"  中等阈值: {noise_floor * 3:.6f} (噪音底线 × 3)")
                print(f"  激进阈值: {noise_floor * 5:.6f} (噪音底线 × 5)")
                print("="*70)
    
    def run(self):
        """运行节点"""
        try:
            rospy.spin()
        except KeyboardInterrupt:
            rospy.loginfo("\n收到中断信号，正在停止...")
            self.display_final_report()
    
    def display_final_report(self):
        """显示最终报告"""
        print("\n" + "="*70)
        print("最终测试报告")
        print("="*70)
        
        if self.frame_count > 0:
            avg_energy = self.total_energy / self.frame_count
            
            print(f"总共处理帧数: {self.frame_count}")
            print(f"平均能量值: {avg_energy:.6f}")
            print(f"能量范围: {self.min_energy:.6f} ~ {self.max_energy:.6f}")
            
            # 基于测试数据的建议
            print("\n基于测试数据的阈值建议:")
            
            # 找出最常见的低能量值（可能是噪音底线）
            low_energy_vals = [e for e in self.energy_histogram.keys() if e < 0.002]
            if low_energy_vals:
                noise_floor = max(low_energy_vals)
                print(f"检测到的噪音底线: {noise_floor:.6f}")
                print(f"建议的VAD阈值: {noise_floor * 3:.6f} ~ {noise_floor * 5:.6f}")
            
            print("\n在您的代码中，将 energy_threshold 设置为上述建议值之一")
            print("例如: energy_threshold=0.005")
        
        print("="*70)


def main():
    """主函数"""
    try:
        monitor = AudioEnergyMonitor()
        monitor.run()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"主程序出错: {e}")


if __name__ == '__main__':
    main()