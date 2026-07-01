from mappers.front_desk_mapper import get_room_info
from mappers.front_desk_mapper import add_customer_to_room
from mappers.front_desk_mapper import delete_customer_from_room
from flask import jsonify


def query_room_info():
    """
    查询管理员有权限查看的所有房间信息的业务逻辑
    """
    try:
        rooms = get_room_info()
        return {
            "code": 0,
            "message": "查询成功",
            "data": rooms
        }
    except Exception as e:
        return {
            "code": 1,
            "message": f"查询失败: {str(e)}"
        }


def add_customer(data):
    """
    处理添加顾客的业务逻辑
    """
    required_fields = ['roomId', 'peopleName']
    for field in required_fields:
        if field not in data:
            return {"code": 1, "message": f"缺少必需参数: {field}"}

    room_id = data['roomId']
    customer_name = data['peopleName']

    # 检查房间ID是否有效
    if not isinstance(room_id, int) or not (2001 <= room_id <= 5010):
        return {"code": 1, "message": "无效的房间号"}

    try:
        # 调用数据层方法，将顾客添加到房间
        add_customer_to_room(room_id, customer_name)
        return {"code": 0, "message": "顾客添加成功"}
    except Exception as e:
        return {"code": 1, "message": f"设置失败: {str(e)}"}


def delete_customer(data):
    """
    退房操作，删除指定房间的顾客
    """
    # 校验参数
    if "roomId" not in data:
        return {"code": 1, "message": "缺少必需参数: roomId"}

    room_id = data["roomId"]

    try:
        delete_customer_from_room(room_id)
        return {"code": 0, "message": "退房成功"}
    except Exception as e:
        return {"code": 1, "message": f"退房失败: {str(e)}"}
