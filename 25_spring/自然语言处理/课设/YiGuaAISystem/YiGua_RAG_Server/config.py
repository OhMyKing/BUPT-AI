import os
from pathlib import Path

# 基础路径配置
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATABASE_DIR = BASE_DIR / "database"

# 数据库配置
SQLITE_DB_PATH = DATABASE_DIR / "books.db"
CHROMA_DB_PATH = DATABASE_DIR / "chroma"

# 模型配置
EMBEDDING_MODEL = "BAAI/bge-large-zh-v1.5"
RERANK_MODEL = "BAAI/bge-reranker-v2-m3"
EMBEDDING_BATCH_SIZE = 32

# API配置
API_HOST = "0.0.0.0"
API_PORT = 5050
API_DEBUG = True

# 文本处理配置
MAX_CHUNK_SIZE = 500  # 每个文本块的最大字符数
CHUNK_OVERLAP = 50    # 文本块之间的重叠字符数

# 检索配置
DEFAULT_TOP_K = 5
MAX_TOP_K = 20

# 日志配置
LOG_LEVEL = "INFO"
LOG_FILE = "classical_chinese_rag.log"