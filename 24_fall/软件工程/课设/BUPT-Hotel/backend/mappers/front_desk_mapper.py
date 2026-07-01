from flask import current_app

import logging
import traceback
from datetime import datetime


def get_room_info():
    """查询管理员有权限查看的所有房间信息"""
    try:
        # 修改查询语句，确保获取所有房间
        query = """
            SELECT 
                r.RoomID,
                r.RoomLevel,
                r.TotalAmount AS cost,
                r.CheckInTime,
                r.Status,
                c.CustomerID AS peopleId,
                c.CustomerName AS peopleName
            FROM Rooms r
            LEFT JOIN Customers c ON r.RoomID = c.RoomID
            WHERE r.RoomID BETWEEN 2001 AND 5010
            ORDER BY r.RoomID
        """
        
        # 使用新的查询方法
        results = current_app.db.execute_query(query)

        # 添加调试日志
        logging.info(f"查询到 {len(results)} 条房间记录")
        
        # 处理查询结果
        room_data = {}
        for row in results:
            room_id = row['RoomID']
            if room_id not in room_data:
                # 添加调试日志
                logging.debug(f"处理房间 {room_id} 的数据: {row}")
                
                room_data[room_id] = {
                    "roomId": room_id,
                    "roomLevel": row['RoomLevel'],
                    "cost": float(row['cost']) if row['cost'] else 0.0,
                    "checkInTime": row['CheckInTime'].isoformat() if row['CheckInTime'] else None,
                    "people": []
                }
            
            if row['peopleId']:  # 如果有入住人员
                person = {
                    "peopleId": row['peopleId'],
                    "peopleName": row['peopleName']
                }
                if person not in room_data[room_id]["people"]:
                    room_data[room_id]["people"].append(person)

        # 检查是否有缺失的房间号
        standard_room_ids = set(range(2001, 2011)) | set(range(3001, 3011)) | set(range(4001, 4011))  # 标准房
        large_room_ids = set(range(5001, 5011))  # 大床房
        all_room_ids = standard_room_ids | large_room_ids
        found_room_ids = set(room_data.keys())
        missing_room_ids = all_room_ids - found_room_ids
        if missing_room_ids:
            logging.warning(f"缺失的房间号: {sorted(missing_room_ids)}")

        return list(room_data.values())

    except Exception as e:
        logging.error(f"查询房间信息失败: {str(e)}\n{traceback.format_exc()}")
        raise Exception(f"数据库操作失败: {str(e)}")

def add_customer_to_room(room_id, customer_name):
    """
    将顾客添加到指定房间。如果房间不存在，先创建房间，并更新相关信息。
    如果房间已经有顾客入住，则不会更新房间状态。
    """
    try:
        # 检查房间是否存在且未被入住
        query_check_room = """
            SELECT Status, RoomTemperature, TargetTemperature, EnvironmentTemperature, 
                   Power, RoomWindSpeed, RoomMode, RoomSweep
            FROM Rooms 
            WHERE RoomID = %s
        """
        result = current_app.db.execute_query(query_check_room, (room_id,))

        if not result:
            # 如果房间不存在，先创建房间
            room_level = '大床房' if room_id >= 5001 else '标准间'
            query_insert_room = """
                INSERT INTO Rooms (RoomID, RoomLevel, RoomTemperature, TargetTemperature, 
                                   EnvironmentTemperature, TotalAmount, TotalEnergyConsumption, 
                                   CurrentEnergy, Power, RoomWindSpeed, RoomMode, RoomSweep, 
                                   Status, TimeSlice)
                VALUES (%s, %s, 22, 22, 22, 0, 0, 0, 'off', '低', '制冷', '关', 2, 0)
            """
            current_app.db.execute_insert(query_insert_room, (room_id, room_level))

        # 先检查房间是否已经有顾客入住
        query_check_customers = """
            SELECT COUNT(*) as customer_count
            FROM Customers
            WHERE RoomID = %s
        """
        customer_count = current_app.db.execute_query(query_check_customers, (room_id,))[0]['customer_count']
        
        current_time = datetime.now()
        
        # 如果是第一个入住的顾客，更新房间状态
        if customer_count == 0:
            query_update_room = """
                UPDATE Rooms
                SET Status = 1,  -- 已入住
                    CheckInTime = %s,
                    LastOperationTime = %s,
                    Power = 'off',
                    CurrentEnergy = 0,
                    TotalAmount = 0,
                    TotalEnergyConsumption = 0,
                    TimeSlice = 0,
                    TargetTemperature = 22,
                    RoomWindSpeed = '低',
                    RoomMode = '制冷',
                    RoomSweep = '关'
                WHERE RoomID = %s
            """
            current_app.db.execute_update(query_update_room, (current_time, current_time, room_id))

        # 插入顾客表
        query_insert_customer = """
            INSERT INTO Customers (CustomerName, RoomID)
            VALUES (%s, %s)
        """
        customer_id = current_app.db.execute_insert(query_insert_customer, (customer_name, room_id))

        # 插入客流记录表，记录顾客入住
        query_insert_traffic_record = """
            INSERT INTO TrafficRecords (RecordType, RoomID, CustomerID, RecordTime)
            VALUES ('入住', %s, %s, %s)
        """
        current_app.db.execute_insert(query_insert_traffic_record, (room_id, customer_id, current_time))

        return customer_id
        
    except Exception as e:
        raise Exception(f"入住失败: {str(e)}")




def delete_customer_from_room(room_id):
    """从指定房间退房顾客，并更新房间状态"""
    try:
        # 查找当前入住该房间的所有顾客
        query_customers = """
            SELECT CustomerID
            FROM Customers
            WHERE RoomID = %s
        """
        results = current_app.db.execute_query(query_customers, (room_id,))

        if not results:
            raise Exception("未找到该房间的入住记录")

        # 1. 更新所有顾客的RoomID为NULL
        query_update_customers = """
            UPDATE Customers
            SET RoomID = NULL
            WHERE RoomID = %s
        """
        current_app.db.execute_update(query_update_customers, (room_id,))

        # 2. 为所有退房顾客添加退房记录
        current_time = datetime.now()
        for row in results:
            query_add_traffic = """
                INSERT INTO TrafficRecords (RecordType, RoomID, CustomerID, RecordTime)
                VALUES ('退房', %s, %s, %s)
            """
            current_app.db.execute_insert(query_add_traffic, (room_id, row['CustomerID'], current_time))

        # 3. 更新房间状态为退房状态，并重置房间设置
        query_update_room = """
            UPDATE Rooms
            SET Status = 2,  -- 退房状态
                CheckInTime = NULL,
                LastOperationTime = %s,
                Power = 'off',  -- 空调关闭
                CurrentEnergy = 0,  -- 初始能量为 0
                TotalAmount = 0,
                TotalEnergyConsumption = 0,
                TimeSlice = 0,
                TimeSlice = 0,  -- 重置时段
                TargetTemperature = 25,  -- 重置目标温度
                RoomWindSpeed = '低',  -- 风速重置
                RoomMode = '制冷',  -- 模式重置
                RoomSweep = '关'  -- 扫风关闭
            WHERE RoomID = %s
        """
        return current_app.db.execute_update(query_update_room, (current_time, room_id))

    except Exception as e:
        raise Exception(f"退房失败: {str(e)}")
