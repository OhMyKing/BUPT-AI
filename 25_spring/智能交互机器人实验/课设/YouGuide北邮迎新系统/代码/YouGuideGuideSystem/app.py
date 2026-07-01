from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime
import requests
import math

app = Flask(__name__)
CORS(app)

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'database': 'YouGuideManagementSystem',
    'user': 'root',
    'password': 'QuarkWang@163.com'
}

# 百度地图API密钥
BAIDU_MAP_AK = "1lxfqOJwwxUVOqiRwU691M3pJWvkb17X"

PREDEFINED_DESTINATIONS = {
    "雁北A": {"latitude": 40.164607, "longitude": 116.295085},
    "雁北C": {"latitude": 40.165055, "longitude": 116.294815},
    "雁北D1": {"latitude": 40.164938, "longitude": 116.29522},
    "雁北D2": {"latitude": 40.165727, "longitude": 116.294914},
    "雁南S2": {"latitude": 40.164042, "longitude": 116.295833},
    "雁南S3": {"latitude": 40.163463, "longitude": 116.295712},
    "雁南S4": {"latitude": 40.163084, "longitude": 116.295802},
    "雁南S5": {"latitude": 40.162101, "longitude": 116.296661},
    "雁南S6": {"latitude": 40.16203, "longitude": 116.295664},
    "南门": {"latitude": 40.161826, "longitude": 116.298965},
    "西门": {"latitude": 40.163026, "longitude": 116.290438},
    "人工智能学院资料领取点": {"latitude": 40.162028, "longitude": 116.298729},
    "计算机学院资料领取点": {"latitude": 40.162237, "longitude": 116.298639},
    "通信学院资料领取点": {"latitude": 40.16248, "longitude": 116.298536},
    "现代邮政学院资料领取点": {"latitude": 40.162709, "longitude": 116.298442},
    "电子学院资料领取点": {"latitude": 40.162954, "longitude": 116.298329}
}

def get_db_connection():
    """获取数据库连接"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"数据库连接错误: {e}")
        return None

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')

@app.route('/api/robots', methods=['GET'])
def get_robots():
    """获取所有机器人信息"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': '数据库连接失败'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT r.*, 
                   kp.name as target_name,
                   hs.name as health_state,
                   rt.name as robot_type
            FROM robots r
            LEFT JOIN key_positions kp ON r.target_position_id = kp.id
            LEFT JOIN health_states hs ON r.health_state_id = hs.id
            LEFT JOIN robot_types rt ON r.robot_type_id = rt.id
        """
        cursor.execute(query)
        robots = cursor.fetchall()
        
        # 转换Decimal类型为float
        for robot in robots:
            for key in ['current_latitude', 'current_longitude', 'target_latitude', 'target_longitude', 'battery_level']:
                if robot.get(key) is not None:
                    robot[key] = float(robot[key])
        
        return jsonify(robots)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/key_positions', methods=['GET'])
def get_key_positions():
    """获取所有关键位置"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': '数据库连接失败'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM key_positions ORDER BY id")
        positions = cursor.fetchall()
        
        # 转换Decimal类型为float
        for pos in positions:
            pos['latitude'] = float(pos['latitude'])
            pos['longitude'] = float(pos['longitude'])
        
        return jsonify(positions)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/robot/<int:robot_id>/navigate', methods=['POST'])
