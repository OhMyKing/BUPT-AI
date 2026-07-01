import requests
import time

# 配置请求信息
BASE_URL = "http://127.0.0.1:5004"  # 基础接口地址
HEADERS = {
    "Content-Type": "application/json"  # 确保请求体为 JSON 格式
}

# 空调操作表
OPERATIONS = {
    1: [
        {"roomId": 2001, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"}
    ],
    2: [
        {"roomId": 2001, "power": "on", "temperature": 24, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2002, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"}
    ],
    3: [
        {"roomId": 2003, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"},
    ],
    4: [
        {"roomId": 2002, "power": "on", "temperature": 25, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2004, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2005, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"}
    ],
    5: [
        {"roomId": 2003, "power": "on", "temperature": 27, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2005, "power": "on", "temperature": 22, "windSpeed": "高", "sweep": "开"}
    ],
    6: [
        {"roomId": 2001, "power": "on", "temperature": 24, "windSpeed": "高", "sweep": "开"}
    ],
    8: [
        {"roomId": 2005, "power": "on", "temperature": 24, "windSpeed": "高", "sweep": "开"}
    ],
    10: [
        {"roomId": 2001, "power": "on", "temperature": 28, "windSpeed": "高", "sweep": "开"},
        {"roomId": 2004, "power": "on", "temperature": 28, "windSpeed": "高", "sweep": "开"}
    ],
    12: [
        {"roomId": 2005, "power": "on", "temperature": 24, "windSpeed": "中", "sweep": "开"}
    ],
    13: [
        {"roomId": 2002, "power": "on", "temperature": 25, "windSpeed": "高", "sweep": "开"}
    ],
    15: [
        {"roomId": 2001, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2003, "power": "on", "temperature": 27, "windSpeed": "低", "sweep": "开"}
    ],
    17: [
        {"roomId": 2005, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"}
    ],
    18: [
        {"roomId": 2003, "power": "on", "temperature": 27, "windSpeed": "高", "sweep": "开"}
    ],
    19: [
        {"roomId": 2001, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2004, "power": "on", "temperature": 25, "windSpeed": "中", "sweep": "开"}
    ],
    21: [
        {"roomId": 2002, "power": "on", "temperature": 27, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2005, "power": "on", "temperature": 22, "windSpeed": "中", "sweep": "开"}
    ],
    25: [
        {"roomId": 2001, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2003, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2005, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"}
    ],
    26: [
        {"roomId": 2002, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"},
        {"roomId": 2004, "power": "off", "temperature": 22, "windSpeed": "中", "sweep": "开"},
    ]
}

# 调度记录表
SCHEDULE_RECORDS = [
    ([2001], []),
    ([2001, 2002], []),
    ([2001, 2002, 2003], []),
    ([2001, 2002, 2003], [2004, 2005]),
    ([2005, 2002, 2003], [2004, 2001]),
    ([2005, 2001, 2004], [2003, 2002]),
    ([2005, 2001, 2004], [2003, 2002]),
    ([2005, 2001, 2004], [2004, 2002]),
    ([2005, 2001, 2003], [2004, 2002]),
    ([2005, 2001, 2004], [2003, 2002]),
    ([2005, 2001, 2004], [2003, 2002]),
    ([2002, 2001, 2004], [2003, 2005]),
    ([2002, 2001, 2004], [2003, 2005]),
    ([2002, 2001, 2004], [2003]),
    ([2002, 2005, 2004], [2003]),
    ([2002, 2005, 2004], [2003]),
    ([2002, 2003, 2004], []),
    ([2002, 2003, 2004], []),
    ([2002, 2003, 2001], [2004]),
    ([2004, 2003, 2005], [2002, 2001]),
    ([2004, 2003, 2005], [2002, 2001]),
    ([2002, 2003, 2001], [2004, 2005]),
    ([2002, 2003, 2001], [2004, 2005]),
    ([2002, 2004], [])
]

# 时间控制
START_MINUTE = 1
TOTAL_MINUTES = 27
INTERVAL_SECONDS = 10

def send_control_request(minute, request_body):
    """
    发送空调控制请求
    """
    try:
        response = requests.post(f"{BASE_URL}/aircon/control", json=request_body, headers=HEADERS)
        print(f"[{minute} 分钟控制请求] 响应状态码: {response.status_code}")
        if response.headers.get('Content-Type') == 'application/json':
            response_data = response.json()
            print(f"[{minute} 分钟控制请求] 响应内容: {response_data}")
        else:
            print(f"[{minute} 分钟控制请求] 原始响应: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[{minute} 分钟控制请求] 请求失败: {e}")

def send_schedule_request(minute, running, waiting):
    """
    发送调度记录请求
    """
    try:
        schedule_data = {
            "running": running,
            "waiting": waiting
        }
        response = requests.post(f"{BASE_URL}/admin/add_schedule", json=schedule_data, headers=HEADERS)
        print(f"[{minute} 分钟调度记录] 响应状态码: {response.status_code}")
        if response.headers.get('Content-Type') == 'application/json':
            response_data = response.json()
            print(f"[{minute} 分钟调度记录] 响应内容: {response_data}")
        else:
            print(f"[{minute} 分钟调度记录] 原始响应: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"[{minute} 分钟调度记录] 请求失败: {e}")

def main():
    """
    自动化发送请求主逻辑
    """
    current_minute = START_MINUTE

    while current_minute <= TOTAL_MINUTES:
        # 获取当前分钟的空调操作
        actions = OPERATIONS.get(current_minute, [])

        # 发送空调控制请求
        for action in actions:
            print(f"发送 {current_minute} 分钟空调控制请求: {action}")
            send_control_request(current_minute, action)

        # 发送调度记录请求（如果存在）
        if current_minute <= len(SCHEDULE_RECORDS):
            running, waiting = SCHEDULE_RECORDS[current_minute - 1]
            print(f"发送 {current_minute} 分钟调度记录: running={running}, waiting={waiting}")
            send_schedule_request(current_minute, running, waiting)

        # 等待间隔时间
        time.sleep(INTERVAL_SECONDS)

        # 时间递增
        current_minute += 1

    print("所有请求已完成")

if __name__ == "__main__":
    time.sleep(5)
    main()
