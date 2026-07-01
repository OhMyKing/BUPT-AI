#!/usr/bin/python
# coding=utf-8
import cv2
import sys
import os
import requests
import json
import base64
import numpy as np
import threading
import time
import subprocess
import signal
from flask import Flask, jsonify, request
from flask_cors import CORS
import traceback

# 添加lejulib导入路径
sys.path.append('/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts')

if sys.version > '3':
    import queue as Queue
else:
    import Queue

import rospy
from sensor_msgs.msg import Image
from cv_bridge import CvBridge, CvBridgeError
from lejulib import *
import rospkg

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 百度AI API配置
API_KEY = "vwDD9gDsGSHtPv8fdJVMac6R"
SECRET_KEY = "siRKVt6sNPIAgKqk44TII0EfIDPm6LLB"

# 全局变量
QUEUE_IMG = Queue.Queue(maxsize=2)
bridge = CvBridge()
faceadd = rospkg.RosPack().get_path("ros_actions_node") + "/scripts/tracking/haarcascade_frontalface_alt2.xml"
face_detector = cv2.CascadeClassifier(faceadd)

# 人脸识别相关配置
GROUP_ID_LIST = ["student"]  # 可以根据需要修改用户组
RECOGNITION_INTERVAL = 2.0  # 识别间隔（秒）
last_recognition_time = 0
access_token = None

# 识别状态管理
recognition_in_progress = False
recognition_result = None
recognition_event = threading.Event()

# 人脸追踪进程
face_tracking_process = None


class FaceConfig:
    def __init__(self):
        self.running = False  # 默认False，按需启动
        self.size = 0.5
        self.face = 0, 0, 0, 0
        self.found_face = False
        self.center_x = 160
        self.center_y = 120
        self.current_user_id = None  # 当前识别到的用户
        self.face_stable_start_time = 0  # 人脸稳定开始时间
        self.face_stable_duration = 3.0  # 需要人脸稳定的时长（秒）
        self.face_is_stable = False  # 人脸是否稳定
        self.recognition_triggered = False  # 是否已经触发识别
        self.recognition_success = False  # 识别是否成功
        
    def reset(self):
        """重置所有状态"""
        self.running = False
        self.face = 0, 0, 0, 0
        self.found_face = False
        self.current_user_id = None
        self.face_stable_start_time = 0
        self.face_is_stable = False
        self.recognition_triggered = False
        self.recognition_success = False


Face = FaceConfig()


def get_access_token():
    """获取百度AI的访问令牌"""
    global access_token
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {"grant_type": "client_credentials", "client_id": API_KEY, "client_secret": SECRET_KEY}
    try:
        response = requests.post(url, params=params)
        access_token = str(response.json().get("access_token"))
        rospy.loginfo("成功获取百度AI访问令牌")
        return access_token
    except Exception as e:
        rospy.logerr(f"获取访问令牌失败: {e}")
        return None


def image_to_base64(cv_image):
    """将OpenCV图像转换为Base64编码"""
    try:
        _, buffer = cv2.imencode('.jpg', cv_image)
        base64_data = base64.b64encode(buffer).decode('utf-8')
        return base64_data
    except Exception as e:
        rospy.logerr(f"图像编码失败: {e}")
        return None