def set_navigation_target(robot_id):
    """设置机器人导航目标"""
    data = request.json
    target_position_id = data.get('target_position_id')
    
    if not target_position_id:
        return jsonify({'error': '缺少目标位置ID'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': '数据库连接失败'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 获取目标位置的坐标
        cursor.execute("SELECT latitude, longitude FROM key_positions WHERE id = %s", (target_position_id,))
        target_pos = cursor.fetchone()
        
        if not target_pos:
            return jsonify({'error': '目标位置不存在'}), 404
        
        # 更新机器人的目标位置
        update_query = """
            UPDATE robots 
            SET target_position_id = %s,
                target_latitude = %s,
                target_longitude = %s
            WHERE robot_id = %s
        """
        cursor.execute(update_query, (
            target_position_id,
            target_pos['latitude'],
            target_pos['longitude'],
            robot_id
        ))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '导航目标设置成功',
            'robot_id': robot_id,
            'target_position_id': target_position_id
        })
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/robot/<int:robot_id>/stop', methods=['POST'])
def stop_navigation(robot_id):
    """停止机器人导航"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': '数据库连接失败'}), 500
    
    try:
        cursor = conn.cursor()
        update_query = """
            UPDATE robots 
            SET target_position_id = NULL,
                target_latitude = NULL,
                target_longitude = NULL
            WHERE robot_id = %s
        """
        cursor.execute(update_query, (robot_id,))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '导航已停止',
            'robot_id': robot_id
        })
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/route', methods=['POST'])
def get_route():
    """获取导航路线（调用百度地图API）"""
    data = request.json
    origin = data.get('origin')  # {latitude, longitude}
    destination = data.get('destination')  # {latitude, longitude}
    
    if not origin or not destination:
        return jsonify({'error': '缺少起点或终点'}), 400
    
    # 调用百度地图步行路线API
    url = "https://api.map.baidu.com/direction/v2/walking"
    params = {
        'origin': f"{origin['latitude']},{origin['longitude']}",
        'destination': f"{destination['latitude']},{destination['longitude']}",
        'ak': BAIDU_MAP_AK,
        'output': 'json'
    }
    
    try:
        response = requests.get(url, params=params)
        route_data = response.json()
        
        if route_data.get('status') == 0:
            return jsonify(route_data)
        else:
            return jsonify({'error': '路线规划失败', 'message': route_data.get('message')}), 400
    except Exception as e:
        return jsonify({'error': '路线规划请求失败', 'message': str(e)}), 500

@app.route('/api/robot/<int:robot_id>/update_position', methods=['POST'])
def update_robot_position(robot_id):
    """更新机器人当前位置（模拟）"""
    data = request.json
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    battery_level = data.get('battery_level')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': '数据库连接失败'}), 500
    
    try:
        cursor = conn.cursor()
        update_parts = []
        params = []
        
        if latitude is not None and longitude is not None:
            update_parts.append("current_latitude = %s, current_longitude = %s")
            params.extend([latitude, longitude])
        
        if battery_level is not None:
            update_parts.append("battery_level = %s")
            params.append(battery_level)
        
        if update_parts:
            query = f"UPDATE robots SET {', '.join(update_parts)} WHERE robot_id = %s"
            params.append(robot_id)
            cursor.execute(query, params)
            conn.commit()
        
        return jsonify({'success': True, 'robot_id': robot_id})
    except Error as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    计算两点间的距离（使用球面距离公式）
    返回距离（单位：米）
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
    
    # 将角度转换为弧度
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine公式
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # 地球半径（米）
    r = 6371000
    distance = c * r
    
    return distance

@app.route('/api/publish_guide_task', methods=['POST'])
def publish_guide_task():
    """
    发布引导任务
    请求参数：
    {
        "robot_id": 1,              # 发布任务的机器人ID
        "destination": "目的地名称"   # 目的地字符串
    }
    """
    data = request.json
    robot_id = data.get('robot_id')
    destination = data.get('destination')
    
    # 参数验证
    if not robot_id or not destination:
        return jsonify({'error': '缺少机器人ID或目的地'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': '数据库连接失败'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. 验证目的地是否存在
        cursor.execute("SELECT id, name, latitude, longitude FROM key_positions WHERE name = %s", (destination,))
        destination_info = cursor.fetchone()
        
        if not destination_info:
            return jsonify({'error': f'目的地"{destination}"不存在'}), 404
        
        # 2. 获取发布任务的机器人当前位置
        cursor.execute("""
            SELECT robot_id, current_latitude, current_longitude 
            FROM robots 
            WHERE robot_id = %s
        """, (robot_id,))
        source_robot = cursor.fetchone()
        
        if not source_robot:
            return jsonify({'error': f'机器人{robot_id}不存在'}), 404
        
        if source_robot['current_latitude'] is None or source_robot['current_longitude'] is None:
            return jsonify({'error': f'机器人{robot_id}位置信息不完整'}), 400
        
        # 3. 查找所有空闲的引导机器人（robot_type_id=0且target_position_id为NULL）
        cursor.execute("""
            SELECT robot_id, current_latitude, current_longitude
            FROM robots 
            WHERE robot_type_id = 0 
            AND target_position_id IS NULL
            AND current_latitude IS NOT NULL 
            AND current_longitude IS NOT NULL
        """)
        available_guides = cursor.fetchall()
        
        if not available_guides:
            return jsonify({'error': '没有可用的空闲引导机器人'}), 404
        
        # 4. 计算距离，找到最近的引导机器人
        source_lat = float(source_robot['current_latitude'])
        source_lon = float(source_robot['current_longitude'])
        
        closest_guide = None
        min_distance = float('inf')
        
        for guide in available_guides:
            guide_lat = float(guide['current_latitude'])
            guide_lon = float(guide['current_longitude'])
            
            distance = calculate_distance(source_lat, source_lon, guide_lat, guide_lon)
            
            if distance < min_distance:
                min_distance = distance
                closest_guide = guide
        
        if not closest_guide:
            return jsonify({'error': '无法找到合适的引导机器人'}), 500
        
        # 5. 为最近的引导机器人设置导航任务
        guide_robot_id = closest_guide['robot_id']
        destination_id = destination_info['id']
        dest_lat = float(destination_info['latitude'])
        dest_lon = float(destination_info['longitude'])
        
        update_query = """
            UPDATE robots 
            SET target_position_id = %s,
                target_latitude = %s,
                target_longitude = %s
            WHERE robot_id = %s
        """
        cursor.execute(update_query, (destination_id, dest_lat, dest_lon, guide_robot_id))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': '引导任务发布成功',
            'task_details': {
                'source_robot_id': robot_id,
                'guide_robot_id': guide_robot_id,
                'destination': destination,
                'destination_id': destination_id,
                'distance_to_guide': round(min_distance, 2)  # 到引导机器人的距离（米）
            }
        })
        
    except Error as e:
        conn.rollback()
        return jsonify({'error': f'数据库操作失败: {str(e)}'}), 500
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'操作失败: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/route_suggestion', methods=['GET'])
def get_route_suggestion():
    """
    获取从当前位置到指定地点的路线建议
    
    请求参数：
    - current_lat: 当前位置纬度
    - current_lon: 当前位置经度
    - destination: 目的地名称（必须是预定义的地点之一）
    
    返回：
    - 易读的路线指示字符串
    """
    # 获取请求参数
    current_lat = request.args.get('current_lat', type=float)
    current_lon = request.args.get('current_lon', type=float)
    destination_name = request.args.get('destination')
    
    # 参数验证
    if current_lat is None or current_lon is None:
        return jsonify({'error': '缺少当前位置坐标参数'}), 400
    
    if not destination_name:
        return jsonify({'error': '缺少目的地参数'}), 400
    
    # 查找目的地坐标
    if destination_name not in PREDEFINED_DESTINATIONS:
        return jsonify({
            'error': f'目的地"{destination_name}"不存在',
            'available_destinations': list(PREDEFINED_DESTINATIONS.keys())
        }), 404
    
    destination_coords = PREDEFINED_DESTINATIONS[destination_name]
    
    # 调用百度地图步行路线API
    url = "https://api.map.baidu.com/direction/v2/walking"
    params = {
        'origin': f"{current_lat},{current_lon}",
        'destination': f"{destination_coords['latitude']},{destination_coords['longitude']}",
        'ak': BAIDU_MAP_AK,
        'output': 'json'
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        route_data = response.json()
        
        if route_data.get('status') != 0:
            return jsonify({
                'error': '路线规划失败',
                'message': route_data.get('message', '未知错误')
            }), 400
        
        # 解析路线数据
        result = route_data.get('result', {})
        routes = result.get('routes', [])
        
        if not routes:
            return jsonify({'error': '未找到可行路线'}), 404
        
        # 获取第一条路线（通常是最优路线）
        route = routes[0]
        distance = route.get('distance', 0)  # 总距离（米）
        duration = route.get('duration', 0)  # 总时间（秒）
        steps = route.get('steps', [])
        
        # 构建易读的路线建议
        route_suggestions = []
        
        # 添加总览信息
        route_suggestions.append(f"前往{destination_name}的路线建议：")
        route_suggestions.append(f"总距离：{distance}米，预计步行时间：{duration//60}分钟")
        route_suggestions.append("")  # 空行
        route_suggestions.append("详细路线：")
        
        # 添加分步指示
        for i, step in enumerate(steps, 1):
            instruction = step.get('instructions', '')
            step_distance = step.get('distance', 0)
            road_name = step.get('name', '')
            
            # 构建单步指示
            step_text = f"{i}. {instruction}"
            if road_name and road_name != '无名路':
                step_text += f"（{road_name}）"
            if step_distance > 0:
                step_text += f" - {step_distance}米"
            
            route_suggestions.append(step_text)
        
        # 将所有指示合并为一个字符串
        suggestion_text = '\n'.join(route_suggestions)
        
        return jsonify({
            'success': True,
            'destination': destination_name,
            'total_distance': distance,
            'estimated_time': duration,
            'route_suggestion': suggestion_text,
            'steps_count': len(steps)
        })
        
    except requests.exceptions.Timeout:
        return jsonify({'error': '请求超时，请稍后重试'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'网络请求失败: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'服务器内部错误: {str(e)}'}), 500
        
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5005)