import json
from flask import current_app
from decimal import Decimal

def update_room_settings(room_id, settings):
    """更新房间空调设置"""
    try:
        # 更新房间的空调设置
        query = """
            UPDATE rooms
            SET Power = %s,
                TargetTemperature = %s,
                RoomWindSpeed = %s,
                RoomSweep = %s,
                LastOperationTime = NOW()
            WHERE RoomID = %s
        """
        current_app.db.execute_insert(query, (
            settings['power'],
            settings['temperature'],
            settings['wind_speed'],
            settings['sweep'],
            room_id
        ))

    except Exception as e:
        raise Exception(f"更新房间设置失败: {e}")


def insert_operation_record(room_id, power, temperature, wind_speed, sweep):
    """插入操作记录"""
    try:
        # 1. 首先读取当前房间的TotalAmount和CurrentEnergy
        query_room = """
            SELECT TotalAmount, CurrentEnergy
            FROM Rooms
            WHERE RoomID = %s
        """
        room_result = current_app.db.execute_query(query_room, (room_id,))
        if not room_result:
            raise Exception("未找到房间记录")
            
        total_amount = room_result[0]['TotalAmount']
        current_energy = room_result[0]['CurrentEnergy']
        
        # 2. 更新rooms表的CurrentEnergy为TotalAmount
        query_update_room = """
            UPDATE Rooms
            SET CurrentEnergy = TotalAmount
            WHERE RoomID = %s
        """
        current_app.db.execute_update(query_update_room, (room_id,))
        
        # 3. 计算本次操作的能耗和费用
        operation_energy = total_amount - current_energy
        operation_cost = operation_energy
        
        # 4. 插入操作记录
        query_insert = """
            INSERT INTO operationRecords (
                RoomID, RecordTime, Power, Temperature, WindSpeed, 
                Mode, Sweep, Status, CurrentEnergy, CurrentCost
            )
            VALUES (%s, NOW(), %s, %s, %s, '制冷', %s, 2, %s, %s)
        """
        current_app.db.execute_insert(query_insert, (
            room_id, power, temperature, wind_speed, sweep,
            operation_energy, operation_cost
        ))
    except Exception as e:
        raise Exception(f"插入操作记录失败: {e}")


def get_room_info(room_id):
    """获取房间信息"""
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            query = """
                SELECT 
                    RoomTemperature as room_temperature,
                    Power as power,
                    TargetTemperature as target_temperature,
                    RoomWindSpeed as wind_speed,
                    RoomMode as mode,
                    RoomSweep as sweep,
                    CurrentEnergy as current_energy,
                    TotalEnergyConsumption as total_energy,
                    TotalAmount as total_amount,
                    CurrentEnergy as current_money,
                    TotalAmount as total_money
                FROM Rooms
                WHERE RoomID = %s
            """
            results = current_app.db.execute_query(query, (room_id,))
            return results[0] if results else None
        except Exception as e:
            retry_count += 1
            if retry_count == max_retries:
                raise Exception(f"数据库操作失败(重试{max_retries}次): {e}")
            continue

def update_central_aircon_settings(mode, max_rooms, fan_rates):
    """更新中央空调设置,并根据模式更新指定范围的所有房间空调设置"""
    try:
        # 将数字模式转换为对应的字符串
        mode_str = '制冷' if mode == 0 else '制热'
        
        # 更新中央空调设置
        query = """
            UPDATE CentralAC
            SET Mode = %s,
                MaxRooms = %s,
                LowSpeedRate = %s,
                MidSpeedRate = %s,
                HighSpeedRate = %s,
                UpdateTime = NOW()
            WHERE ACID = 1
        """
        current_app.db.execute_update(query, (
            mode,  # 中央空调表的Mode仍然使用数字
            max_rooms,
            fan_rates['lowSpeedRate'],
            fan_rates['midSpeedRate'],
            fan_rates['highSpeedRate']
        ))

        # 定义房间 ID 范围：标准房 (2001-2010, 3001-3010, 4001-4010)，大床房 (5001-5010)
        standard_room_ids = list(range(2001, 2011)) + list(range(3001, 3011)) + list(range(4001, 4011))
        big_bed_room_ids = list(range(5001, 5011))

        # 结合所有房间 ID
        room_ids = standard_room_ids + big_bed_room_ids

        for room_id in room_ids:
            # 检查房间是否已存在
            query_check_room = """
                SELECT Status, RoomMode
                FROM Rooms
                WHERE RoomID = %s
            """
            result = current_app.db.execute_query(query_check_room, (room_id,))

            if not result:
                # 如果房间不存在，则创建房间
                room_level = '大床房' if room_id in big_bed_room_ids else '标准间'
                query_insert_room = """
                    INSERT INTO Rooms (RoomID, RoomLevel, RoomTemperature, TargetTemperature, 
                                       EnvironmentTemperature, TotalAmount, TotalEnergyConsumption, 
                                       CurrentEnergy, Power, RoomWindSpeed, RoomMode, RoomSweep, 
                                       Status, TimeSlice)
                    VALUES (%s, %s, 22, 22, 22, 0, 0, 0, 'off', '低', %s, '关', 2, 0)
                """
                current_app.db.execute_insert(query_insert_room, (room_id, room_level, mode_str))

            # 如果房间已存在，则更新该房间的模式
            query_update_room = """
                UPDATE Rooms
                SET RoomMode = %s
                WHERE RoomID = %s
            """
            current_app.db.execute_update(query_update_room, (mode_str, room_id))

    except Exception as e:
        raise Exception(f"数据库操作失败: {e}")





def get_all_aircon_status():
    """查询所有房间的空调运行状态"""
    sql = """
        SELECT
            RoomID as roomId,
            RoomTemperature as roomTemperature,
            Power as power,
            TargetTemperature as temperature,
            RoomWindSpeed as windSpeed,
            RoomMode as mode,
            RoomSweep as sweep,
            CurrentEnergy as cost,
            TotalAmount as totalCost,
            Status as status,
            TimeSlice as timeSlice
        FROM Rooms
    """
    try:
        return current_app.db.execute_query(sql)
    except Exception as e:
        raise Exception(f"查询空调状态失败: {str(e)}")


def get_weekly_aircon_operations():
    """查询过去一周的空调操作记录"""
    sql = """
        SELECT 
            RoomID as roomId,
            RecordTime as time,
            CurrentCost as cost,
            CurrentEnergy as energyCost,
            Power as power,
            Temperature as temperature,
            WindSpeed as windSpeed,
            Mode as mode,
            Sweep as sweep,
            CASE Status
                WHEN 0 THEN '等待'
                WHEN 1 THEN '运行'
                WHEN 2 THEN '关闭'
            END as status,
            TimeSlice as timeSlice
        FROM OperationRecords
        WHERE RecordTime >= NOW() - INTERVAL 7 DAY
        ORDER BY RecordTime DESC
    """
    try:
        return current_app.db.execute_query(sql)
    except Exception as e:
        raise Exception(f"查询操作记录失败: {str(e)}")