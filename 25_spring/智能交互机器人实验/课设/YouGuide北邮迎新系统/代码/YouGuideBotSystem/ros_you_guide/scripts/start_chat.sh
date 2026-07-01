#!/bin/bash

# 定义基础路径
BASE_PATH="/home/lemon/robot_ros_application/catkin_ws/src/ros_you_guide"

# 存储所有子进程的PID
declare -a PIDS

# 清理函数：杀死所有子进程
cleanup() {
    echo "正在关闭所有终端..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid" 2>/dev/null
            echo "已发送终止信号到进程 $pid"
        fi
    done
    # 等待一会儿，如果进程还在运行，强制杀死
    sleep 2
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null
            echo "强制终止进程 $pid"
        fi
    done
    echo "所有终端已关闭"
    exit 0
}

# 设置信号捕获，当脚本收到中断信号时执行清理
trap cleanup SIGINT SIGTERM EXIT

# 检查gnome-terminal是否可用
if ! command -v gnome-terminal &> /dev/null; then
    echo "错误：gnome-terminal 未安装"
    echo "请使用以下命令安装："
    echo "sudo apt-get install gnome-terminal"
    exit 1
fi

# 启动终端1 - tts_node.py
echo "启动终端1: tts_node.py"
gnome-terminal --title="TTS Node" -- bash -c "cd $BASE_PATH/scripts/nodes && python3 tts_node.py; exec bash" &
PIDS+=($!)
sleep 1

# 启动终端2 - asr_node.py
echo "启动终端2: asr_node.py"
gnome-terminal --title="ASR Node" -- bash -c "cd $BASE_PATH/scripts/nodes && python3 asr_node.py; exec bash" &
PIDS+=($!)
sleep 1

# 启动终端3 - action_serve.py
echo "启动终端3: action_serve.py"
gnome-terminal --title="Action Serve" -- bash -c "cd $BASE_PATH/scripts/serves && python3 action_serve.py; exec bash" &
PIDS+=($!)
sleep 1

# 启动终端4 - face_serve.py
echo "启动终端4: face_serve.py"
gnome-terminal --title="Face Serve" -- bash -c "cd $BASE_PATH/scripts/serves && python3 face_serve.py; exec bash" &
PIDS+=($!)
sleep 1

# 启动终端5 - chat.py
echo "启动终端5: chat.py"
gnome-terminal --title="Chat" -- bash -c "cd $BASE_PATH/scripts && python3 chat.py; exec bash" &
PIDS+=($!)

echo "所有终端已启动"
echo "进程PID列表: ${PIDS[*]}"
echo "按 Ctrl+C 关闭所有终端"

# 保持脚本运行，直到收到中断信号
while true; do
    sleep 1
done