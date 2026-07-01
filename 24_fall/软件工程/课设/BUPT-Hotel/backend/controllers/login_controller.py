from flask import request, jsonify
from services.admin_login_service import admin_login


def admin_login_controller():
    """管理员登录控制器"""
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({
            "code": 1,
            "message": "缺少必要参数"
        }), 400

    try:
        result = admin_login(data['username'], data['password'])
        if result:
            return jsonify({
                "code": 0,
                "message": "登录成功",
                "token": result['token'],
                "role": result['role']
            })
        else:
            return jsonify({
                "code": 1,
                "message": "用户名或密码错误"
            }), 401
    except Exception as e:
        return jsonify({
            "code": 1,
            "message": str(e)
        }), 500