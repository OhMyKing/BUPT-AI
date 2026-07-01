#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
ASR Node Test Subscriber
用于测试ASR节点的订阅脚本，显示所有ASR相关消息
"""

import rospy
import json
import threading
from std_msgs.msg import String
from datetime import datetime
from collections import defaultdict


class ASRTestSubscriber:
    """ASR测试订阅器"""
    
    def __init__(self):
        # 初始化节点
        rospy.init_node('asr_test_subscriber', anonymous=True)
        
        # 统计信息
        self.stats = defaultdict(int)
        self.sessions = {}  # 存储会话信息
        self.current_session = None
        self.lock = threading.Lock()
        
        # 颜色代码（用于终端输出）
        self.COLORS = {
            'HEADER': '\033[95m',
            'BLUE': '\033[94m',
            'CYAN': '\033[96m',
            'GREEN': '\033[92m',
            'YELLOW': '\033[93m',
            'RED': '\033[91m',
            'ENDC': '\033[0m',
            'BOLD': '\033[1m',
            'UNDERLINE': '\033[4m'
        }
        
        # 订阅所有ASR相关话题
        self.result_sub = rospy.Subscriber('/asr/result', String, self.result_callback)
        self.final_sub = rospy.Subscriber('/asr/final_result', String, self.final_callback)
        self.session_sub = rospy.Subscriber('/asr/session', String, self.session_callback)
        
        # 打印启动信息
        self.print_header()
        rospy.loginfo("ASR测试订阅器已启动，等待消息...")
    
    def print_header(self):
        """打印头部信息"""
        print(f"\n{self.COLORS['HEADER']}{'='*80}{self.COLORS['ENDC']}")
        print(f"{self.COLORS['BOLD']}ASR节点测试订阅器{self.COLORS['ENDC']}")
        print(f"{self.COLORS['HEADER']}{'='*80}{self.COLORS['ENDC']}")
        print(f"订阅话题:")
        print(f"  - /asr/result       : 实时识别结果")
        print(f"  - /asr/final_result : 最终识别结果")
        print(f"  - /asr/session      : 会话状态消息")
        print(f"{self.COLORS['HEADER']}{'='*80}{self.COLORS['ENDC']}\n")
    
    def result_callback(self, msg):
        """处理实时识别结果"""
        try:
            with self.lock:
                data = json.loads(msg.data)
                self.stats['result_count'] += 1
                
                # 格式化输出
                timestamp = data.get('timestamp', '')
                text = data.get('text', '')
                is_final = data.get('is_final', False)
                
                # 根据是否为最终结果选择颜色
                color = self.COLORS['GREEN'] if is_final else self.COLORS['CYAN']
                
                print(f"{self.COLORS['BLUE']}[实时结果]{self.COLORS['ENDC']} "
                      f"{timestamp} | "
                      f"{color}{text}{self.COLORS['ENDC']} "
                      f"{'[最终]' if is_final else '[中间]'}")
                
                # 更新当前会话的最新文本
                if self.current_session:
                    self.current_session['latest_text'] = text
                    self.current_session['result_count'] += 1
        
        except Exception as e:
            rospy.logerr(f"处理实时结果时出错: {e}")
    
    def final_callback(self, msg):
        """处理最终识别结果"""
        try:
            with self.lock:
                data = json.loads(msg.data)
                self.stats['final_count'] += 1
                
                timestamp = data.get('timestamp', '')
                text = data.get('text', '')
                
                print(f"\n{self.COLORS['YELLOW']}[最终结果]{self.COLORS['ENDC']} "
                      f"{timestamp} | "
                      f"{self.COLORS['BOLD']}{self.COLORS['GREEN']}{text}{self.COLORS['ENDC']}\n")
        
        except Exception as e:
            rospy.logerr(f"处理最终结果时出错: {e}")
    
    def session_callback(self, msg):
        """处理会话状态消息"""
        try:
            with self.lock:
                data = json.loads(msg.data)
                session_type = data.get('type', '')
                session_id = data.get('session_id', '')
                
                if session_type == 'session_start':
                    self.handle_session_start(data)
                elif session_type == 'session_end':
                    self.handle_session_end(data)
        
        except Exception as e:
            rospy.logerr(f"处理会话消息时出错: {e}")
    
    def handle_session_start(self, data):
        """处理会话开始"""
        session_id = data.get('session_id', '')
        start_time = data.get('start_time', '')
        
        # 创建新会话记录
        self.current_session = {
            'id': session_id,
            'start_time': start_time,
            'result_count': 0,
            'latest_text': ''
        }
        self.sessions[session_id] = self.current_session
        self.stats['session_count'] += 1
        
        print(f"\n{self.COLORS['HEADER']}{'='*60}{self.COLORS['ENDC']}")
        print(f"{self.COLORS['BOLD']}[会话开始]{self.COLORS['ENDC']}")
        print(f"会话ID: {session_id}")
        print(f"开始时间: {start_time}")
        print(f"{self.COLORS['HEADER']}{'='*60}{self.COLORS['ENDC']}\n")
    
    def handle_session_end(self, data):
        """处理会话结束"""
        session_id = data.get('session_id', '')
        start_time = data.get('start_time', '')
        end_time = data.get('end_time', '')
        final_text = data.get('final_text', '')
        all_results = data.get('all_results', [])
        
        # 计算会话持续时间
        try:
            start_dt = datetime.strptime(start_time.split('.')[0], '%Y-%m-%d %H:%M:%S')
            end_dt = datetime.strptime(end_time.split('.')[0], '%Y-%m-%d %H:%M:%S')
            duration = (end_dt - start_dt).total_seconds()
        except:
            duration = 0
        
        print(f"\n{self.COLORS['HEADER']}{'='*60}{self.COLORS['ENDC']}")
        print(f"{self.COLORS['BOLD']}[会话结束]{self.COLORS['ENDC']}")
        print(f"会话ID: {session_id}")
        print(f"持续时间: {duration:.2f}秒")
        print(f"结果数量: {len(all_results)}")
        print(f"{self.COLORS['BOLD']}最终文本:{self.COLORS['ENDC']} {self.COLORS['GREEN']}{final_text}{self.COLORS['ENDC']}")
        
        # 显示识别过程
        if all_results and len(all_results) > 1:
            print(f"\n{self.COLORS['UNDERLINE']}识别过程:{self.COLORS['ENDC']}")
            for i, result in enumerate(all_results[-5:]):  # 只显示最后5个结果
                text = result.get('text', '')
                print(f"  {i+1}. {text}")
        
        print(f"{self.COLORS['HEADER']}{'='*60}{self.COLORS['ENDC']}\n")
        
        # 清除当前会话
        if self.current_session and self.current_session['id'] == session_id:
            self.current_session = None
    
    def print_statistics(self):
        """打印统计信息"""
        with self.lock:
            print(f"\n{self.COLORS['YELLOW']}{'='*60}{self.COLORS['ENDC']}")
            print(f"{self.COLORS['BOLD']}统计信息:{self.COLORS['ENDC']}")
            print(f"  总会话数: {self.stats['session_count']}")
            print(f"  实时结果数: {self.stats['result_count']}")
            print(f"  最终结果数: {self.stats['final_count']}")
            
            if self.current_session:
                print(f"\n{self.COLORS['BOLD']}当前会话:{self.COLORS['ENDC']}")
                print(f"  会话ID: {self.current_session['id']}")
                print(f"  结果数: {self.current_session['result_count']}")
                print(f"  最新文本: {self.current_session['latest_text']}")
            
            print(f"{self.COLORS['YELLOW']}{'='*60}{self.COLORS['ENDC']}\n")
    
    def run(self):
        """运行订阅器"""
        try:
            # 设置定时器定期打印统计信息
            timer = rospy.Timer(rospy.Duration(30), lambda _: self.print_statistics())
            
            rospy.spin()
            
        except KeyboardInterrupt:
            print(f"\n{self.COLORS['RED']}接收到中断信号，正在退出...{self.COLORS['ENDC']}")
            self.print_statistics()
        except Exception as e:
            rospy.logerr(f"运行时出错: {e}")
        finally:
            print(f"{self.COLORS['BOLD']}ASR测试订阅器已停止{self.COLORS['ENDC']}")


def main():
    """主函数"""
    try:
        subscriber = ASRTestSubscriber()
        subscriber.run()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"主程序出错: {e}")


if __name__ == '__main__':
    main()