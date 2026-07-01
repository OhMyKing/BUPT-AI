#!/usr/bin/env python
# coding=utf-8
import numpy as np
import math
import time
import rospy
import cv2
from cv_bridge import CvBridge, CvBridgeError
from std_msgs.msg import *
from sensor_msgs.msg import *
from motion.motionControl import ResetBodyhub, GetBodyhubStatus, SendGaitCommand, SetBodyhubTo_walking, \
    WaitForWalkingDone, SendJointCommand
from IKController import IKController, HAS_IK_MODULE

# 定义常量
GAIT_RANGE = 0.05  # 行走步长（米）- 降低以提高稳定性
ROTATION_RANGE = 10.0  # 旋转角度（度）- 降低以提高旋转稳定性
DESTINATION_THRESHOLD = 0.2  # 认为已到达目的地的距离阈值（米）
DEBUG = True

# 定义目的地坐标（博物馆内的8个位置）
DESTINATIONS = {
    1: (1.9770, -1.9151),
    2: (0.4740, -1.9151),
    3: (-0.3745, -1.9151),
    4: (-0.3984, -0.9465),
    5: (-0.9877, -0.9476),
    6: (1.2195, -0.9275),
    7: (1.0309, -0.0135),
    8: (-0.4304, -0.0014),
}

# 定义图的连接关系（邻接表）
GRAPH = {
    1: [2],
    2: [1, 3, 4, 5],
    3: [2, 4, 5],
    4: [2, 3, 6],
    5: [2, 3, 6],
    6: [4, 5, 7],
    7: [6, 8],
    8: [7]
}

# 定义展品位置（介绍时需要面向的位置）
EXHIBITS = {
    1: (0.4684, -2.3278),
    2: (0.4684, -2.3278),
    3: (-1.0515, -2.0),
    4: (-0.3465, -0.6108),
    8: (-0.9809, 0.0243)
}

# 定义展品说明
EXHIBIT_INFO = {
    2: """
=== 展品#1: 陪伴机器人大头像 ===
这件展品展示了现代陪伴机器人的特写头像造型。陪伴机器人是为了
足人们情感需求而设计的，其面部表情丰富，能够模拟人类情感，与
使用者建立情感连接。这种大型头像设计让参观者能够近距离观察机
器人的面部细节，包括其精密的表情系统、灵敏的视觉传感器和自然
的交互界面。这类机器人在老年护理、儿童教育和心理健康领域发挥
着越来越重要的作用，代表了人工智能与情感计算的融合发展方向。

""",
    3: """
=== 展品#2: 六足机器人 ===
六足机器人是一种受昆虫启发设计的先进机械装置，拥有六条独立控
制的机械腿，使其能够在各种复杂地形上稳定行走。这种设计赋予了
机器人卓越的稳定性和适应性，即使在一条或两条腿失去功能的情况
下仍能继续移动。六足机器人广泛应用于地质勘探、灾难救援和军事
侦察等极端环境，其多足设计让它能够克服传统轮式或双足机器人难
以应对的障碍。这件展品展示了机器人学如何从自然界汲取灵感，创
造出高效、耐用的机械系统。

""",
    4: """
=== 展品#3: 陪伴机器人三重像 ===
这件独特的展品展示了同一款陪伴机器人的三个不同侧面或表现形式，
让观众能够从多角度了解现代陪伴机器人的设计理念和功能特点。通
过这三重展示，参观者可以观察到机器人在不同情境下的表情变化、
肢体语言和互动模式，展现了人工智能如何适应不同的社交场景和情感
需求。这种三重展示方式也象征着陪伴机器人在技术、社会和心理三个
维度上的深刻影响，引发人们思考人机关系的多元性和复杂性。

""",
    7: """
=== 展品#4: 星球大战机器人R2-D2 ===
R2-D2是来自《星球大战》系列电影的标志性机器人角色，这件展品是
其精确复制品。作为科幻文化中最著名的机器人之一，R2-D2以其圆顶
形状、蓝白相间的配色和独特的电子音语言赢得了全球粉丝的喜爱。在
电影中，这位小型机械英雄扮演着关键角色，凭借其出色的问题解决能
力、坚韧不拔的忠诚度和引人共鸣的个性特征，成为人类与机器人和谐
共存的经典象征。这件展品不仅展示了精湛的电影道具制作工艺，也反
映了大众文化对机器人形象的塑造，以及科幻想象如何推动现实机器人
技术的发展。

"""
}


def calculate_distance(point1, point2):
    """计算两点间的欧几里得距离"""
    return math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)


