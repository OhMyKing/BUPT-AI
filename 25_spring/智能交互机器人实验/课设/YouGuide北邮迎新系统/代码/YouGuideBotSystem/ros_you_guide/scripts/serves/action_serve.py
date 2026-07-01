#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request
import subprocess
import json
import logging
from datetime import datetime
import os

app = Flask(__name__)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 动作配置
ACTIONS = {
    "举手": {
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/举手.py"
    }, 
    "伸展手臂": {
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/伸展手臂.py"
    }, 
    "点头": {
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/点头.py"
    },
    "摇头": {
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/摇头.py"
    },
    "鞠躬": {
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/鞠躬.py"
    },
    "下蹲":{
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/下蹲.py"
    },
    "前进一步":{
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/前进一步.py"
    },
    "后退一步":{
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/后退一步.py"
    },
    "左移一步":{
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/左移一步.py"
    },
    "右移一步":{
        "cmd_type": "run_node",
        "path": "/home/lemon/robot_ros_application/catkin_ws/src/ros_actions_node/scripts/右移一步.py"
    },
}

@app.route('/')
def home():
    """主页，显示可用的动作列表"""
    return jsonify({
        "message": "机器人动作控制服务器",
        "available_actions": list(ACTIONS.keys()),
        "usage": {
            "执行动作": "GET /action/<动作名称>",
            "查看所有动作": "GET /actions",
            "健康检查": "GET /health"
        }
    })

@app.route('/actions', methods=['GET'])
def list_actions():
    """列出所有可用的动作"""
    return jsonify({
        "actions": list(ACTIONS.keys()),
        "total": len(ACTIONS)
    })

@app.route('/action/<action_name>', methods=['GET'])
def execute_action(action_name):
    """执行指定的动作（异步启动，立即返回）"""
    
    # 检查动作是否存在
    if action_name not in ACTIONS:
        logger.warning(f"请求了不存在的动作: {action_name}")
        return jsonify({
            "success": False,
            "error": f"动作 '{action_name}' 不存在",
            "available_actions": list(ACTIONS.keys())
        }), 404
    
    action_config = ACTIONS[action_name]
    script_path = action_config["path"]
    
    # 检查脚本文件是否存在
    if not os.path.exists(script_path):
        logger.error(f"脚本文件不存在: {script_path}")
        return jsonify({
            "success": False,
            "error": f"脚本文件不存在: {script_path}"
        }), 500
    
    try:
        # 记录执行开始
        logger.info(f"启动动作: {action_name}")
        logger.info(f"脚本路径: {script_path}")
        
        # 异步启动Python脚本（不等待完成）
        process = subprocess.Popen(
            ['python3', script_path],
            stdout=subprocess.DEVNULL,  # 不捕获输出
            stderr=subprocess.DEVNULL,  # 不捕获错误输出
            preexec_fn=os.setsid if hasattr(os, 'setsid') else None  # Linux下创建新进程组
        )
        
        logger.info(f"动作 '{action_name}' 已启动，进程ID: {process.pid}")
        
        # 立即返回成功响应
        return jsonify({
            "success": True,
            "action": action_name,
            "message": f"动作 '{action_name}' 已启动",
            "process_id": process.pid,
            "timestamp": datetime.now().isoformat(),
            "note": "动作正在后台执行，无需等待完成"
        })
        
    except Exception as e:
        logger.error(f"启动动作 '{action_name}' 时发生错误: {str(e)}")
        return jsonify({
            "success": False,
            "action": action_name,
            "error": f"启动错误: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "actions_count": len(ACTIONS)
    })

@app.errorhandler(404)
def not_found(error):
    """处理404错误"""
    return jsonify({
        "success": False,
        "error": "请求的资源不存在",
        "message": "请访问 / 查看可用的端点"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """处理500错误"""
    return jsonify({
        "success": False,
        "error": "服务器内部错误",
        "message": str(error)
    }), 500

if __name__ == '__main__':
    # 打印启动信息
    print("=" * 50)
    print("机器人动作控制服务器")
    print("=" * 50)
    print(f"可用动作: {', '.join(ACTIONS.keys())}")
    print("=" * 50)
    print("服务器启动中...")
    print("访问 http://<服务器IP>:5000/ 查看可用端点")
    print("=" * 50)
    
    # 启动Flask服务器
    # host='0.0.0.0' 允许局域网内其他设备访问
    # debug=False 在生产环境中关闭调试模式
    app.run(host='0.0.0.0', port=5000, debug=False)