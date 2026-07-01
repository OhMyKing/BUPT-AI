# 项目后端文档

## 1. 项目结构

项目采用 Flask 框架，遵循 MVC (Model-View-Controller) 架构设计模式，并使用服务层处理业务逻辑。项目结构如下：

```bash
backend/
├── app.py                      # Flask 应用主入口
├── config/                     # 配置文件目录
│   └── config.yaml            # 主配置文件
├── controllers/               # 控制器层，处理路由和请求
│   └── login_controller.py    # 登录相关控制器
├── mappers/                   # 数据访问层
│   └── admin_login_mapper.py  # 管理员登录数据访问
├── services/                  # 业务逻辑层
│   └── admin_login_service.py # 管理员登录业务逻辑
├── sql/                       # SQL脚本目录
│   └── hotel_air_conditioning.sql  # 数据库初始化脚本
└── utils/                     # 工具类
    ├── config_utils.py        # 配置工具
    ├── database_utils.py      # 数据库工具
    ├── jwt_utils.py          # JWT工具
    └── password_utils.py      # 密码处理工具
```

## 2. 基础设施

### 2.1 Database 数据库工具

`utils/database_utils.py` 提供了数据库连接池管理和便捷的数据库操作方法：

#### 基本使用方式

数据库操作提供了三个主要方法：

```python
# 查询操作
results = current_app.db.execute_query("SELECT * FROM 表名 WHERE 条件 = %s", (参数,))

# 更新操作
affected_rows = current_app.db.execute_update("UPDATE 表名 SET 字段 = %s WHERE 条件 = %s", (新值, 条件值))

# 插入操作
new_id = current_app.db.execute_insert("INSERT INTO 表名 (字段1, 字段2) VALUES (%s, %s)", (值1, 值2))
```

#### 特点

1. 内置连接池管理
2. 自动事务处理
3. 自动重试机制（最多3次）
4. 异常处理和日志记录
5. 使用字典游标，查询结果可通过字段名访问

#### 提示

1. SQL语句中用 %s 作为参数占位符
2. 参数要用元组 () 传入，即使只有一个参数也要加逗号
3. 查询结果为字典列表，可直接通过字段名访问
4. 所有操作都会自动处理连接的获取和释放
5. 发生错误时会自动回滚事务

### 2.2 JWT 认证

`utils/jwt_utils.py` 提供JWT令牌管理：

```python
# 创建token
jwt_manager = get_jwt_manager()
token = jwt_manager.create_token(user_id, role)

# 验证token
token_info = jwt_manager.verify_token(token)
if token_info:
    user_id = token_info['user_id']
    role = token_info['role']
```

功能：
* 支持角色信息编码
* 自动处理令牌过期
* 可配置加密算法和密钥

### 2.3 密码工具

`utils/password_utils.py` 提供密码加密和验证：

```python
# 密码加密
hashed = hash_password(password)

# 密码验证
is_valid = verify_password(password, hashed)
```

特点：
* 使用bcrypt加密算法
* 自动处理盐值生成
* 支持配置加密强度

### 2.4 配置管理

`utils/config_utils.py` 提供配置文件加载和访问：

```python
# 加载配置 app.py
config = Config('./config/config.yaml')
config.to_flask_config(app)

# 访问配置
import current_app
value = current_app.config['key']['subkey']
```

## 3. 核心模块说明

### 3.1 Controllers 控制器层

位于 `controllers/` 目录，负责处理HTTP请求、参数验证和返回响应。
示例（登录控制器）：

```python
@app.route('/admin/login', methods=['POST'])
def admin_login_controller():
    data = request.get_json()
    # 参数验证和业务处理
    result = admin_login(data['username'], data['password'])
    return jsonify(result)
```

### 3.2 Mappers 数据访问层

位于 `mappers/` 目录，负责数据库操作，提供数据访问接口。
示例（查询管理员）：

```python
def get_admin_by_username(username):
    with current_app.db as cursor:
        query = """
            SELECT AdminID, Username, PasswordHash, Role
            FROM Administrators
            WHERE Username = %s
        """
        cursor.execute(query, (username,))
        return cursor.fetchone()
```

### 3.3 Services 服务层

位于 `services/` 目录，处理业务逻辑，调用mapper层进行数据操作。

```python
def admin_login(username, password):
    admin = get_admin_by_username(username)
    if verify_password(password, admin['password_hash']):
        return create_login_response(admin)
    return None
```