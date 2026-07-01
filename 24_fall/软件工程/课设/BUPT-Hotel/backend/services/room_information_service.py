from mappers.room_information_mapper import get_all_rooms_from_db, get_people_by_room_id

def get_all_rooms():
    """获取所有房间信息的业务逻辑"""

    # 从数据库获取房间基本信息
    rooms = get_all_rooms_from_db()

    if not rooms:
        return {
            "code": 1,
            "message": "没有房间信息",
            "data": []
        }  # 如果没有房间信息，返回相应的格式

    # 格式化返回数据
    formatted_rooms = []
    for room in rooms:
        people = get_people_by_room_id(room['roomId'])
        formatted_room = {
            "roomId": room['roomId'],  # 房间号
            "roomLevel": room['roomLevel'],  # 房间等级
            "people": [{"peopleId": person['customerId'], "peopleName": person['customerName']} for person in people],  # 当前住户
            "cost": room['CurrentEnergy'],  # 当前消耗电量
            "roomTemperature": room['RoomTemperature'],  # 当前室温
            "power": room['Power'],  # 开关状态
            "temperature": room['TargetTemperature'],  # 目标温度
            "windSpeed": room['RoomWindSpeed'],  # 当前风速
            "mode": room['RoomMode'],  # 当前模式
            "sweep": room['RoomSweep']  # 当前扫风状态
        }
        formatted_rooms.append(formatted_room)

    return {

        "data": formatted_rooms
    }