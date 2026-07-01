from mappers.admin_login_mapper import get_admin_by_username
from utils.jwt_utils import get_jwt_manager
from utils.password_utils import verify_password


def admin_login(username, password):
    """管理员登录业务逻辑"""
    admin = get_admin_by_username(username)
    if not admin:
        return None

    # 验证密码
    if not verify_password(password, admin['password_hash']):
        return None

    # 生成JWT，传入用户ID和角色
    jwt_manager = get_jwt_manager()
    token = jwt_manager.create_token(admin['admin_id'], admin['role'])

    return {
        'token': token,
        'role': admin['role']
    }
