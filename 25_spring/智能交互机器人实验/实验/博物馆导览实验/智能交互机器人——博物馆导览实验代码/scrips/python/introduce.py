#!/usr/bin/env python
# -*- coding: utf-8 -*-

import base64
import sys
import threading
import time

import cv2
import requests
import rospkg
import rospy
from cv_bridge import CvBridge
from sensor_msgs.msg import Image

sys.path.append(rospkg.RosPack().get_path('leju_lib_pkg'))
import motion.motionControl as mCtrl
from std_msgs.msg import Float64MultiArray
from mediumsize_msgs.srv import *

# API配置
API_URL = "https://api.siliconflow.cn/v1/chat/completions"
API_KEY = "REDACTED_API_KEY"
MODEL_NAME = "Qwen/Qwen2.5-VL-32B-Instruct"

# 博物馆导览机器人的系统提示
SYSTEM_PROMPT = """你是一个博物馆介绍机器人，请根据用户的问题、展品信息和你看到的场景引导用户，并介绍展品。

# 博物馆机器人展品介绍

## 展品1：陪伴机器人大头像

这件展品展示了现代陪伴机器人的特写头像造型。陪伴机器人是为了满足人们情感需求而设计的，其面部表情丰富，能够模拟人类情感，与使用者建立情感连接。这种大型头像设计让参观者能够近距离观察机器人的面部细节，包括其精密的表情系统、灵敏的视觉传感器和自然的交互界面。这类机器人在老年护理、儿童教育和心理健康领域发挥着越来越重要的作用，代表了人工智能与情感计算的融合发展方向。

## 展品2：六足机器人

六足机器人是一种受昆虫启发设计的先进机械装置，拥有六条独立控制的机械腿，使其能够在各种复杂地形上稳定行走。这种设计赋予了机器人卓越的稳定性和适应性，即使在一条或两条腿失去功能的情况下仍能继续移动。六足机器人广泛应用于地质勘探、灾难救援和军事侦察等极端环境，其多足设计让它能够克服传统轮式或双足机器人难以应对的障碍。这件展品展示了机器人学如何从自然界汲取灵感，创造出高效、耐用的机械系统。

## 展品3：陪伴机器人三重像

这件独特的展品展示了同一款陪伴机器人的三个不同侧面或表现形式，让观众能够从多角度了解现代陪伴机器人的设计理念和功能特点。通过这三重展示，参观者可以观察到机器人在不同情境下的表情变化、肢体语言和互动模式，展现了人工智能如何适应不同的社交场景和情感需求。这种三重展示方式也象征着陪伴机器人在技术、社会和心理三个维度上的深刻影响，引发人们思考人机关系的多元性和复杂性。

## 展品4：星球大战机器人R2-D2

R2-D2是来自《星球大战》系列电影的标志性机器人角色，这件展品是其精确复制品。作为科幻文化中最著名的机器人之一，R2-D2以其圆顶形状、蓝白相间的配色和独特的电子音语言赢得了全球粉丝的喜爱。在电影中，这位小型机械英雄扮演着关键角色，凭借其出色的问题解决能力、坚韧不拔的忠诚度和引人共鸣的个性特征，成为人类与机器人和谐共存的经典象征。这件展品不仅展示了精湛的电影道具制作工艺，也反映了大众文化对机器人形象的塑造，以及科幻想象如何推动现实机器人技术的发展。

请根据摄像头拍摄的画面，判断用户正在查看哪件展品，并提供相关的详细信息。如果看不清展品，请礼貌地询问用户想了解什么展品。"""


