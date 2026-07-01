#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import math
import time
import threading
import json
import numpy as np
from flask import Flask, request, jsonify

import rospy
import rospkg
from cv_bridge import CvBridge
from sensor_msgs.msg import Image
from std_msgs.msg import String

sys.path.append(rospkg.RosPack().get_path('leju_lib_pkg'))
import motion.bodyhub_client as bodycli


# 避障参数
GAIT_RANGE = 0.05  # 每步前进距离（米）
ROTATION_RANGE = 10.0  # 每步旋转角度（度）
ROI = (100, 100)  # 感兴趣区域大小
SAFE_DISTANCE = 500  # 安全距离（mm）
CLOSE_DISTANCE = 250  # 过近距离（mm）
FAR_DISTANCE = 1000  # 较远距离（mm）


class GPSConverter:
    """GPS坐标转换工具类"""
    
    @staticmethod
    def gps_to_local(current_gps, target_gps):
        """
        将GPS坐标转换为本地坐标系
        简化版本：假设地球是平面，使用米为单位
        """
        # 地球半径（米）
        R = 6371000
        
        # 转换为弧度
        lat1 = math.radians(current_gps[1])
        lat2 = math.radians(target_gps[1])
        lon1 = math.radians(current_gps[0])
        lon2 = math.radians(target_gps[0])
        
        # 计算相对位置（米）
        dx = R * math.cos((lat1 + lat2) / 2) * (lon2 - lon1)
        dy = R * (lat2 - lat1)
        
        return dx, dy
    
    @staticmethod
    def calculate_bearing(current_gps, target_gps):
        """计算从当前位置到目标位置的方位角（度）"""
        lat1 = math.radians(current_gps[1])
        lat2 = math.radians(target_gps[1])
        lon1 = math.radians(current_gps[0])
        lon2 = math.radians(target_gps[0])
        
        dlon = lon2 - lon1
        
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        
        bearing = math.degrees(math.atan2(y, x))
        return (bearing + 360) % 360


