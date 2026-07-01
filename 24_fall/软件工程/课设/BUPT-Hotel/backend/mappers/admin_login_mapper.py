from flask import current_app

from utils.password_utils import hash_password


def get_admin_by_username(username):
    """根据用户名查询管理员信息"""
    try:
        query = """
            SELECT AdminID, Username, PasswordHash, Role 
            FROM Administrators 
            WHERE Username = %s
        """
        result = current_app.db.execute_query(query, (username,))
        if not result:
            return None

        # 返回第一条结果
        admin = result[0]
        return {
            'admin_id': admin['AdminID'],
            'username': admin['Username'],
            'password_hash': admin['PasswordHash'],
            'role': admin['Role']
        }
    except Exception as e:
        raise Exception(f"查询管理员信息时出错: {e}")

def init_admin_accounts():
    """初始化管理员账号"""
    try:
        # 先检查是否已经存在管理员账号
        count_query = "SELECT COUNT(*) as count FROM Administrators"
        result = current_app.db.execute_query(count_query)
        if result[0]['count'] > 0:
            return  # 已存在管理员账号，不需要初始化

        # 准备初始管理员数据
        admins = [
            ('front_desk', 'front_desk', '前台服务'),
            ('ac_manager', 'ac_manager', '空调管理'),
            ('manager', 'manager', '酒店经理')
        ]

        # 插入管理员数据
        for username, password, role in admins:
            password_hash = hash_password(password)
            query = """
                INSERT INTO Administrators (Username, PasswordHash, Role)
                VALUES (%s, %s, %s)
            """
            current_app.db.execute_insert(query, (username, password_hash, role))

    except Exception as e:
        raise Exception(f"初始化管理员账号时出错: {e}")


if __name__ == "__main__":
    from flask import Flask
    from utils.config_utils import Config
    from utils.database_utils import Database
    from services.admin_login_service import admin_login

    app = Flask(__name__)
    config = Config('../config/config.yaml')
    config.to_flask_config(app)
    with app.app_context():
        app.db = Database()

    with app.app_context():
        # 初始化管理员账号
        init_admin_accounts()
        # 测试登录
        for username in ['front_desk', 'ac_manager', 'manager']:
            result = admin_login(username, username)
            print(f"\nTesting login for {username}:")
            print(f"Login result: {result}")