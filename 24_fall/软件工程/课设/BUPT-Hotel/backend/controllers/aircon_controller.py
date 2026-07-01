from utils.jwt_utils import get_jwt_manager
from services.aircon_service import adjust_central_aircon_settings, fetch_weekly_aircon_operations, \
    fetch_all_aircon_status, update_room_ac_settings, get_room_panel_info
from flask import request, jsonify

def update_ac_controller():
    """空调控制面板 - 更新设置控制器"""
    try:
        # 获取请求参数
        data = request.get_json()
        if not data:
            return jsonify({
                "code": 1,
                "message": "缺少请求数据"
            }), 400

        # 提取参数
        params = {
            'room_id': data.get("roomId"),
            'power': data.get("power"),
            'temperature': data.get("temperature"),
            'wind_speed': data.get("windSpeed"),
            'sweep': data.get("sweep")
        }

        # 调用服务层处理业务逻辑
        result = update_room_ac_settings(**params)
        return jsonify({
            "code": 0,
            "message": "空调设置已更新"
        }), 200

    except ValueError as e:
        return jsonify({
            "code": 1,
            "message": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "code": 1,
            "message": f"服务器内部错误: {str(e)}"
        }), 500


def get_panel_controller():
    """获取房间面板信息控制器"""
    try:
        room_id = request.args.get("roomId", type=int)
        if not room_id:
            return jsonify({
                "code": 1,
                "message": "缺少房间号参数"
            }), 400

        # 调用服务层获取数据
        room_info = get_room_panel_info(room_id)

        return jsonify({
            "code": 0,
            "message": "操作成功",
            "data": room_info
        }), 200

    except ValueError as e:
        return jsonify({
            "code": 1,
            "message": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "code": 1,
            "message": f"服务器内部错误: {str(e)}"
        }), 500


def central_aircon_adjust_controller():
    """
    中央空调设置控制器
    """
    jwt_manager = get_jwt_manager()
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    # 验证 JWT
    decoded_token = jwt_manager.verify_token(token)
    if not decoded_token:
        return jsonify({"code": 1, "message": "无效的JWT"}), 401

    # 获取用户信息（可选，用于后续权限判断）
    user_id = decoded_token["user_id"]
    role = decoded_token["role"]

    # 获取请求数据
    data = request.get_json()
    if not data:
        return jsonify({"code": 1, "message": "请求体不能为空"}), 400

    # 调用服务层处理逻辑
    response = adjust_central_aircon_settings(data)
    return jsonify(response)


def get_hotel_aircon_status_controller():
    """
    获取整个酒店空调情况的控制器
    """
    jwt_manager = get_jwt_manager()
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    # 验证 JWT
    decoded_token = jwt_manager.verify_token(token)
    if not decoded_token:
        return jsonify({"code": 1, "message": "无效的JWT", "data": []}), 401

    # 调用服务层获取数据
    response = fetch_all_aircon_status()
    return jsonify(response)


def get_weekly_aircon_operations_controller():
    """
    获取近一周空调操作记录的控制器
    """
    jwt_manager = get_jwt_manager()
    token = request.headers.get('Authorization', '').replace('Bearer ', '')

    # 验证 JWT
    decoded_token = jwt_manager.verify_token(token)
    if not decoded_token:
        return jsonify({"code": 1, "message": "无效的JWT", "data": []}), 401

    # 调用服务层获取数据
    response = fetch_weekly_aircon_operations()
    return jsonify(response)
