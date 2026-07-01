# YiGua RAG Server

基于古汉语检索增强生成的易学咨询服务器

## 项目简介

YiGua RAG Server 是一个专门针对古汉语文本的检索增强生成（RAG）系统，通过融合语言学知识与深度学习技术，实现了高质量的跨时语义匹配。本项目是 2025 年**自然语言处理**课程实践的一部分，旨在解决古汉语文本理解中的语义鸿沟问题。

### 核心特性

- 🎯 **跨时语义检索**：基于双音节对齐替换的向量表示微调方法，将 Recall@1 从 89.17% 提升至 93.44%
- 📚 **层次化知识库**：包含 28 部易学典籍，超过 300 万字符，采用年代-领域-书目-文本的四级索引结构
- 🚀 **两阶段检索优化**：向量检索 + 重排序策略，显著提升检索准确性
- 🔌 **Dify 插件支持**：遵循 Dify 插件协议，可无缝集成到 AI 应用开发平台

## 系统架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   微信小程序     │────▶│   Dify Platform   │────▶│  YiGua RAG      │
│   易卦AI        │     │   (ReAct Agent)   │     │    Server       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   GLM-4-AirX     │     │   Multi-level   │
                        │      (LLM)       │     │    Index DB     │
                        └──────────────────┘     └─────────────────┘
```

## 快速开始

### 环境要求

- Python 3.8+
- CUDA 11.0+ (GPU 推理，可选)
- 8GB+ RAM

### 安装部署

1. **克隆项目**
```bash
git clone https://github.com/yourusername/yigua-rag-server.git
cd yigua-rag-server
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **初始化数据库**
```bash
python init_database.py
```

4. **启动服务器**
```bash
python app.py
```

服务器将在 `http://0.0.0.0:5050` 启动

### Docker 部署（推荐）

```bash
docker build -t yigua-rag-server .
docker run -p 5050:5050 -v ./database:/app/database yigua-rag-server
```

## API 文档

### 1. 书目检索接口

**端点**: `POST /api/v1/books/search`

**请求示例**:
```json
{
    "dynasties": ["明", "清"],
    "domains": ["卜卦", "命理"],
    "limit": 10
}
```

**响应示例**:
```json
{
    "status": "success",
    "data": {
        "books": [
            {
                "title": "三命通会",
                "dynasty": "明",
                "domain": ["命理"],
                "author": "万民英",
                "description": "明代命理学集大成之作"
            }
        ],
        "total": 1
    }
}
```

### 2. 文本检索接口

**端点**: `POST /api/v1/texts/search`

**请求示例**:
```json
{
    "title": ["周易", "增删卜易"],
    "queries": ["六爻", "变爻"],
    "top_k": 5
}
```

**响应示例**:
```json
{
    "status": "success",
    "data": {
        "results": [
            {
                "title": "周易",
                "text": "爻者，言乎变者也..."
            }
        ]
    }
}
```

## 项目结构

```
YiGua_RAG_Server/
├── api/                    # API接口层
│   ├── books.py           # 书目检索接口
│   └── texts.py           # 文本检索接口
├── services/              # 核心服务层
│   ├── embedding_service.py   # 文本嵌入服务
│   ├── vector_store.py        # 向量存储服务
│   ├── database_service.py    # 数据库服务
│   └── rerank_service.py      # 重排序服务
├── models/                # 数据模型
│   └── book.py           # 书籍数据模型
├── utils/                 # 工具模块
│   ├── text_processor.py  # 文言文处理器
│   └── logger.py         # 日志工具
├── data/                  # 数据目录
│   ├── metadata/         # 书目元数据
│   └── raw_texts/        # 原始文本文件
├── database/             # 数据库文件
│   ├── books.db         # SQLite元数据库
│   └── chroma/          # ChromaDB向量库
├── app.py               # Flask应用入口
├── config.py            # 配置文件
└── init_database.py     # 数据库初始化脚本
```

## 核心技术

### 1. 双音节对齐替换技术

利用古汉语到现代汉语的演变规律（单音节词→双音节词），通过动态规划算法自动发现对应关系：

```python
# 示例：古文"月"对应现代文"月亮"
alignments = [
    ("月", "月亮"),
    ("日", "太阳"),
    ("山", "山峰")
]
```

### 2. 两阶段检索策略

- **第一阶段**：使用微调后的 BGE-large-zh 模型进行向量检索
- **第二阶段**：使用 BAAI/bge-reranker-v2-m3 进行精细化重排序

### 3. 层次化索引结构

```
年代 (Dynasty)
  └── 领域 (Domain)
      └── 书目 (Book)
          └── 文本块 (Text Chunk)
```

## 性能指标

- **检索准确率**: Recall@1 = 93.44% (C³Bench测试集)
- **支持规模**: 28 部典籍，300万+ 字符

## 收录典籍

系统收录了 28 部重要易学典籍，涵盖多个朝代和领域：

**卜卦类**: 《周易》《梅花易数》《火珠林》《增删卜易》等  
**命理类**: 《三命通会》《渊海子平》《滴天髓》《子平真诠》等  
**相术类**: 《神峰通考》《柳庄相法》等  
**风水类**: 《地理五诀》《阳宅集要》等