class MuseumGuideRobot:
    def __init__(self):
        # 初始化对话历史
        self.conversation_history = []

        # 初始化摄像头
        self.bridge = CvBridge()
        self.current_image = None
        self.image_lock = threading.Lock()

        # 订阅摄像头信息
        self.image_sub = rospy.Subscriber("/sim/camera/D435/colorImage", Image, self.camera_callback)

        # 初始化位置跟踪
        self.roban_torsoPR = [0, 0, 0]
        rospy.Subscriber("/sim/torso/PR", Float64MultiArray, self.torso_callback)

        # 显示设置
        self.display_image = True

        print("=== 博物馆导览机器人已启动 ===")
        print("请输入您的问题，按回车发送:")

    def camera_callback(self, data):
        """处理摄像头图像的回调函数"""
        try:
            cv_image = self.bridge.imgmsg_to_cv2(data, "bgr8")
            with self.image_lock:
                self.current_image = cv_image

            # 如果启用了图像显示，则显示摄像头画面
            if self.display_image:
                cv2.imshow("摄像头实时画面", cv_image)
                cv2.waitKey(3)
        except Exception as e:
            rospy.logerr(f"处理摄像头图像时出错: {e}")

    def torso_callback(self, data):
        """跟踪机器人位置的回调函数"""
        self.roban_torsoPR = data.data

    def get_current_image_base64(self):
        """获取当前摄像头图像的base64编码"""
        with self.image_lock:
            if self.current_image is not None:
                # 保存当前图像的快照
                snapshot_path = "/tmp/museum_robot_snapshot.jpg"
                cv2.imwrite(snapshot_path, self.current_image)

                # 转换为base64
                with open(snapshot_path, "rb") as image_file:
                    return base64.b64encode(image_file.read()).decode('utf-8')
            return None

    def add_to_history(self, role, content):
        """将消息添加到对话历史"""
        if isinstance(content, list):
            # 对于包含图像的复杂内容，仅存储文本部分以节省空间
            text_content = next((item.get("text") for item in content if item.get("type") == "text"), "")
            self.conversation_history.append({"role": role, "content": text_content})
        else:
            self.conversation_history.append({"role": role, "content": content})

        # 仅保留最后10条消息，以防止上下文窗口溢出
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]

    def create_messages(self, user_query):
        """创建API请求的消息"""
        # 以系统消息开始
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # 添加对话历史
        messages.extend(self.conversation_history)

        # 添加当前用户查询和图像
        image_base64 = self.get_current_image_base64()
        if image_base64:
            user_content = [
                {"type": "text", "text": user_query},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                        "detail": "high"
                    }
                }
            ]
            messages.append({"role": "user", "content": user_content})
        else:
            messages.append({"role": "user", "content": user_query})

        return messages

    def call_llm_api(self, messages):
        """调用大语言模型API处理消息"""
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False,
            "max_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.7,
            "top_k": 50,
            "frequency_penalty": 0.5,
            "n": 1,
            "response_format": {"type": "text"}
        }

        try:
            print("正在发送请求到API...")
            response = requests.post(API_URL, json=payload, headers=headers)
            response.raise_for_status()  # 抛出HTTP错误异常

            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                return "抱歉，我无法处理您的请求。"

        except Exception as e:
            rospy.logerr(f"API调用失败: {e}")
            return f"抱歉，API调用失败: {str(e)}"

    def process_user_input(self, user_input):
        """处理用户输入并从大语言模型获取响应"""
        print("正在处理您的请求...")

        # 创建API请求消息
        messages = self.create_messages(user_input)

        # 调用大语言模型API
        response = self.call_llm_api(messages)

        # 添加到对话历史
        self.add_to_history("user", user_input)
        self.add_to_history("assistant", response)

        return response

    def run(self):
        """主循环，捕获用户输入并处理响应"""
        rate = rospy.Rate(10)  # 10 Hz

        while not rospy.is_shutdown():
            try:
                # 显示当前位置
                print('\r当前坐标：X:%f Y:%f Z:%f' %
                      (self.roban_torsoPR[0], self.roban_torsoPR[1], self.roban_torsoPR[2]), end='')

                user_input = input("\n请输入您的问题: ")
                if user_input.lower() in ['quit', 'exit', 'q']:
                    break

                response = self.process_user_input(user_input)
                print("\n机器人回答:")
                print(response)
                print("\n" + "-" * 50)

            except KeyboardInterrupt:
                print("\n程序已终止")
                break
            except Exception as e:
                print(f"发生错误: {e}")

            rate.sleep()


def set_arm_mode(mode):
    '''
    设置机器人手臂模式
    mode: 0 动作模式, 1 步态模式
    '''
    try:
        rospy.wait_for_service('MediumSize/BodyHub/armMode', 10)
    except:
        print('错误: 等待armMode服务超时!')
        return None
    client = rospy.ServiceProxy('MediumSize/BodyHub/armMode', SetAction)
    response = client(mode, '设置手臂模式')
    return response.result


def rosShutdownHook():
    """ROS关闭时的清理函数"""
    mCtrl.ResetBodyhub()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    try:
        # 初始化ROS节点
        rospy.init_node('museum_guide_robot', anonymous=True)
        print('ROS节点已初始化...')

        # 注册关闭钩子
        rospy.on_shutdown(rosShutdownHook)

        # 重置机器人并设置手臂模式
        mCtrl.ResetBodyhub()
        set_arm_mode(0)
        time.sleep(1)

        # 创建并运行机器人
        robot = MuseumGuideRobot()
        robot.run()

    except KeyboardInterrupt:
        print("\n程序已被用户终止")
    except Exception as e:
        print(f"程序出现异常: {e}")
    finally:
        # 清理
        mCtrl.ResetBodyhub()
        cv2.destroyAllWindows()