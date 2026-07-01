import json
import sys
from pathlib import Path
from tqdm import tqdm
from models.book import Book, TextChunk
from services.database_service import DatabaseService
from services.embedding_service import EmbeddingService
from services.vector_store import VectorStore
from utils.text_processor import TextProcessor
from config import DATA_DIR
from utils.logger import setup_logger

logger = setup_logger(__name__)

def load_books_metadata():
    """加载书目元数据"""
    metadata_file = DATA_DIR / "metadata" / "books.json"
    
    if not metadata_file.exists():
        logger.error(f"元数据文件不存在: {metadata_file}")
        sys.exit(1)
    
    with open(metadata_file, 'r', encoding='utf-8') as f:
        books_data = json.load(f)
    
    books = []
    for book_data in books_data:
        book = Book(**book_data)
        books.append(book)
    
    logger.info(f"加载了 {len(books)} 本书的元数据")
    return books

def process_book_text(book: Book, vector_store: VectorStore, text_processor: TextProcessor):
    """处理单本书的文本"""
    text_file = DATA_DIR / "raw_texts" / book.file_path
    
    if not text_file.exists():
        logger.warning(f"文本文件不存在: {text_file}")
        return
    
    # 读取文本
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # 清理文本
    text = text_processor.clean_text(text)
    
    # 分块
    chunks = text_processor.split_into_chunks(text)
    
    # 准备向量存储数据
    texts = []
    metadatas = []
    ids = []
    
    for chunk_text, chunk_index in chunks:
        chunk_id = f"{book.book_id}_chunk_{chunk_index}"
        
        texts.append(chunk_text)
        metadatas.append({
            'book_id': book.book_id,
            'title': book.title,
            'author': book.author,
            'dynasty': book.dynasty,
            'chunk_index': chunk_index
        })
        ids.append(chunk_id)
    
    # 批量添加到向量存储
    if texts:
        vector_store.add_texts(texts, metadatas, ids)
        logger.info(f"处理完成《{book.title}》，共 {len(texts)} 个文本块")

def main():
    """主函数"""
    logger.info("开始初始化文言文RAG系统数据库")
    
    # 初始化服务
    db_service = DatabaseService()
    embedding_service = EmbeddingService()
    vector_store = VectorStore(embedding_service)
    text_processor = TextProcessor()
    
    # 初始化数据库
    db_service.init_database()
    
    # 清空向量存储
    vector_store.clear()
    
    # 加载书目元数据
    books = load_books_metadata()
    
    # 处理每本书
    for book in tqdm(books, desc="处理书籍"):
        # 插入数据库
        db_service.insert_book(book)
        
        # 处理文本并存入向量数据库
        process_book_text(book, vector_store, text_processor)
    
    logger.info("数据库初始化完成！")

if __name__ == "__main__":
    main()