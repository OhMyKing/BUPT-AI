from flask import request, jsonify
from utils.jwt_utils import get_jwt_manager
from services.front_desk_service import query_room_info
from services.front_desk_service import delete_customer
from services.front_desk_service import add_customer


def get_hotel_info():
    """
    控制器处理函数，用于调用查询房间信息的服务并返回响应
    """
    try:
        # 获取管理员JWT
        jwt_manager = get_jwt_manager()
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        # 验证 JWT
        decoded_token = jwt_manager.verify_token(token)
        if not decoded_token:
            return jsonify({"code": 1, "message": "无效的JWT"}), 401

        # 查询房间信息
        response = query_room_info()
        return jsonify(response), 200
    except Exception as e:
        return jsonify({
            "code": 1,
            "message": f"服务器内部错误: {str(e)}"
        }), 500


def hotel_check_in():
    try:
        # 获取管理员JWT
        jwt_manager = get_jwt_manager()
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        # 验证 JWT
        decoded_token = jwt_manager.verify_token(token)
        if not decoded_token:
            return jsonify({"code": 1, "message": "无效的JWT"}), 401

        # 获取请求参数
        data = request.get_json()

        # 验证请求数据格式
        response = add_customer(data)
        return jsonify(response), 200 if response['code'] == 0 else 400

    except Exception as e:
        # 捕获并返回异常
        return jsonify({"code": 1, "message": f"服务器内部错误: {str(e)}"}), 500


def hotel_check_out():
    try:
        # 获取管理员JWT
        jwt_manager = get_jwt_manager()
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        # 验证 JWT
        decoded_token = jwt_manager.verify_token(token)
        if not decoded_token:
            return jsonify({"code": 1, "message": "无效的JWT"}), 401

        # 获取请求参数
        data = request.args.to_dict()
        room_id = data.get("roomId")

        # 参数校验
        if not room_id or not room_id.isdigit() or not (2001 <= int(room_id) <= 5010):
            return jsonify({"code": 1, "message": "无效的房间号"}), 400

        # 调用业务逻辑处理退房操作
        result = delete_customer(data)

        return jsonify(result), 200 if result["code"] == 0 else 400

    except Exception as e:
        return jsonify({"code": 1, "message": f"服务器内部错误: {str(e)}"}), 500