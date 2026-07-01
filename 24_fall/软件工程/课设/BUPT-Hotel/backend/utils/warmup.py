import time
import pymysql

# 设定数据库连接信息
db_config = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'QuarkWang@163.com',
    'database': 'bupt_hotel',
    'port': 3306
}

# 连接到数据库
def get_db_connection():
    return pymysql.connect(
        host=db_config['host'],
        user=db_config['user'],
        password=db_config['password'],
        database=db_config['database'],
        port=db_config['port'],
        cursorclass=pymysql.cursors.DictCursor
    )

def warmup():
    while True:
        try:
            connection = get_db_connection()
            with connection.cursor() as cursor:
                # 获取所有需要处理温度的房间
                room_query = """
                    SELECT RoomID, RoomTemperature, TargetTemperature, 
                           EnvironmentTemperature, Power, RoomWindSpeed
                    FROM rooms
                    WHERE (Power = 'on' AND RoomTemperature != TargetTemperature)
                    OR (Power = 'off' AND RoomTemperature != EnvironmentTemperature)
                """
                cursor.execute(room_query)
                rooms = cursor.fetchall()

                for room in rooms:
                    # 在处理每个房间时重新获取最新的调度记录
                    schedule_query = """
                        SELECT RunningQueue 
                        FROM schedulerecords 
                        ORDER BY RecordTime DESC 
                        LIMIT 1
                    """
                    cursor.execute(schedule_query)
                    schedule = cursor.fetchone()
                    running_rooms = [] if not schedule else eval(schedule['RunningQueue'])
                    
                    is_running = room['RoomID'] in running_rooms
                    
                    if room['Power'] == 'on' and is_running:
                        # 根据风速计算温度变化
                        temp_diff = float(room['TargetTemperature']) - float(room['RoomTemperature'])
                        if abs(temp_diff) > 0:
                            # 计算每10秒的温度变化量
                            speed_change_map = {
                                '高': 1.0,    # 10秒变化1度
                                '中': 0.5,    # 20秒变化1度
                                '低': 0.33    # 30秒变化1度
                            }
                            change_amount = speed_change_map.get(room.get('RoomWindSpeed', '低'))
                            
                            # 确定温度变化方向
                            if temp_diff > 0:
                                new_temp = min(room['TargetTemperature'], 
                                             float(room['RoomTemperature']) + change_amount)
                            else:
                                new_temp = max(room['TargetTemperature'], 
                                             float(room['RoomTemperature']) - change_amount)
                            
                            # 计算实际温度变化量
                            actual_change = abs(new_temp - float(room['RoomTemperature']))
                            cost_change = actual_change  # 1度对应1元
                            
                            update_query = """
                                UPDATE rooms
                                SET RoomTemperature = %s,
                                    TotalAmount = TotalAmount + %s,
                                    TotalEnergyConsumption = TotalEnergyConsumption + %s
                                WHERE RoomID = %s
                            """
                            cursor.execute(update_query, (
                                new_temp, 
                                cost_change,
                                cost_change,
                                room['RoomID']
                            ))
                    else:
                        # 关机或不在运行队列：渐进式调整到环境温度
                        temp_diff = float(room['RoomTemperature']) - float(room['EnvironmentTemperature'])
                        if abs(temp_diff) > 0:
                            new_temp = room['RoomTemperature'] - 0.5 if temp_diff > 0 else room['RoomTemperature'] + 0.5
                            update_query = """
                                UPDATE rooms
                                SET RoomTemperature = %s
                                WHERE RoomID = %s
                            """
                            cursor.execute(update_query, (new_temp, room['RoomID']))

                connection.commit()

        except Exception as e:
            print(f"Error in warmup: {e}")

        finally:
            if 'connection' in locals():
                connection.close()

        time.sleep(10)