class MuseumGuideRobot():
    def __init__(self, debug=False):
        # 初始化ROS节点
        rospy.init_node('museum_guide_robot', anonymous=True)

        # 重置机器人控制器并等待就绪状态
        ResetBodyhub()
        while GetBodyhubStatus().data != "preReady":
            time.sleep(0.1)
            ResetBodyhub()
            continue

        # 初始化控制ID
        self.control_id = 2

        # 初始化IK控制模块（如果可用）
        self.ik_module = None
        if HAS_IK_MODULE:
            try:
                self.initialize_ik_module()
            except Exception as e:
                rospy.logerr(f"IK模块初始化失败: {e}")

    def initialize_ik_module(self):
        """初始化IK运动控制模块"""
        if not HAS_IK_MODULE:
            return

        # 创建IK控制器实例
        self.ik_module = IKController(self.control_id)

        self.depth_map = np.zeros((480, 640, 1))
        self.bridge = CvBridge()
        self.depth_image_sub = rospy.Subscriber(
            "/sim/camera/D435/depthImage",
            Image,
            self.depthImageCallback,
            queue_size=1
        )

        # 用于机器人位置信息
        self.roban_torsoPR = [0, 0, 0, 0, 0, 0, 0]  # 存储位置和方向
        self.pos_sub = rospy.Subscriber(
            "/sim/torso/PR",
            Float64MultiArray,
            self.torso_callback,
            queue_size=1
        )

        # 发布者，用于获取位置更新
        self.pub = rospy.Publisher('/playerStart', Float64, queue_size=10)

        # 存储当前目标的变量
        self.target_pos = None

        # 参数
        self.debug = DEBUG

        # 跟踪当前位置（从位置1开始）
        self.current_location = 1

        # 等待系统初始化
        rospy.sleep(1.0)

    def torso_callback(self, data):
        """处理机器人位置和方向数据"""
        self.roban_torsoPR = data.data

    def depthImageCallback(self, data):
        """处理深度图像数据"""
        try:
            cv_image = self.bridge.imgmsg_to_cv2(data, "32FC1")
            # 修复弃用警告，使用np.float64代替np.float
            outdep = np.array(cv_image, dtype=np.float64)
            self.depth_map = outdep
        except CvBridgeError as e:
            rospy.logerr("处理深度图像时出错: {}".format(e))

    def hold_callback(self):
        """获取前方障碍物的最小距离"""
        try:
            # 检查深度图像中的几个关键点
            minn = min(
                self.depth_map[240, 320],  # 中心点
                self.depth_map[240, 280],  # 中心左侧
                self.depth_map[240, 360],  # 中心右侧
                self.depth_map[200, 320],  # 中心上方
                self.depth_map[280, 320]  # 中心下方
            )

            # 过滤无效测量值
            if minn < 0.1 or minn > 5.0 or math.isnan(minn):
                return 5.0  # 默认为安全距离

            return minn
        except Exception as e:
            rospy.logerr("获取障碍物距离时出错: {}".format(e))
            return 5.0  # 返回安全距离

    def get_current_pos(self):
        """更新机器人位置信息"""
        hello_str = 0.0
        self.pub.publish(hello_str)

    def cal_distance(self, target_pos):
        """计算到目标位置的距离"""
        self.get_current_pos()
        distance = math.sqrt((target_pos[0] - self.roban_torsoPR[0]) ** 2 +
                             (target_pos[1] - self.roban_torsoPR[1]) ** 2)
        return distance

    def find_place(self, target_pos):
        """让机器人朝向目标位置"""
        self.get_current_pos()

        # 打印当前位置用于调试
        if self.debug:
            rospy.loginfo("当前位置: X:%f Y:%f Z:%f",
                          self.roban_torsoPR[0], self.roban_torsoPR[1], self.roban_torsoPR[2])

        # 计算目标角度
        target_angle = math.atan2(target_pos[1] - self.roban_torsoPR[1],
                                  target_pos[0] - self.roban_torsoPR[0]) * 180 / math.pi

        # 计算当前机器人角度（将四元数转换为欧拉角）
        current_angle = math.atan2(2 * (self.roban_torsoPR[3] * self.roban_torsoPR[6] +
                                        self.roban_torsoPR[4] * self.roban_torsoPR[5]),
                                   1 - 2 * (self.roban_torsoPR[6] * self.roban_torsoPR[6] +
                                            self.roban_torsoPR[5] * self.roban_torsoPR[5]))
        current_angle = current_angle * 180 / math.pi

        # 计算角度差（需要旋转的角度）
        rotation_angle = target_angle - current_angle

        # 将角度规范化到[-180, 180]区间
        if rotation_angle > 180:
            rotation_angle -= 360
        elif rotation_angle < -180:
            rotation_angle += 360

        if self.debug:
            rospy.loginfo("目标角度: %f, 当前角度: %f, 需要旋转: %f",
                          target_angle, current_angle, rotation_angle)

        # 旋转以面向目标
        self.slow_walk("rotation", angle=rotation_angle)

        return True

    def slow_walk(self, direction, stepnum=1, angle=None):
        """控制机器人稳定行走

        Args:
            direction: "forward"(前进), "backward"(后退) 或 "rotation"(旋转)
            stepnum: 步数
            angle: 旋转角度
        """
        array = [0.0, 0.0, 0.0]

        if direction == "forward":
            array[0] = GAIT_RANGE
        elif direction == "backward":
            array[0] = -1 * GAIT_RANGE
        elif direction == "rotation":
            array[2] = ROTATION_RANGE if angle > 0 else -1 * ROTATION_RANGE
            stepnum = max(int(abs(angle) / ROTATION_RANGE), 1)
        else:
            rospy.logerr("无效的行走方向")
            return

        # 执行指定步数
        for _ in range(stepnum):
            SendGaitCommand(array[0], array[1], array[2])
            # 等待每一步完成，避免命令堆积
            WaitForWalkingDone()

    def move(self, mean_distance):
        """根据前方障碍物距离调整机器人行走"""
        if self.debug:
            rospy.loginfo("障碍物距离: {:.2f}米".format(mean_distance))
            
        if mean_distance < 0.15:
            rospy.loginfo("离得太近了，我识别不到了。")
            return
        elif mean_distance > 0.8:
            rospy.loginfo("前方障碍物比较远，我可以走得快一些")
            self.slow_walk("forward", 2)
        elif mean_distance > 0.5:
            rospy.loginfo("我准备往前走了。")
            self.slow_walk("forward", 1)
        elif mean_distance < 0.25:
            rospy.loginfo("有点近，我需要后退一下")
            self.slow_walk("backward", 1)
        else:
            rospy.loginfo("前方有障碍物，我准备右转30度")
            self.slow_walk("rotation", angle=-30)
            
            # 等待找到无障碍的路径
            while True:
                m_d = self.hold_callback()
                if m_d > 0.5:
                    break
                    
            rospy.loginfo("已经转向无障碍方向，我准备往前走了")
            self.slow_walk("forward", 2)
            
            # 如果正在导航到目的地，重新定向
            if self.target_pos:
                rospy.loginfo("重新定向到目标位置")
                self.find_place(self.target_pos)
    
    def build_path(self, target_location):
        """使用Dijkstra算法构建从当前位置到目标位置的最短路径
        
        Args:
            target_location: 目标位置ID (1-8)
                
        Returns:
            包含路径的位置ID列表
        """
        # 确保位置有效
        if self.current_location < 1 or self.current_location > 8 or target_location < 1 or target_location > 8:
            rospy.logerr("无效的位置: 当前={}, 目标={}".format(self.current_location, target_location))
            return []
                
        # 如果已经在目标位置，返回空路径
        if self.current_location == target_location:
            return []
        
        # 定义图的连接关系及权重（邻接表）- 使用实际距离作为权重
        graph = {
            1: {2: calculate_distance(DESTINATIONS[1], DESTINATIONS[2])},
            2: {
                1: calculate_distance(DESTINATIONS[2], DESTINATIONS[1]),
                3: calculate_distance(DESTINATIONS[2], DESTINATIONS[3]),
                4: calculate_distance(DESTINATIONS[2], DESTINATIONS[4]),
                5: calculate_distance(DESTINATIONS[2], DESTINATIONS[5])
            },
            3: {
                2: calculate_distance(DESTINATIONS[3], DESTINATIONS[2]),
                4: calculate_distance(DESTINATIONS[3], DESTINATIONS[4]),
                5: calculate_distance(DESTINATIONS[3], DESTINATIONS[5])
            },
            4: {
                2: calculate_distance(DESTINATIONS[4], DESTINATIONS[2]),
                3: calculate_distance(DESTINATIONS[4], DESTINATIONS[3]),
                6: calculate_distance(DESTINATIONS[4], DESTINATIONS[6])
            },
            5: {
                2: calculate_distance(DESTINATIONS[5], DESTINATIONS[2]),
                3: calculate_distance(DESTINATIONS[5], DESTINATIONS[3]),
                6: calculate_distance(DESTINATIONS[5], DESTINATIONS[6])
            },
            6: {
                4: calculate_distance(DESTINATIONS[6], DESTINATIONS[4]),
                5: calculate_distance(DESTINATIONS[6], DESTINATIONS[5]),
                7: calculate_distance(DESTINATIONS[6], DESTINATIONS[7])
            },
            7: {
                6: calculate_distance(DESTINATIONS[7], DESTINATIONS[6]),
                8: calculate_distance(DESTINATIONS[7], DESTINATIONS[8])
            },
            8: {7: calculate_distance(DESTINATIONS[8], DESTINATIONS[7])}
        }
        
        # 初始化距离表和前驱节点表
        distances = {node: float('infinity') for node in range(1, 9)}
        previous_nodes = {node: None for node in range(1, 9)}
        distances[self.current_location] = 0
        
        # 未访问节点集合
        unvisited = set(range(1, 9))
        
        while unvisited:
            # 找到距离最短的未访问节点
            current = min(unvisited, key=lambda node: distances[node])
            
            # 如果当前节点是目标或距离是无穷大（不可达），则停止
            if current == target_location or distances[current] == float('infinity'):
                break
                
            # 从未访问集合中移除当前节点
            unvisited.remove(current)
            
            # 检查当前节点的所有邻居
            for neighbor, weight in graph.get(current, {}).items():
                if neighbor in unvisited:
                    # 计算通过当前节点到达邻居的距离
                    distance = distances[current] + weight
                    
                    # 如果找到更短路径，则更新
                    if distance < distances[neighbor]:
                        distances[neighbor] = distance
                        previous_nodes[neighbor] = current
        
        # 重建路径
        path = []
        current = target_location
        
        # 如果没有路径到目标
        if previous_nodes[current] is None and current != self.current_location:
            rospy.logerr("找不到从位置 {} 到位置 {} 的路径".format(self.current_location, target_location))
            return []
            
        # 从目标回溯到起点（不包括起点）
        while current != self.current_location:
            path.append(current)
            current = previous_nodes[current]
            
        # 反转路径，使其从起点指向目标
        return path[::-1]

    def face_exhibit(self, exhibit_id):
        """让机器人面向展品并介绍展品信息"""
        if exhibit_id not in EXHIBITS:
            rospy.logerr("无效的展品ID: {}".format(exhibit_id))
            return False
            
        # 获取展品位置
        exhibit_pos = EXHIBITS[exhibit_id]
        rospy.loginfo("面向展品位置: ({:.4f}, {:.4f})".format(exhibit_pos[0], exhibit_pos[1]))
        
        # 转向展品
        self.find_place(exhibit_pos)
        
        # 执行举手动作（如果IK模块可用）
        if self.ik_module is not None:
            try:
                rospy.loginfo("机器人举手示意...")
                time.sleep(5)
                # 执行举手动作
                self.ik_module.raise_hand()
                time.sleep(5)
            except Exception as e:
                rospy.logerr(f"执行举手动作时出错: {e}")
                # 确保回到行走模式
                SetBodyhubTo_walking(self.control_id)
        else:
            rospy.logwarn("IK模块不可用，跳过举手动作")
        
        # 介绍展品
        rospy.loginfo("开始介绍展品...")
        
        # 打印展品信息
        if exhibit_id in EXHIBIT_INFO:
            # 使用装饰线使展品信息在终端中更醒目
            print("\n" + "="*50)
            print(EXHIBIT_INFO[exhibit_id])
            print("="*50 + "\n")
            
            # 暂停一段时间，让观众有时间阅读/聆听介绍
            rospy.sleep(5.0)
            
        return True
        
    def navigate_to_destination(self, destination_id, is_final_destination=False):
        """导航到指定目的地
        
        Args:
            destination_id: 目的地ID
            is_final_destination: 是否为用户指定的最终目的地
        """
        if destination_id not in DESTINATIONS:
            rospy.logerr("无效的目的地ID: {}".format(destination_id))
            return False
            
        # 设置目标位置
        self.target_pos = DESTINATIONS[destination_id]
        rospy.loginfo("正在导航到位置 {}: ({:.4f}, {:.4f})".format(
            destination_id, self.target_pos[0], self.target_pos[1]))
        
        # 首先转向目标
        self.find_place(self.target_pos)
        
        # 导航循环
        while not rospy.is_shutdown():
            # 检查是否到达目的地
            distance = self.cal_distance(self.target_pos)
            if distance <= DESTINATION_THRESHOLD:
                rospy.loginfo("已到达目的地 {}".format(destination_id))
                
                # 只有当是用户指定的最终目的地，并且是展品点时，才介绍展品
                if is_final_destination and destination_id in EXHIBITS:
                    rospy.loginfo("到达最终目的地，该位置是展品点，准备介绍展品")
                    self.face_exhibit(destination_id)
                
                return True
                
            # 获取障碍物距离并移动
            depth = self.hold_callback()
            self.move(depth)
            
            # 重新转向目标位置（可能在避障后需要）
            self.find_place(self.target_pos)
            
            # 简短暂停
            rospy.sleep(0.1)
    
    def navigate_path(self, path, final_destination):
        """沿路径序列导航
        
        Args:
            path: 要访问的位置ID列表
            final_destination: 用户指定的最终目的地ID
            
        Returns:
            导航成功返回True，否则返回False
        """
        if not path:
            rospy.loginfo("无需导航（已在目的地）")
            return True
            
        rospy.loginfo("导航路径: {}".format("->".join(map(str, path))))
        
        for i, location_id in enumerate(path):
            # 判断当前位置是否为路径中的最后一个位置（即最终目的地）
            is_final = (location_id == final_destination)
            
            if is_final:
                rospy.loginfo("正在导航到最终目的地: {}".format(location_id))
            else:
                rospy.loginfo("正在导航到中间位置: {}".format(location_id))
                
            if not self.navigate_to_destination(location_id, is_final_destination=is_final):
                return False
        
        return True
    
    def run(self):
        """主控制循环"""
        rospy.loginfo("博物馆导览机器人启动")
        rospy.loginfo("请输入数字1-8选择导航目的地:")
        
        # 设置为行走状态
        if not SetBodyhubTo_walking(self.control_id):
            rospy.logerr("设置行走模式失败")
            return
            
        rospy.loginfo("成功设置行走模式")
        
        # 打印目的地选项
        for dest_id, coords in DESTINATIONS.items():
            rospy.loginfo("{}号位置: ({:.4f}, {:.4f})".format(dest_id, coords[0], coords[1]))
        
        # 初始化起始位置
        self.current_location = 1
        rospy.loginfo("机器人当前位置: {}".format(self.current_location))
        
        while not rospy.is_shutdown():
            try:
                # 等待用户输入
                dest_input = input("\n请输入目的地编号(1-8)，或输入q退出: ")
                
                # 检查是否退出
                if dest_input.lower() == 'q':
                    rospy.loginfo("退出程序")
                    break
                    
                # 尝试将输入转换为整数
                try:
                    dest_id = int(dest_input)
                except ValueError:
                    rospy.logerr("请输入有效的数字!")
                    continue
                
                # 验证目的地ID
                if dest_id < 1 or dest_id > 7:
                    rospy.logerr("请输入1到7之间的数字!")
                    continue
                
                # 构建导航路径
                path = self.build_path(dest_id)
                
                if not path:
                    rospy.loginfo("已经在目的地 {}".format(dest_id))
                    # 即使已在目的地，如果是展品点，仍需要面向展品并介绍
                    if dest_id in EXHIBITS:
                        rospy.loginfo("当前位置是展品点，准备介绍展品")
                        self.face_exhibit(dest_id)
                    continue
                    
                # 导航路径
                if self.navigate_path(path, dest_id):
                    # 更新当前位置
                    self.current_location = dest_id
                    rospy.loginfo("导航到位置 {} 完成".format(dest_id))
                else:
                    rospy.logerr("导航到位置 {} 失败".format(dest_id))
                
            except KeyboardInterrupt:
                rospy.loginfo("程序被用户中断")
                break
        
        # 重置机器人
        self.reset()
    
    def reset(self):
        """重置机器人到默认位置"""
        ResetBodyhub()
        
        rospy.loginfo("机器人已重置")

def rosShutdownHook():
    """ROS关闭时的钩子函数"""
    rospy.signal_shutdown('节点关闭')
    ResetBodyhub()
    print("机器人已重置")
    
    # 确保关闭所有OpenCV窗口
    cv2.destroyAllWindows()

if __name__ == '__main__':
    try:
        # 设置信号处理器以便干净地关闭
        rospy.on_shutdown(rosShutdownHook)
        
        # 创建机器人控制器并启用调试输出
        robot = MuseumGuideRobot(debug=True)
        
        # 运行主控制循环
        robot.run()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr("发生错误: {}".format(e))
    finally:
        # 确保在关闭时重置机器人并关闭所有窗口
        ResetBodyhub()
        cv2.destroyAllWindows()