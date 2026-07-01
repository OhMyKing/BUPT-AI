import requests
import json
import time
import math
import mysql.connector
from typing import List, Tuple, Dict, Optional
from datetime import datetime
from mysql.connector import Error
import threading
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

class DatabaseRobotNavigator:
    def __init__(self, ak: str, db_config: dict):
        """
        初始化数据库机器人导航器
        :param ak: 百度地图API密钥
        :param db_config: 数据库配置
        """
        self.ak = ak
        self.db_config = db_config
        self.api_url = "https://api.map.baidu.com/direction/v2/walking"
        self.connection = None
        self.cursor = None
        self.running = True
        self.robot_paths = {}  # 存储每个机器人的路径信息
        
        # 新增：机器人通信相关
        self.robot_ip = "192.168.3.57"
        self.robot_port = 5000
        self.robot_4_first_update = {}  # 记录机器人4是否已经第一次更新
        
    def connect_database(self):
        """连接到MySQL数据库"""
        try:
            # 先建立连接，不设置 isolation_level
            self.connection = mysql.connector.connect(
                **self.db_config,
                autocommit=True  # 自动提交，确保能看到最新数据
            )
            self.cursor = self.connection.cursor(dictionary=True)
            
            # 连接成功后，通过 SQL 设置隔离级别
            self.cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
            
            logger.info("数据库连接成功")
            return True
        except Error as e:
            logger.error(f"数据库连接失败: {e}")
            return False

    def disconnect_database(self):
        """断开数据库连接"""
        if self.cursor:
            self.cursor.close()
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("数据库连接已关闭")
    
    def refresh_connection(self):
        """刷新数据库连接以确保能获取最新数据"""
        try:
            # 如果连接存在，先执行一个简单查询来刷新连接
            if self.connection and self.connection.is_connected():
                self.cursor.execute("SELECT 1")
                self.cursor.fetchall()  # 清空结果集
            else:
                # 如果连接断开，重新连接
                self.connect_database()
        except:
            # 如果出错，重新连接
            self.disconnect_database()
            self.connect_database()
    
    def send_navigation_command(self, target_gps: Tuple[float, float]) -> bool:
        """
        向机器人发送导航命令
        :param target_gps: 目标GPS坐标 (纬度, 经度)
        :return: 是否成功
        """
        url = f"http://{self.robot_ip}:{self.robot_port}/navigate"
        data = {
            "target_gps": [target_gps[1], target_gps[0]]  # 转换为 [经度, 纬度] 格式
        }
        
        try:
            response = requests.post(url, json=data, timeout=5)
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    logger.info(f"成功向机器人发送导航命令: 目标 {target_gps}")
                    logger.info(f"距离: {result.get('distance_meters')}米, 方位: {result.get('bearing_degrees')}度")
                    return True
                else:
                    logger.error(f"机器人导航命令失败: {result.get('error')}")
            else:
                logger.error(f"机器人导航请求失败: HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"无法连接到机器人: {e}")
        except Exception as e:
            logger.error(f"发送导航命令时出错: {e}")
        
        return False
    
    def send_stop_command(self) -> bool:
        """
        向机器人发送停止导航命令
        :return: 是否成功
        """
        url = f"http://{self.robot_ip}:{self.robot_port}/stop"
        
        try:
            response = requests.post(url, timeout=5)
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    logger.info("成功向机器人发送停止命令")
                    return True
                else:
                    logger.error(f"机器人停止命令失败: {result.get('error')}")
            else:
                logger.error(f"机器人停止请求失败: HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"无法连接到机器人: {e}")
        except Exception as e:
            logger.error(f"发送停止命令时出错: {e}")
        
        return False
    
    def get_robot_status(self) -> Optional[Dict]:
        """
        获取机器人导航状态
        :return: 状态信息字典
        """
        url = f"http://{self.robot_ip}:{self.robot_port}/status"
        
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        
        return None
    
    def calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """
        计算两个GPS点之间的距离（使用简化的欧氏距离，单位：米）
        :param point1: (纬度, 经度)
        :param point2: (纬度, 经度)
        :return: 距离（米）
        """
        # 简化计算：1度约等于111公里
        lat_diff = (point1[0] - point2[0]) * 111000
        lng_diff = (point1[1] - point2[1]) * 111000 * math.cos(math.radians(point1[0]))
        return math.sqrt(lat_diff**2 + lng_diff**2)
    
    def search_walking_route(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict:
        """
        调用百度地图API搜索步行路线
        :param origin: 起点GPS (纬度, 经度)
        :param destination: 终点GPS (纬度, 经度)
        :return: API返回的路线数据
        """
        params = {
            'origin': f"{origin[0]},{origin[1]}",
            'destination': f"{destination[0]},{destination[1]}",
            'ak': self.ak,
            'output': 'json'
        }
        
        try:
            response = requests.get(self.api_url, params=params, timeout=10)
            data = response.json()
            
            if data.get('status') == 0:
                return data
            else:
                logger.warning(f"路线搜索失败：{data.get('message', '未知错误')}")
                return None
        except Exception as e:
            logger.error(f"API请求失败：{str(e)}")
            return None
    
    def extract_path_points(self, route_data: Dict) -> List[Tuple[float, float]]:
        """
        从路线数据中提取路径点
        :param route_data: API返回的路线数据
        :return: 路径点列表 [(纬度, 经度), ...]
        """
        path_points = []
        
        if not route_data or route_data.get('status') != 0:
            return path_points
        
        try:
            routes = route_data.get('result', {}).get('routes', [])
            if not routes:
                return path_points
            
            # 使用第一条路线
            route = routes[0]
            steps = route.get('steps', [])
            
            for step in steps:
                # 获取每个步骤的路径坐标
                path_str = step.get('path', '')
                if path_str:
                    # 解析路径字符串（格式：经度,纬度;经度,纬度;...）
                    coords = path_str.split(';')
                    for coord in coords:
                        if ',' in coord:
                            lng, lat = coord.split(',')
                            path_points.append((float(lat), float(lng)))
            
            # 确保终点在路径点列表中
            if path_points and len(routes[0].get('destination', {})) > 0:
                dest = routes[0].get('destination', {})
                if 'destinationPt' in dest:
                    dest_pt = dest['destinationPt']
                    path_points.append((dest_pt.get('lat'), dest_pt.get('lng')))
            
        except Exception as e:
            logger.error(f"提取路径点失败：{str(e)}")
        
        return path_points
    
    def get_robots_with_targets(self) -> List[Dict]:
        """获取所有有目标位置的机器人"""
        try:
            # 刷新连接以获取最新数据
            self.refresh_connection()
            
            query = """
            SELECT robot_id, current_latitude, current_longitude, 
                   target_latitude, target_longitude
            FROM robots
            WHERE target_latitude IS NOT NULL 
              AND target_longitude IS NOT NULL
              AND health_state_id = 1
              AND robot_type_id = 0
            """
            self.cursor.execute(query)
            robots = self.cursor.fetchall()
            
            # 检查是否有新机器人
            current_robot_ids = {robot['robot_id'] for robot in robots}
            tracked_robot_ids = set(self.robot_paths.keys())
            new_robots = current_robot_ids - tracked_robot_ids
            
            if new_robots:
                logger.info(f"发现新的导航任务：机器人 {new_robots}")
                # 检查机器人4是否是新任务
                if 4 in new_robots:
                    self.robot_4_first_update[4] = True  # 标记为需要第一次更新
            
            # 清理已经没有目标的机器人
            robots_without_target = tracked_robot_ids - current_robot_ids
            for robot_id in robots_without_target:
                if robot_id in self.robot_paths:
                    del self.robot_paths[robot_id]
                    logger.info(f"移除机器人 {robot_id} 的导航任务")
                    
                    # 如果是机器人4，发送停止命令并清除标记
                    if robot_id == 4:
                        logger.info(f"机器人4的导航任务被移除，发送停止命令到实体机器人")
                        self.send_stop_command()
                        if robot_id in self.robot_4_first_update:
                            del self.robot_4_first_update[robot_id]
            
            return robots
        except Error as e:
            logger.error(f"查询机器人失败: {e}")
            return []
    
    def update_robot_position(self, robot_id: int, new_lat: float, new_lng: float, target_pos: Tuple[float, float] = None):
        """更新机器人位置"""
        try:
            # 检查是否是机器人4的第一次更新
            if robot_id == 4 and self.robot_4_first_update.get(4, False):
                logger.info(f"机器人4第一次更新位置，发送导航命令到实体机器人")
                if target_pos:
                    self.send_navigation_command(target_pos)
                self.robot_4_first_update[4] = False  # 标记已经完成第一次更新
            
            query = """
            UPDATE robots 
            SET current_latitude = %s, current_longitude = %s
            WHERE robot_id = %s
            """
            self.cursor.execute(query, (new_lat, new_lng, robot_id))
            # 由于使用了autocommit，不需要手动commit
            logger.info(f"机器人 {robot_id} 位置已更新: ({new_lat:.6f}, {new_lng:.6f})")
        except Error as e:
            logger.error(f"更新机器人位置失败: {e}")
    
    def clear_robot_target(self, robot_id: int):
        """清除机器人的目标位置"""
        try:
            # 如果是机器人4，发送停止命令
            if robot_id == 4:
                logger.info(f"机器人4到达目的地，发送停止命令到实体机器人")
                self.send_stop_command()
                # 清除第一次更新标记
                if robot_id in self.robot_4_first_update:
                    del self.robot_4_first_update[robot_id]
            
            query = """
            UPDATE robots 
            SET target_latitude = NULL, target_longitude = NULL, target_position_id = NULL
            WHERE robot_id = %s
            """
            self.cursor.execute(query, (robot_id,))
            # 由于使用了autocommit，不需要手动commit
            logger.info(f"机器人 {robot_id} 已到达目的地，清除目标位置")
        except Error as e:
            logger.error(f"清除目标位置失败: {e}")
    
    def move_robot_along_path(self, robot_id: int, current_pos: Tuple[float, float], 
                        target_pos: Tuple[float, float], speed: float = 1.39):
        """
        沿路径移动机器人（修复版）
        :param robot_id: 机器人ID
        :param current_pos: 当前位置 (纬度, 经度)
        :param target_pos: 目标位置 (纬度, 经度)
        :param speed: 移动速度（米/秒），默认1.39米/秒（约5公里/小时）
        """
        # 检查是否需要重新规划路径
        need_replan = False
        if robot_id not in self.robot_paths:
            need_replan = True
            logger.info(f"机器人 {robot_id} 首次导航")
        elif self.robot_paths[robot_id]['target'] != target_pos:
            need_replan = True
            logger.info(f"机器人 {robot_id} 目标已改变")
        
        if need_replan:
            # 搜索新路径
            logger.info(f"为机器人 {robot_id} 规划新路径")
            route_data = self.search_walking_route(current_pos, target_pos)
            if not route_data:
                logger.warning(f"机器人 {robot_id} 路径规划失败")
                return
            
            path_points = self.extract_path_points(route_data)
            if not path_points:
                logger.warning(f"机器人 {robot_id} 无法提取路径点")
                return
            
            # 添加调试信息
            logger.info(f"机器人 {robot_id} 路径点数量: {len(path_points)}")
            
            self.robot_paths[robot_id] = {
                'target': target_pos,
                'path_points': path_points,
                'current_point_index': 0
            }
        
        # 获取当前路径信息
        path_info = self.robot_paths[robot_id]
        path_points = path_info['path_points']
        current_index = path_info['current_point_index']
        
        # 检查是否已到达最终目标
        final_distance = self.calculate_distance(current_pos, target_pos)
        if final_distance <= 2.0:  # 到达阈值：2米
            self.clear_robot_target(robot_id)
            if robot_id in self.robot_paths:
                del self.robot_paths[robot_id]
            return
        
        # 找到最近的路径点（改进版）
        min_distance = float('inf')
        nearest_index = current_index
        
        # 添加一个阈值，如果当前点已经很接近某个路径点，就跳到下一个
        REACHED_THRESHOLD = 5.0  # 5米内认为已到达该路径点
        
        for i in range(current_index, len(path_points)):
            dist = self.calculate_distance(current_pos, path_points[i])
            if dist < min_distance:
                min_distance = dist
                nearest_index = i
            
            # 如果已经很接近当前路径点，检查是否应该前进到下一个点
            if dist < REACHED_THRESHOLD and i < len(path_points) - 1:
                nearest_index = i + 1
                break
        
        # 更新当前路径点索引
        path_info['current_point_index'] = nearest_index
        
        # 计算下一个目标点
        if nearest_index < len(path_points) - 1:
            next_point = path_points[nearest_index]  # 使用当前最近点，而不是下一个点
        else:
            next_point = target_pos
        
        # 计算移动方向和距离
        lat_diff = next_point[0] - current_pos[0]
        lng_diff = next_point[1] - current_pos[1]
        distance = self.calculate_distance(current_pos, next_point)
        
        # 添加调试日志
        logger.debug(f"机器人 {robot_id} - 当前索引: {nearest_index}/{len(path_points)-1}, "
                    f"距离下一点: {distance:.2f}m, "
                    f"距离目标: {final_distance:.2f}m")
        
        # 添加最小移动距离检查，避免卡住
        MIN_MOVE_DISTANCE = 0.1  # 最小移动距离0.1米
        
        if distance > MIN_MOVE_DISTANCE:
            # 计算每秒移动的距离（度数）
            move_distance_deg = speed / 111000  # 转换为度数
            
            # 考虑经度的纬度修正
            lng_correction = math.cos(math.radians(current_pos[0]))
            
            # 计算移动比例
            if distance > 0:
                # 归一化方向向量
                total_diff = math.sqrt(lat_diff**2 + (lng_diff * lng_correction)**2)
                if total_diff > 0:
                    lat_move = (lat_diff / total_diff) * move_distance_deg
                    lng_move = (lng_diff / total_diff) * move_distance_deg / lng_correction
                else:
                    lat_move = lng_move = 0
            else:
                lat_move = lng_move = 0
            
            # 确保不会超过目标点
            if abs(lat_move) > abs(lat_diff):
                lat_move = lat_diff
            if abs(lng_move) > abs(lng_diff):
                lng_move = lng_diff
            
            # 计算新位置
            new_lat = current_pos[0] + lat_move
            new_lng = current_pos[1] + lng_move
            
            # 更新数据库中的位置，传递目标位置
            self.update_robot_position(robot_id, new_lat, new_lng, target_pos)
        else:
            # 如果距离太小，强制前进到下一个路径点或目标
            if nearest_index < len(path_points) - 1:
                path_info['current_point_index'] = nearest_index + 1
                logger.debug(f"机器人 {robot_id} 跳过路径点 {nearest_index}，前进到 {nearest_index + 1}")
            else:
                # 如果已经是最后一个路径点但还没到达目标，可能需要重新规划
                logger.warning(f"机器人 {robot_id} 可能卡在最后一个路径点，考虑重新规划")
                # 清除当前路径，下次循环会重新规划
                if robot_id in self.robot_paths:
                    del self.robot_paths[robot_id]

    def navigation_loop(self):
        """主导航循环"""
        logger.info("导航循环开始")
        
        # 周期性显示机器人4的状态
        status_check_counter = 0
        
        while self.running:
            try:
                # 获取所有需要导航的机器人（包括新设置目标的）
                robots = self.get_robots_with_targets()
                
                if robots:
                    logger.info(f"当前有 {len(robots)} 个机器人需要导航")
                
                for robot in robots:
                    robot_id = robot['robot_id']
                    current_pos = (float(robot['current_latitude']), 
                                 float(robot['current_longitude']))
                    target_pos = (float(robot['target_latitude']), 
                                float(robot['target_longitude']))
                    
                    # 移动机器人
                    self.move_robot_along_path(robot_id, current_pos, target_pos)
                
                # 定期检查机器人4的状态
                status_check_counter += 1
                if status_check_counter >= 10:  # 每10秒检查一次
                    status_check_counter = 0
                    if any(robot['robot_id'] == 4 for robot in robots):
                        status = self.get_robot_status()
                        if status:
                            logger.info(f"机器人4状态: 导航中={status.get('is_navigating')}, "
                                      f"障碍物距离={status.get('obstacle_distance_mm')}mm")
                
                # 等待一段时间再进行下一次更新
                time.sleep(1)  # 每秒更新一次
                
            except KeyboardInterrupt:
                logger.info("收到中断信号，停止导航")
                self.running = False
            except Exception as e:
                logger.error(f"导航循环错误: {e}")
                time.sleep(5)  # 出错后等待5秒再重试
    
    def start(self):
        """启动导航系统"""
        if self.connect_database():
            try:
                self.navigation_loop()
            finally:
                # 停止所有机器人导航
                logger.info("正在停止所有机器人导航...")
                self.send_stop_command()
                self.disconnect_database()
        else:
            logger.error("无法启动导航系统：数据库连接失败")
    
    def stop(self):
        """停止导航系统"""
        self.running = False
        # 如果机器人4正在导航，发送停止命令
        if 4 in self.robot_paths or 4 in self.robot_4_first_update:
            logger.info("停止机器人4的导航")
            self.send_stop_command()
        logger.info("导航系统正在停止...")


# 使用示例
if __name__ == "__main__":
    # 百度地图API密钥
    API_KEY = "1lxfqOJwwxUVOqiRwU691M3pJWvkb17X"
    
    # 数据库配置
    DB_CONFIG = {
        'host': 'localhost',
        'port': 3306,
        'user': 'root',
        'password': 'QuarkWang@163.com',
        'database': 'YouGuideManagementSystem'
    }
    
    # 创建导航器实例
    navigator = DatabaseRobotNavigator(API_KEY, DB_CONFIG)
    
    try:
        # 启动导航系统
        logger.info("启动数据库机器人导航系统...")
        logger.info(f"机器人4将同步到实体机器人 (IP: {navigator.robot_ip})")
        navigator.start()
    except KeyboardInterrupt:
        logger.info("收到停止信号")
    finally:
        navigator.stop()