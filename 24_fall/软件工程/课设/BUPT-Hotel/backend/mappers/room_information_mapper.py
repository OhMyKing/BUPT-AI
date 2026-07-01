from flask import current_app

def get_all_rooms_from_db():
    """从数据库获取所有房间信息"""
    try:
        query = """
            SELECT
                RoomID,
                RoomLevel,
                CurrentEnergy,
                RoomTemperature,
                Power,
                TargetTemperature,
                RoomWindSpeed,
                RoomMode,
                RoomSweep
            FROM Rooms
        """
        results = current_app.db.execute_query(query)
        
        # 格式化结果
        rooms = []
        for result in results:
            room = {
                'roomId': result['RoomID'],
                'roomLevel': result['RoomLevel'],
                'CurrentEnergy': result['CurrentEnergy'],
                'RoomTemperature': result['RoomTemperature'],
                'Power': result['Power'],
                'TargetTemperature': result['TargetTemperature'],
                'RoomWindSpeed': result['RoomWindSpeed'],
                'RoomMode': result['RoomMode'],
                'RoomSweep': result['RoomSweep'],
            }
            rooms.append(room)

        return rooms

    except Exception as e:
        raise Exception(f"查询房间信息时出错: {e}")

def get_people_by_room_id(room_id):
    """根据房间ID获取顾客信息"""
    try:
        query = """
            SELECT c.CustomerID, c.CustomerName
            FROM Customers c
            JOIN TrafficRecords t ON c.CustomerID = t.CustomerID
            WHERE t.RoomID = %s
        """
        results = current_app.db.execute_query(query, (room_id,))
        
        customers = []
        for result in results:
            customer = {
                'customerId': result['CustomerID'],
                'customerName': result['CustomerName']
            }
            customers.append(customer)

        return customers

    except Exception as e:
        raise Exception(f"查询顾客信息时出错: {e}")