def face_search_api(cv_image):
    """调用百度AI进行人脸搜索"""
    global access_token, last_recognition_time, recognition_result
    
    # 检查识别间隔
    current_time = time.time()
    if (current_time - last_recognition_time) < RECOGNITION_INTERVAL:
        return Face.current_user_id
    
    if not access_token:
        access_token = get_access_token()
        if not access_token:
            return None
    
    base64_image = image_to_base64(cv_image)
    if not base64_image:
        return None
    
    url = f"https://aip.baidubce.com/rest/2.0/face/v3/search?access_token={access_token}"
    
    payload = json.dumps({
        "image": base64_image,
        "image_type": "BASE64",
        "group_id_list": ",".join(GROUP_ID_LIST),
        "max_face_num": 1,
        "match_threshold": 80,
        "quality_control": "NORMAL",
        "liveness_control": "NONE"
    }, ensure_ascii=False)
    
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, data=payload.encode("utf-8"))
        result = response.json()
        
        if result.get("error_code") == 0:
            user_list = result.get("result", {}).get("user_list", [])
            if user_list:
                user = user_list[0]
                user_id = user.get('user_id')
                score = user.get('score')
                group_id = user.get('group_id')
                
                rospy.loginfo("="*50)
                rospy.loginfo(f"识别成功！")
                rospy.loginfo(f"用户ID: {user_id}")
                rospy.loginfo(f"相似度: {score:.2f}")
                rospy.loginfo(f"用户组: {group_id}")
                rospy.loginfo("="*50)
                
                print(f"\n[人脸识别] 识别到用户: {user_id} (相似度: {score:.2f})")
                
                Face.current_user_id = user_id
                Face.recognition_success = True  # 标记识别成功
                last_recognition_time = current_time
                
                # 设置识别结果
                recognition_result = user_id
                recognition_event.set()  # 通知等待的线程
                
                return user_id
            else:
                rospy.loginfo("未找到匹配的人脸")
                Face.current_user_id = None
        else:
            rospy.logwarn(f"人脸识别失败: {result.get('error_msg')}")
            
    except Exception as e:
        rospy.logerr(f"人脸搜索请求失败: {e}")
    
    return None


def face_size(face):
    """计算人脸面积"""
    x, y, w, h = face
    return w * h


def face_filter(face_list):
    """选择最大的人脸"""
    face_size_list = list(map(face_size, face_list))
    target_index = face_size_list.index(max(face_size_list))
    return face_list[target_index]


def check_face_in_range(face, frame_shape):
    """检查人脸是否在判定范围内"""
    x, y, w, h = face
    face_center_x = x + w / 2
    face_center_y = y + h / 2
    
    # 定义判定范围（可根据需要调整）
    # 这里设置为画面中心的一定范围内
    range_x = frame_shape[1] * 0.2  # 水平方向20%的范围
    range_y = frame_shape[0] * 0.2  # 垂直方向20%的范围
    
    # 检查人脸中心是否在判定范围内
    if abs(face_center_x - Face.center_x) < range_x and abs(face_center_y - Face.center_y) < range_y:
        return True
    return False


def check_face_stability(face, frame_shape):
    """检查人脸是否在判定范围内稳定保持"""
    # 如果已经识别成功，不再进行新的识别
    if Face.recognition_success:
        return False
    
    # 检查人脸是否在判定范围内
    if not check_face_in_range(face, frame_shape):
        # 人脸不在范围内，重置计时器
        Face.face_stable_start_time = 0
        Face.face_is_stable = False
        Face.recognition_triggered = False
        return False
    
    # 人脸在判定范围内
    if Face.face_stable_start_time == 0:
        Face.face_stable_start_time = time.time()
        Face.recognition_triggered = False
    elif time.time() - Face.face_stable_start_time >= Face.face_stable_duration:
        Face.face_is_stable = True
        # 只有当还未触发识别时才返回True
        if not Face.recognition_triggered:
            Face.recognition_triggered = True
            return True
    
    return False


def detectFace():
    """人脸检测和识别主循环"""
    while Face.running:
        time.sleep(0.01)
        if not QUEUE_IMG.empty():
            frame = QUEUE_IMG.get()
        else:
            continue
        
        # 检测人脸
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face_locations = face_detector.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=3, 
            minSize=(int(frame.shape[1] / 12), int(frame.shape[0] / 12)),
            maxSize=(int(2 * frame.shape[1] / 3), int(2 * frame.shape[1] / 3)))
        
        if len(face_locations) > 0:
            Face.found_face = True
            Face.face = face_filter(face_locations)
            
            # 显示检测到的人脸
            show_face(Face.face)
            
            # 检查人脸稳定性，只有在判定范围内稳定3秒后才进行识别
            if check_face_stability(Face.face, frame.shape):
                rospy.loginfo("人脸在判定范围内已稳定3秒，开始识别...")
                face_search_api(frame)
        else:
            Face.found_face = False
            Face.face = 0, 0, 0, 0
            Face.face_stable_start_time = 0
            Face.face_is_stable = False
            Face.recognition_triggered = False
            
            # 清除标签
            show_face(Face.face)
        
        # 如果识别成功，继续显示标签
        if Face.recognition_success:
            show_face(Face.face)