class ObstacleAvoidanceNavigator:
    """避障导航控制器"""
    
    def __init__(self, bodyhub_client):
        self.bodyhub = bodyhub_client
        self.bridge = CvBridge()
        self.is_navigating = False
        self.current_heading = 0.0  # 当前朝向（度）
        self.target_gps = None
        self.current_gps = None
        self.depth_topic = "/camera/depth/image_rect_raw"
        
    def get_obstacle_distance(self):
        """获取前方障碍物距离"""
        means_distance = []
        for _ in range(5):
            try:
                image = rospy.wait_for_message(self.depth_topic, Image, timeout=1.0)
                cv_image = self.bridge.imgmsg_to_cv2(image, "16UC1")
                cv_image = np.array(cv_image)
                
                height, width = cv_image.shape
                roi_image = cv_image[height // 2 - ROI[1] // 2: height // 2 + ROI[1] // 2,
                                   width // 2 - ROI[0] // 2: width // 2 + ROI[0] // 2]
                mean_distance = roi_image.mean()
                means_distance.append(mean_distance)
            except rospy.ROSException:
                rospy.logwarn("Failed to get depth image")
                return None
                
        return sum(means_distance) / len(means_distance) if means_distance else None
    
    def slow_walk(self, direction, stepnum=1, angle=None):
        """缓慢行走控制"""
        array = [0.0, 0.0, 0.0]
        if direction == "forward":
            array[0] = GAIT_RANGE
        elif direction == "backward":
            array[0] = -1 * GAIT_RANGE
        elif direction == "rotation":
            array[2] = ROTATION_RANGE if angle > 0 else -1 * ROTATION_RANGE
            stepnum = int(abs(angle) / ROTATION_RANGE)
        else:
            rospy.logerr("error walk direction")
            return
            
        for _ in range(stepnum):
            self.bodyhub.walking(array[0], array[1], array[2])
            
        # 更新朝向
        if direction == "rotation":
            self.current_heading += angle
            self.current_heading = self.current_heading % 360
    
    def avoid_obstacle(self, mean_distance):
        """避障行为"""
        if mean_distance < 150:
            rospy.loginfo("Too close to detect, stopping")
            return "stop"
        elif mean_distance < CLOSE_DISTANCE:
            rospy.loginfo("Too close, moving backward")
            self.slow_walk("backward", 1)
            return "backward"
        elif mean_distance < SAFE_DISTANCE:
            rospy.loginfo("Obstacle detected, turning right 30 degrees")
            self.slow_walk("rotation", angle=-30)
            return "turn"
        elif mean_distance > FAR_DISTANCE:
            rospy.loginfo("Path clear, moving forward fast")
            self.slow_walk("forward", 4)
            return "forward_fast"
        else:
            rospy.loginfo("Path clear, moving forward")
            self.slow_walk("forward", 1)
            return "forward"
    
    def navigate_to_gps(self, current_gps, target_gps):
        """导航到目标GPS位置"""
        if self.is_navigating:
            rospy.logwarn("Already navigating, please wait...")
            return False
            
        self.is_navigating = True
        self.current_gps = current_gps
        self.target_gps = target_gps
        
        # 计算目标距离和方位
        dx, dy = GPSConverter.gps_to_local(current_gps, target_gps)
        distance_to_target = math.sqrt(dx**2 + dy**2)
        bearing_to_target = GPSConverter.calculate_bearing(current_gps, target_gps)
        
        rospy.loginfo(f"Navigation started: Distance={distance_to_target:.2f}m, Bearing={bearing_to_target:.1f}°")
        
        # 导航主循环
        while distance_to_target > 0.5 and not rospy.is_shutdown():  # 0.5米误差范围
            if not self.is_navigating:
                rospy.loginfo("Navigation stopped by user")
                break
                
            # 获取障碍物距离
            obstacle_distance = self.get_obstacle_distance()
            if obstacle_distance is None:
                rospy.logerr("Failed to get obstacle distance")
                break
                
            # 计算需要转向的角度
            angle_diff = bearing_to_target - self.current_heading
            # 归一化到[-180, 180]
            while angle_diff > 180:
                angle_diff -= 360
            while angle_diff < -180:
                angle_diff += 360
                
            # 如果角度差较大，先转向
            if abs(angle_diff) > 30:
                rospy.loginfo(f"Adjusting heading: {angle_diff:.1f} degrees")
                self.slow_walk("rotation", angle=angle_diff)
                self.bodyhub.wait_walking_done()
                continue
                
            # 执行避障移动
            action = self.avoid_obstacle(obstacle_distance)
            self.bodyhub.wait_walking_done()
            
            # 更新当前位置估计（简化版本，基于步数估算）
            if action == "forward":
                # 假设每步前进GAIT_RANGE米
                step_distance = GAIT_RANGE
                new_lat = current_gps[1] + (step_distance * math.cos(math.radians(self.current_heading)) / 111111.0)
                new_lon = current_gps[0] + (step_distance * math.sin(math.radians(self.current_heading)) / (111111.0 * math.cos(math.radians(current_gps[1]))))
                current_gps = (new_lon, new_lat)
            elif action == "forward_fast":
                # 快速前进4步
                step_distance = GAIT_RANGE * 4
                new_lat = current_gps[1] + (step_distance * math.cos(math.radians(self.current_heading)) / 111111.0)
                new_lon = current_gps[0] + (step_distance * math.sin(math.radians(self.current_heading)) / (111111.0 * math.cos(math.radians(current_gps[1]))))
                current_gps = (new_lon, new_lat)
                
            # 重新计算距离
            dx, dy = GPSConverter.gps_to_local(current_gps, target_gps)
            distance_to_target = math.sqrt(dx**2 + dy**2)
            bearing_to_target = GPSConverter.calculate_bearing(current_gps, target_gps)
            
            rospy.loginfo(f"Distance remaining: {distance_to_target:.2f}m")
            
        if distance_to_target <= 0.5:
            rospy.loginfo("Reached target GPS location!")
            
        self.is_navigating = False
        return True


class RobotNavigationServer:
    """机器人导航服务器"""
    
    def __init__(self):
        # 初始化ROS节点
        rospy.init_node('robot_obstacle_navigation_server', anonymous=True)
        rospy.on_shutdown(self.__ros_shutdown_hook)
        
        # 初始化bodyhub客户端
        self.bodyhub = bodycli.BodyhubClient(2)
        
        # 初始化避障导航器
        self.navigator = ObstacleAvoidanceNavigator(self.bodyhub)
        
        # 当前GPS位置（写死）
        self.current_gps = (116.290438, 40.163026)
        
        # 初始化Flask服务器
        self.app = Flask(__name__)
        self.setup_routes()
        
        # 准备机器人
        self.prepare_robot()
        
    def __ros_shutdown_hook(self):
        """ROS关闭钩子"""
        if self.bodyhub.reset():
            rospy.loginfo('bodyhub reset, exit')
        else:
            rospy.loginfo('exit')
            
    def prepare_robot(self):
        """准备机器人"""
        # 设置机器人到ready状态
        if not self.bodyhub.ready():
            rospy.logerr('bodyhub to ready failed!')
            rospy.signal_shutdown('error')
            time.sleep(1)
            exit(1)
            
        # 设置机器人到walk状态
        if not self.bodyhub.walk():
            rospy.logerr('bodyhub to walk failed!')
            rospy.signal_shutdown('error')
            time.sleep(1)
            exit(1)
            
        rospy.loginfo("Robot prepared for navigation")
        
    def setup_routes(self):
        """设置Flask路由"""
        
        @self.app.route('/navigate', methods=['POST'])
        def navigate():
            """导航到目标GPS位置"""
            try:
                data = request.get_json()
                
                if 'target_gps' not in data:
                    return jsonify({
                        'success': False,
                        'error': 'Missing target_gps parameter'
                    }), 400
                    
                target_gps = data['target_gps']
                
                # 验证GPS格式
                if not isinstance(target_gps, list) or len(target_gps) != 2:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid GPS format. Expected [longitude, latitude]'
                    }), 400
                    
                rospy.loginfo(f"Navigation request: Current GPS {self.current_gps} -> Target GPS {target_gps}")
                
                # 启动导航线程
                nav_thread = threading.Thread(
                    target=self.navigator.navigate_to_gps,
                    args=(self.current_gps, tuple(target_gps))
                )
                nav_thread.start()
                
                # 计算距离和方位
                dx, dy = GPSConverter.gps_to_local(self.current_gps, tuple(target_gps))
                distance = math.sqrt(dx**2 + dy**2)
                bearing = GPSConverter.calculate_bearing(self.current_gps, tuple(target_gps))
                
                return jsonify({
                    'success': True,
                    'message': 'Navigation started',
                    'current_gps': self.current_gps,
                    'target_gps': target_gps,
                    'distance_meters': round(distance, 2),
                    'bearing_degrees': round(bearing, 1)
                })
                
            except Exception as e:
                rospy.logerr(f"Navigation error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
                
        @self.app.route('/status', methods=['GET'])
        def status():
            """获取导航状态"""
            # 获取当前障碍物距离
            obstacle_distance = self.navigator.get_obstacle_distance()
            
            return jsonify({
                'is_navigating': self.navigator.is_navigating,
                'current_gps': self.current_gps,
                'current_heading': self.navigator.current_heading,
                'obstacle_distance_mm': obstacle_distance if obstacle_distance else None
            })
            
        @self.app.route('/stop', methods=['POST'])
        def stop():
            """停止导航"""
            self.navigator.is_navigating = False
            self.bodyhub.reset()
            return jsonify({
                'success': True,
                'message': 'Navigation stopped'
            })
            
        @self.app.route('/test_obstacle', methods=['GET'])
        def test_obstacle():
            """测试避障功能"""
            try:
                distance = self.navigator.get_obstacle_distance()
                if distance is not None:
                    action = "unknown"
                    if distance < 150:
                        action = "too_close"
                    elif distance < 250:
                        action = "move_backward"
                    elif distance < 500:
                        action = "turn_right"
                    elif distance > 1000:
                        action = "move_forward_fast"
                    else:
                        action = "move_forward"
                        
                    return jsonify({
                        'success': True,
                        'obstacle_distance_mm': distance,
                        'recommended_action': action
                    })
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Failed to get obstacle distance'
                    }), 500
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e)
                }), 500
            
    def start(self):
        """启动服务器"""
        rospy.loginfo("Starting obstacle avoidance navigation server...")
        
        # 在新线程中启动Flask服务器
        flask_thread = threading.Thread(
            target=lambda: self.app.run(host='0.0.0.0', port=5000, debug=False)
        )
        flask_thread.daemon = True
        flask_thread.start()
        
        rospy.loginfo("Navigation server started on http://0.0.0.0:5000")
        rospy.loginfo(f"Current GPS: {self.current_gps}")
        rospy.loginfo("Available endpoints:")
        rospy.loginfo("  POST /navigate - Navigate to GPS target with obstacle avoidance")
        rospy.loginfo("  GET  /status - Get current navigation status")
        rospy.loginfo("  POST /stop - Stop navigation")
        rospy.loginfo("  GET  /test_obstacle - Test obstacle detection")
        
        # 保持ROS节点运行
        rospy.spin()


if __name__ == '__main__':
    try:
        server = RobotNavigationServer()
        server.start()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr(f"Server error: {str(e)}")