import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app

class JWTManager:
    def __init__(self, secret_key, algorithm='HS256', expiration_minutes=60):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expiration_minutes = expiration_minutes

    def create_token(self, user_id, role):  # 添加role参数
        expiration = datetime.now(timezone.utc) + timedelta(minutes=self.expiration_minutes)
        unix_expiration = int(expiration.timestamp())
        payload = {
            "user_id": user_id,
            "role": role,  # 将角色信息添加到payload中
            "exp": unix_expiration
        }
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token

    def verify_token(self, token):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return {  # 返回包含用户ID和角色的字典
                "user_id": payload.get("user_id"),
                "role": payload.get("role")
            }
        except jwt.ExpiredSignatureError:
            return None  # Token 过期
        except jwt.InvalidTokenError:
            return None  # 无效 Token

def get_jwt_manager():
    return JWTManager(
        secret_key=current_app.config['jwt']['secret_key'],
        algorithm=current_app.config['jwt']['algorithm'],
        expiration_minutes=current_app.config['jwt']['expiration_min']
    )

if __name__ == "__main__":
    jwt_manager = JWTManager("BUPT_Hotel", algorithm='HS256', expiration_minutes=525600)  #生成一个一年过期的jwt供测试
    # front_desk_jwt = jwt_manager.create_token(1, "前台服务")
    # print(front_desk_jwt)
    # front_desk_jwt = jwt_manager.create_token(1, "前台服务")
    ac_manager_jwt = jwt_manager.create_token(1, "空调管理")
    manager_jwt = jwt_manager.create_token(1, "酒店经理")
    # print('front_desk_jwt: '+front_desk_jwt)
    print('ac_manager_jwt: '+ac_manager_jwt)
    print('manager_jwt: '+manager_jwt)