from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 数据库配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '040803',
    'database': 'user_management'
}


# 注册用户
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data['username']
        password = data['password']
        email = data['email']

        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # 检查用户名是否已存在
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({"error": "用户名被占用了，换一个试试吧"}), 409

        # 加密密码
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        cursor.execute("INSERT INTO users (username, password_hash, email) VALUES (%s, %s, %s)",
                       (username, password_hash, email))
        connection.commit()
        return jsonify({"message": "注册成功！快去登录吧"}), 201

    except Error as e:
        app.logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "数据库出现了问题..."}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "好像出现了问题..."}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'connection' in locals() and connection and connection.is_connected():
            connection.close()


@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data['username']
        password = data['password']

        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({"redirect": "https://wangdianyun.github.io/GodSay/"})
        else:
            return jsonify({"error": "不可用的用户名或密码"}), 401

    except Error as e:
        app.logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "数据库出现了问题..."}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "好像出现了问题..."}), 500
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'connection' in locals() and connection and connection.is_connected():
            connection.close()


@app.route('/welcome')
def welcome():
    username = request.args.get('username')
    return f"Welcome, {username}!"


if __name__ == '__main__':
    app.run(debug=False)
