from flask import request, jsonify, current_app
import datetime

def get_room_record():
    try:
        room_id = request.args.get("roomId", type=int)
        
        if not room_id or not isinstance(room_id, int):
            return jsonify({"code": 1, "message": "无效的房间号"}), 400

        # 查询房间基本信息
        query_room = """
            SELECT CheckInTime, TotalAmount
            FROM Rooms
            WHERE RoomID = %s
        """
        room_data = current_app.db.execute_query(query_room, (room_id,))
        
        if not room_data:
            return jsonify({"code": 1, "message": "房间不存在"}), 404

        # 获取房间基本信息
        check_in_time = room_data[0]["CheckInTime"]
        
        # 添加检查逻辑：如果check_in_time为空，返回空数据
        if check_in_time is None:
            return jsonify({
                "code": 0,
                "checkInTime": None,
                "message": "房间未启用",
                "data": {
                    "cost": 0,
                    "people": [],
                    "records": []
                }
            }), 200
            
        total_cost = float(room_data[0]["TotalAmount"])

        # 查询住户信息
        query_people = """
            SELECT CustomerID AS peopleId, CustomerName AS peopleName
            FROM Customers
            WHERE RoomID = %s
        """
        people = current_app.db.execute_query(query_people, (room_id,))

        # 查询空调操作记录（只返回入住时间之后的记录）
        query_records = """
            SELECT RecordTime AS time, CurrentEnergy AS cost, Power AS power, 
                   Temperature AS temperature, WindSpeed AS windSpeed, 
                   Mode AS mode, Sweep AS sweep
            FROM OperationRecords
            WHERE RoomID = %s
            AND RecordTime >= (
                SELECT CheckInTime 
                FROM Rooms 
                WHERE RoomID = %s
            )
            ORDER BY RecordTime ASC
        """
        records = current_app.db.execute_query(query_records, (room_id, room_id))

        # 构造响应数据
        data = {
            "cost": total_cost,
            "people": people,
            "records": [
                {
                    "time": record["time"].isoformat(),
                    "cost": float(record["cost"]),
                    "power": record["power"],
                    "temperature": record["temperature"],
                    "windSpeed": record["windSpeed"],
                    "mode": record["mode"],
                    "sweep": record["sweep"]
                }
                for record in records
            ]
        }

        return jsonify({
            "code": 0,
            "checkInTime": check_in_time.isoformat(),
            "message": "查询成功",
            "data": data
        }), 200

    except Exception as e:
        return jsonify({"code": 1, "message": f"服务器内部错误: {str(e)}"}), 500
