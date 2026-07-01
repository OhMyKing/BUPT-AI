# 引导任务发布器 (Guide Task Publisher)

**作者:** ohmyking  
**版本:** 0.0.1  
**类型:** Tool

## 描述

引导任务发布器是一个为北京邮电大学迎新机器人系统设计的Dify插件。该插件允许机器人在用户需要导航协助时，向距离最近的引导机器人发布引导任务。

## 功能特性

- 自动选择距离最近的引导机器人
- 支持北邮校园内的预定义目的地
- 提供详细的任务发布反馈信息
- 支持自定义API服务器地址

## 支持的目的地

插件支持以下预定义的目的地：

### 宿舍区
- 雁北A、雁北C、雁北D1、雁北D2
- 雁南S2、雁南S3、雁南S4、雁南S5、雁南S6

### 校门
- 南门
- 西门

### 学院资料领取点
- 人工智能学院资料领取点
- 计算机学院资料领取点
- 通信学院资料领取点
- 现代邮政学院资料领取点
- 电子学院资料领取点

## 配置说明

### 1. 安装插件

1. 在Dify中安装此插件
2. 配置Base URL（默认：`http://127.0.0.1:5005`）

### 2. 使用方法

在对话中，当用户表达需要前往某个地点的意图时，AI会自动调用此工具。例如：
- "我要去计算机学院资料领取点"
- "请带我去南门"
- "我想去雁北A宿舍"

### 3. API响应

成功响应示例：
```json
{
    "message": "引导任务发布成功",
    "success": true,
    "task_details": {
        "destination": "计算机学院资料领取点",
        "destination_id": 13,
        "distance_to_guide": 49.72,
        "guide_robot_id": 2,
        "source_robot_id": 5
    }
}
```

## 技术细节

- **机器人ID**: 默认为5（可在代码中修改）
- **请求方式**: POST
- **API端点**: `/api/publish_guide_task`
- **超时时间**: 10秒

## 错误处理

插件会处理以下错误情况：
- 无效的目的地
- 服务器连接失败
- 请求超时
- API返回错误

## 开发和调试

### 环境配置

创建`.env`文件：
```bash
INSTALL_METHOD=remote
REMOTE_INSTALL_URL=debug.dify.ai:5003
REMOTE_INSTALL_KEY=your_debug_key
```

### 本地运行

```bash
# 安装依赖
pip install -r requirements.txt

# 运行插件
python -m main
```

## 许可证

请参阅PRIVACY.md了解隐私政策详情。