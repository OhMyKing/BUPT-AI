from flask import Blueprint, request, jsonify
from typing import List, Optional
from services.database_service import DatabaseService
from utils.logger import setup_logger

logger = setup_logger(__name__)
books_bp = Blueprint('books', __name__)

# 初始化服务
db_service = DatabaseService()

@books_bp.route('/search', methods=['POST'])
def search_books():
    """年代与领域索引接口"""
    try:
        data = request.get_json()
        
        # 获取参数
        dynasties = data.get('dynasties', None)
        domains = data.get('domains', None)
        limit = data.get('limit', 10)
        
        # 参数验证
        if limit > 100:
            limit = 100
        
        logger.info(f"书目检索请求 - 朝代: {dynasties}, 领域: {domains}, 限制: {limit}")
        
        # 执行检索
        books = db_service.search_books(
            dynasties=dynasties,
            domains=domains,
            limit=limit
        )
        
        # 格式化响应
        response_books = []
        for book in books:
            response_books.append({
                'title': book['title'],
                'dynasty': book['dynasty'],
                'domain': book['domains'],
                'author': book['author'],
                'description': book['description']
            })
        
        return jsonify({
            'status': 'success',
            'data': {
                'books': response_books,
                'total': len(response_books)
            }
        })
        
    except Exception as e:
        logger.error(f"书目检索错误: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500