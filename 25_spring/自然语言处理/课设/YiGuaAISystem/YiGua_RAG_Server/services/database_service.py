import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict
from pathlib import Path
from models.book import Book
from config import SQLITE_DB_PATH
from utils.logger import setup_logger

logger = setup_logger(__name__)

class DatabaseService:
    """SQLite数据库服务，管理书目元数据"""
    
    def __init__(self):
        self.db_path = SQLITE_DB_PATH
        self._ensure_database_exists()
    
    def _ensure_database_exists(self):
        """确保数据库文件存在"""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
    
    def init_database(self):
        """初始化数据库表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 创建书目表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT,
                dynasty TEXT,
                domains TEXT,  -- JSON array
                description TEXT,
                year INTEGER,
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建索引
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_dynasty ON books(dynasty)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_year ON books(year)')
        
        conn.commit()
        conn.close()
        logger.info("数据库初始化完成")
    
    def insert_book(self, book: Book):
        """插入书目"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO books 
                (book_id, title, author, dynasty, domains, description, year, file_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                book.book_id,
                book.title,
                book.author,
                book.dynasty,
                json.dumps(book.domains, ensure_ascii=False),
                book.description,
                book.year,
                book.file_path
            ))
            conn.commit()
            logger.info(f"成功插入书目: {book.title}")
        except Exception as e:
            logger.error(f"插入书目失败: {e}")
            raise
        finally:
            conn.close()
    
    def search_books(self, dynasties: Optional[List[str]] = None,
                    domains: Optional[List[str]] = None,
                    limit: int = 10) -> List[Dict]:
        """根据朝代和领域搜索书目"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM books WHERE 1=1"
        params = []
        
        # 朝代筛选
        if dynasties:
            placeholders = ','.join(['?' for _ in dynasties])
            query += f" AND dynasty IN ({placeholders})"
            params.extend(dynasties)
        
        # 领域筛选（需要JSON查询）
        if domains:
            domain_conditions = []
            for domain in domains:
                domain_conditions.append("domains LIKE ?")
                params.append(f'%"{domain}"%')
            query += f" AND ({' OR '.join(domain_conditions)})"
        
        query += f" LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            book_dict = dict(row)
            book_dict['domains'] = json.loads(book_dict['domains'])
            results.append(book_dict)
        
        logger.info(f"检索到 {len(results)} 本书")
        return results
    
    def get_books_by_titles(self, titles: List[str]) -> List[Dict]:
        """根据书名列表获取书目信息"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        placeholders = ','.join(['?' for _ in titles])
        query = f"SELECT * FROM books WHERE title IN ({placeholders})"
        
        cursor.execute(query, titles)
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            book_dict = dict(row)
            book_dict['domains'] = json.loads(book_dict['domains'])
            results.append(book_dict)
        
        return results