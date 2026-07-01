#!/usr/bin/env python
# -*- coding: utf-8 -*-

import requests
import json
import time


def test_navigation_server():
    """测试导航服务器"""
    
    base_url = "http://localhost:5000"
    
    print("=== 机器人SLAM导航测试 ===\n")
    
    # 1. 检查服务器状态
    print("1. 检查服务器状态...")
    try:
        response = requests.get(f"{base_url}/status")
        status = response.json()
        print(f"   当前GPS: {status['current_gps']}")
        print(f"   导航状态: {'导航中' if status['is_navigating'] else '空闲'}")
        print(f"   当前位置: {status['current_pose']}\n")
    except Exception as e:
        print(f"   错误: {e}\n")
        return
    
    # 2. 测试导航功能
    print("2. 发送导航请求...")
    
    # 测试目标点（在当前位置附近）
    test_targets = [
        {
            "name": "目标点1 (东北方向100米)",
            "target_gps": [116.291338, 40.163926]  # 约东北方向100米
        },
        {
            "name": "目标点2 (正东方向50米)", 
            "target_gps": [116.290888, 40.163026]  # 约正东方向50米
        },
        {
            "name": "目标点3 (东南方向80米)",
            "target_gps": [116.291138, 40.162326]  # 约东南方向80米
        }
    ]
    
    for target in test_targets:
        print(f"\n   测试: {target['name']}")
        print(f"   目标GPS: {target['target_gps']}")
        
        # 发送导航请求
        try:
            response = requests.post(
                f"{base_url}/navigate",
                json={"target_gps": target['target_gps']},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   成功: {result['message']}")
                print(f"   目标本地坐标: x={result['target_local']['x']:.2f}, y={result['target_local']['y']:.2f}")
                
                # 等待导航完成
                print("   等待导航完成...", end='', flush=True)
                while True:
                    time.sleep(2)
                    status_response = requests.get(f"{base_url}/status")
                    status = status_response.json()
                    if not status['is_navigating']:
                        print(" 完成!")
                        break
                    print(".", end='', flush=True)
                    
            else:
                error = response.json()
                print(f"   失败: {error['error']}")
                
        except Exception as e:
            print(f"   请求错误: {e}")
            
        # 询问是否继续
        user_input = input("\n   继续下一个测试? (y/n): ")
        if user_input.lower() != 'y':
            break
    
    # 3. 停止导航
    print("\n3. 停止导航服务...")
    try:
        response = requests.post(f"{base_url}/stop")
        result = response.json()
        print(f"   {result['message']}")
    except Exception as e:
        print(f"   错误: {e}")
    
    print("\n=== 测试完成 ===")


if __name__ == "__main__":
    test_navigation_server()