def show_face(face):
    """显示人脸标签"""
    if face[2] == 0 or face[3] == 0:
        # 清除标签
        client_label.set_camera_label((0, 0, 0), (0, 0), 0, 0)
        return
        
    face_cx = (face[0] + face[2] / 2) / Face.size
    face_cy = (face[1] + face[3] / 2) / Face.size
    
    # 根据状态选择颜色
    if Face.current_user_id:
        label_color = (0, 255, 0)  # 绿色：已识别用户
    elif Face.recognition_triggered and Face.face_is_stable:
        label_color = (0, 255, 255)  # 黄色：正在识别中
    elif Face.face_stable_start_time > 0 and not Face.face_is_stable:
        # 计算稳定进度
        elapsed = time.time() - Face.face_stable_start_time if Face.face_stable_start_time > 0 else 0
        progress = min(elapsed / Face.face_stable_duration, 1.0)
        # 从红色渐变到橙色
        label_color = (255, int(165 * progress), 0)  # 红色到橙色渐变
    else:
        label_color = (255, 0, 0)  # 红色：未识别
    
    # 如果人脸在判定范围内，添加特殊标记
    if Face.found_face and check_face_in_range(face, (240, 320, 3)):  # 假设图像大小
        # 可以在这里添加额外的视觉提示
        pass
    
    client_label.set_camera_label(label_color, (face_cx, face_cy), 
                                  face[2]/Face.size, face[3]/Face.size)


def image_callback(msg):
    """图像回调函数"""
    try:
        cv2_img = bridge.imgmsg_to_cv2(msg, "bgr8")
    except CvBridgeError as err:
        print(err)
    else:
        cv2_img = cv2.resize(cv2_img, (0, 0), fx=Face.size, fy=Face.size)
        if QUEUE_IMG.full():
            QUEUE_IMG.get()
        QUEUE_IMG.put(cv2_img, block=True)


