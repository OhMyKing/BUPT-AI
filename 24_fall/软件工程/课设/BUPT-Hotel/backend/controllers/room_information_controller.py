from flask import request, jsonify
from services.room_information_service import get_all_rooms
from utils.jwt_utils import get_jwt_manager  # 导入获取 JWT 管理器的函数

def query_room_controller():
    """查询管理员有权限查看的所有房间信息的控制器"""

    try:
        # 获取 Authorization 头部
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"code": 1, "message": "缺少 Authorization 头部"}), 401

        # 提取 JWT
        token = auth_header.split(" ")[1]  # 获取 Bearer 后面的 token

        # 获取 JWT 管理器实例
        jwt_manager = get_jwt_manager()
        token_info = jwt_manager.verify_token(token)  # 调用 JWT 管理器的 verify_token 方法

        if not token_info:
            return jsonify({"code": 1, "message": "无效的 JWT"}), 401

        # 如果 token 验证通过，继续获取房间信息
        rooms = get_all_rooms()  # 从服务层获取房间信息

        # 构建响应数据
        response = {
            "code": 0,
            "message": "查询成功",
            "data": rooms['data']
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            "code": 1,
            "message": str(e)
        }), 500