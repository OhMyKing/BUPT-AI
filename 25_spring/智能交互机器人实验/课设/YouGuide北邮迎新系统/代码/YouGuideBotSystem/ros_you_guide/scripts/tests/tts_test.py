#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import rospy
from ros_speech_node.srv import TextService

def test_volcano_tts():
    """测试火山引擎TTS服务"""
    rospy.init_node('volcano_tts_test_client')
    
    # 等待服务可用
    service_name = '/volcano_tts_node/text_to_speech_service'
    rospy.wait_for_service(service_name)
    
    try:
        # 创建服务客户端
        tts_service = rospy.ServiceProxy(service_name, TextService)
        
        # 测试用例
        test_cases = [
            {"text": "你好，欢迎使用火山引擎语音合成服务。", "language": "CN", "gender": "female"},
            {"text": "今天天气真不错，适合出去散步。", "language": "CN", "gender": "male"},
            {"text": "Hello, welcome to use Volcano Engine TTS service.", "language": "EN", "gender": "female"},
            {"text": "The weather is nice today.", "language": "EN", "gender": "male"},
            {"text": "现在测试较长的文本。火山引擎的语音合成技术，采用了先进的深度学习算法，能够生成自然流畅的语音。", "language": "CN", "gender": "female"},
        ]
        
        print("=" * 60)
        print("火山引擎TTS测试")
        print("节点会自动生成并播放音频")
        print("=" * 60)
        
        for i, test in enumerate(test_cases):
            print(f"\n测试 {i+1}:")
            print(f"文本: {test['text']}")
            print(f"语言: {test['language']}, 性别: {test['gender']}")
            
            # 调用TTS服务（立即返回，音频会在后台生成并播放）
            response = tts_service(
                text=test['text'],
                language=test['language'],
                gender=test['gender']
            )
            
            print(f"任务已加入队列: {response.filepath}")
            
            # 等待音频播放完成
            print("等待播放完成...")
            rospy.sleep(5)  # 根据文本长度调整等待时间
        
        print("\n所有测试完成！")
        print("音频应该已经自动播放完毕。")
        
    except rospy.ServiceException as e:
        print(f"服务调用失败: {e}")

if __name__ == '__main__':
    test_volcano_tts()