def start_face_tracking():
    """启动人脸追踪进程"""
    global face_tracking_process
    try:
        # 启动人脸追踪脚本
        tracking_script = "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/人脸追踪案例.py"
        face_tracking_process = subprocess.Popen(
            ["python3", tracking_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        rospy.loginfo(f"人脸追踪进程已启动 (PID: {face_tracking_process.pid})")
        return True
    except Exception as e:
        rospy.logerr(f"启动人脸追踪进程失败: {e}")
        return False


def stop_face_tracking():
    """停止人脸追踪进程"""
    global face_tracking_process
    if face_tracking_process and face_tracking_process.poll() is None:
        try:
            face_tracking_process.terminate()
            face_tracking_process.wait(timeout=5)
            rospy.loginfo("人脸追踪进程已停止")
        except subprocess.TimeoutExpired:
            face_tracking_process.kill()
            rospy.logwarn("强制终止人脸追踪进程")
        except Exception as e:
            rospy.logerr(f"停止人脸追踪进程失败: {e}")


def start_recognition():
    """启动识别流程"""
    global recognition_in_progress, recognition_result, recognition_event
    
    if recognition_in_progress:
        return False, "识别正在进行中"
    
    # 重置状态
    Face.reset()
    recognition_result = None
    recognition_event.clear()
    recognition_in_progress = True
    Face.running = True
    
    # 启动人脸追踪（如果尚未启动）
    if not face_tracking_process or face_tracking_process.poll() is not None:
        start_face_tracking()
    
    # 启动标签显示
    client_controller.send_label_on(True)
    client_controller.send_video_status(True, "/camera/label/image_raw", width=640, height=480)
    
    # 启动识别线程
    threading.Thread(target=detectFace, daemon=True).start()
    
    rospy.loginfo("开始人脸识别流程...")
    return True, "识别流程已启动"


def stop_recognition():
    """停止识别流程"""
    global recognition_in_progress
    
    Face.running = False
    client_controller.send_label_on(False)
    client_controller.send_video_status(False, "/camera/label/image_raw", width=640, height=480)
    
    # 停止人脸追踪进程
    stop_face_tracking()
    
    recognition_in_progress = False
    rospy.loginfo("停止人脸识别流程")


# Flask路由
@app.route('/recognize', methods=['GET'])
def recognize():
    """识别接口"""
    global recognition_result, recognition_event
    
    try:
        # 启动识别
        success, message = start_recognition()
        if not success:
            return jsonify({"error": message}), 400
        
        # 等待识别结果（最多等待30秒）
        if recognition_event.wait(timeout=30):
            # 识别成功
            result = {"user_id": recognition_result}
            rospy.loginfo(f"返回识别结果: {result}")
            return jsonify(result), 200
        else:
            # 超时
            stop_recognition()
            return jsonify({"error": "识别超时，未找到匹配的人脸"}), 408
            
    except Exception as e:
        rospy.logerr(f"识别过程出错: {e}")
        traceback.print_exc()
        stop_recognition()
        return jsonify({"error": str(e)}), 500
    finally:
        # 清理
        stop_recognition()
        global recognition_in_progress
        recognition_in_progress = False


@app.route('/status', methods=['GET'])
def get_status():
    """获取当前状态"""
    tracking_status = "running" if (face_tracking_process and face_tracking_process.poll() is None) else "stopped"
    return jsonify({
        "recognition_in_progress": recognition_in_progress,
        "current_user_id": Face.current_user_id,
        "face_found": Face.found_face,
        "face_is_stable": Face.face_is_stable,
        "face_tracking_status": tracking_status
    }), 200


@app.route('/stop', methods=['POST'])
def stop():
    """强制停止识别"""
    stop_recognition()
    return jsonify({"message": "识别已停止"}), 200


@app.route('/tracking/start', methods=['POST'])
def start_tracking():
    """启动人脸追踪"""
    if start_face_tracking():
        return jsonify({"message": "人脸追踪已启动"}), 200
    else:
        return jsonify({"error": "启动人脸追踪失败"}), 500


@app.route('/tracking/stop', methods=['POST'])
def stop_tracking():
    """停止人脸追踪"""
    stop_face_tracking()
    return jsonify({"message": "人脸追踪已停止"}), 200


def cleanup(signum, frame):
    """清理函数"""
    rospy.loginfo("正在清理资源...")
    stop_recognition()
    stop_face_tracking()
    sys.exit(0)


def init_ros():
    """初始化ROS节点"""
    node_initial(name="face_recognition_server")
    rospy.sleep(0.2)
    
    rospy.loginfo("人脸识别服务器启动中...")
    
    # 初始化百度AI访问令牌
    get_access_token()
    
    # 订阅图像话题
    image_topic = "/camera/color/image_raw"
    rospy.Subscriber(image_topic, Image, image_callback)
    
    rospy.loginfo(f"正在监听话题: {image_topic}")
    rospy.loginfo(f"识别用户组: {', '.join(GROUP_ID_LIST)}")
    rospy.loginfo(f"识别间隔: {RECOGNITION_INTERVAL}秒")
    rospy.loginfo(f"人脸稳定时间要求: {Face.face_stable_duration}秒")
    
    # 启动人脸追踪进程
    # start_face_tracking()


def main():
    # 设置信号处理
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    # 初始化ROS
    init_ros()
    
    # 启动Flask服务器
    rospy.loginfo("Flask服务器启动在 http://0.0.0.0:5001")
    rospy.loginfo("接口:")
    rospy.loginfo("  GET  /recognize      - 开始人脸识别")
    rospy.loginfo("  GET  /status         - 获取当前状态")
    rospy.loginfo("  POST /stop           - 强制停止识别")
    rospy.loginfo("  POST /tracking/start - 启动人脸追踪")
    rospy.loginfo("  POST /tracking/stop  - 停止人脸追踪")
    
    # 在单独的线程中运行Flask，以便ROS可以继续运行
    flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5001, debug=False))
    flask_thread.daemon = True
    flask_thread.start()
    
    # 保持ROS运行
    try:
        rospy.spin()
    finally:
        cleanup(None, None)


if __name__ == '__main__':
    main()