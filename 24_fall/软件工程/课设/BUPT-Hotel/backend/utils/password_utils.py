import bcrypt
from flask import current_app

def hash_password(password):
    """使用bcrypt对密码进行加密"""
    salt = bcrypt.gensalt(rounds=current_app.config['secret']['pcrypt_rounds'])
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed):
    """验证密码"""
    return bcrypt.checkpw(
        password.encode('utf-8'),
        hashed.encode('utf-8')
    )