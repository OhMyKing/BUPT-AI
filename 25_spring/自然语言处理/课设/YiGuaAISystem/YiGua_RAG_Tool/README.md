# YiGua RAG Tool - 易学古籍检索Dify插件

一个用于将易学古籍RAG服务集成到Dify平台的标准化插件工具。

## 📖 项目简介

YiGua RAG Tool 是一个遵循Dify插件开发协议的工具插件，旨在将 YiGua_RAG_Server（易学古籍检索服务）的功能无缝集成到 Dify 平台中。通过本插件，用户可以在 Dify 的工作流和 Agent 中方便地调用古籍检索服务，实现智能化的易学咨询问答。

本插件是2025年自然语言处理课程项目《基于古汉语检索增强生成的易学咨询智能体》的组成部分。

## 🚀 主要功能

- **书目检索** (`book_search`)：根据朝代和领域检索相关易学古籍
- **文本检索** (`text_search`)：在指定书籍中检索具体文本内容
- **标准化接口**：遵循 Dify 插件协议，支持多种输出格式
- **智能参数处理**：自动解析和验证输入参数，提供友好的错误提示

## 🏗️ 插件架构

```
YiGua_RAG_Tool/
├── provider/                    # 工具提供者
│   ├── yigua_rga_tool.py       # 凭证验证逻辑
│   └── yigua_rga_tool.yaml     # 提供者配置
├── tools/                       # 具体工具实现
│   ├── book_search.py          # 书目检索工具
│   ├── book_search.yaml        # 书目检索配置
│   ├── text_search.py          # 文本检索工具
│   └── text_search.yaml        # 文本检索配置
├── main.py                     # 插件入口
├── manifest.yaml               # 插件元信息
└── requirements.txt            # 依赖列表
```

## 📦 安装与配置

### 前置要求

1. 运行中的 YiGua_RAG_Server 服务
2. Dify 平台（支持自定义工具）
3. Python 3.10+

### 安装步骤

1. **部署到 Dify**

   方式一：远程调试模式
   ```bash
   # 复制环境配置文件
   cp .env.example .env
   
   # 编辑 .env 文件，填入你的 Dify 调试信息
   INSTALL_METHOD=remote
   REMOTE_INSTALL_URL=your-dify-url:5003
   REMOTE_INSTALL_KEY=your-debug-key
   
   # 运行插件
   python main.py
   ```

   方式二：打包上传模式
   ```bash
   # 打包插件
   zip -r yigua_rag_tool.zip . -x ".*" "__pycache__/*"
   
   # 在 Dify 平台上传 zip 文件
   ```

2. **配置插件凭证**

   在 Dify 平台中添加插件后，需要配置 RAG 服务器地址：
   ```
   Server Base URL: http://your-rag-server:5000
   ```

## 🔧 使用方法

### 在 Dify Agent 中使用

1. 创建一个新的 Agent 或编辑现有 Agent
2. 在工具列表中添加 "易学古籍检索工具"
3. 在 Agent 的系统提示词中说明工具的使用场景

示例系统提示词：
```
你是一位精通易学的智能助手。当用户询问易学相关问题时，请按以下步骤操作：
1. 使用 book_search 工具查找相关书目
2. 使用 text_search 工具检索具体内容
3. 基于检索结果为用户提供专业解答
```

### 在工作流中使用

1. 在工作流中添加 "工具" 节点
2. 选择 "易学古籍检索工具"
3. 配置相应的参数

## 📖 API 文档

### book_search - 书目检索

**功能**：根据朝代和领域检索易学古籍书目

**参数**：
- `dynasties` (string, 可选): 朝代列表，逗号分隔
  - 可选值：东晋、东汉、唐、宋、战国、明、清、近代
- `domains` (string, 可选): 领域列表，逗号分隔
  - 可选值：三式、中医、六壬、医学、卜卦、占星、命理、哲学、易学、星命、相术、象数、道家、风水
- `limit` (number, 可选): 返回结果数量限制，默认10

**返回值**：
- 文本格式：书目列表的格式化文本
- JSON格式：包含 `books` 数组和 `count` 计数
- 变量输出：`book_titles` 书名列表

### text_search - 文本检索

**功能**：在指定书籍中检索相关文本内容

**参数**：
- `title` (string, 必需): 书名列表，逗号分隔
- `queries` (string, 必需): 检索关键词，逗号分隔
- `top_k` (number, 可选): 返回结果数量，默认5

**返回值**：
- 文本格式：检索到的文本段落
- JSON格式：包含 `texts` 数组、`count` 计数和 `search_params`
- 变量输出：`retrieved_texts` 文本内容列表

## 🌟 使用示例

### 示例1：查询乾卦含义

```
用户：什么是乾卦？

Agent调用流程：
1. book_search(domains="易学,卜卦", limit=5)
   → 返回《周易》等相关书目

2. text_search(title="周易", queries="乾卦,元亨利贞", top_k=3)
   → 返回乾卦相关原文和解释
```

### 示例2：查询风水知识

```
用户：如何看房屋朝向的风水？

Agent调用流程：
1. book_search(dynasties="明,清", domains="风水", limit=5)
   → 返回风水相关书籍

2. text_search(title="阳宅十书", queries="朝向,坐北朝南", top_k=5)
   → 返回房屋朝向的风水理论
```

## 🐛 故障排除

### 常见问题

1. **连接错误**：检查 RAG Server 是否正常运行，URL 是否正确
2. **参数错误**：确保朝代和领域使用正确的取值
3. **无结果返回**：尝试调整检索关键词或扩大搜索范围

### 调试建议

- 查看 Dify 平台的日志输出
- 使用 curl 直接测试 RAG Server API
- 检查网络连接和防火墙设置

## 🔗 相关链接

- [Dify 插件开发文档](https://docs.dify.ai/plugin-dev-zh/0111-getting-started-dify-plugin)

---
*本插件是2025年自然语言处理课程实践项目的一部分*