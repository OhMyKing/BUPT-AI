from flask import Blueprint, request, jsonify
from services.vector_store import VectorStore
from services.embedding_service import EmbeddingService
from services.rerank_service import RerankService
from services.database_service import DatabaseService
from config import DEFAULT_TOP_K, MAX_TOP_K
from utils.logger import setup_logger

logger = setup_logger(__name__)
texts_bp = Blueprint('texts', __name__)

# 初始化服务
embedding_service = EmbeddingService()
vector_store = VectorStore(embedding_service)
rerank_service = RerankService()
db_service = DatabaseService()

@texts_bp.route('/search', methods=['POST'])
def search_texts():
    """文本检索接口"""
    try:
        data = request.get_json()
        
        # 获取参数
        titles = data.get('title', [])  # 兼容单个或多个书名
        if isinstance(titles, str):
            titles = [titles]
        
        queries = data.get('queries', [])
        if isinstance(queries, str):
            queries = [queries]
        
        top_k = min(data.get('top_k', DEFAULT_TOP_K), MAX_TOP_K)
        
        logger.info(f"文本检索请求 - 书名: {titles}, 查询: {queries}, top_k: {top_k}")
        
        # 验证书名是否存在
        books = db_service.get_books_by_titles(titles)
        valid_titles = [book['title'] for book in books]
        
        if not valid_titles:
            return jsonify({
                'status': 'error',
                'message': '未找到指定的书目'
            }), 404
        
        # 执行向量检索
        all_results = []
        
        for query in queries:
            # 向量检索
            search_results = vector_store.search([query], top_k=top_k * 2)  # 多检索一些用于重排序
            query_results = search_results.get(query, [])
            
            # 过滤指定书目的结果
            filtered_results = [
                result for result in query_results
                if result['metadata'].get('title') in valid_titles
            ]
            
            # 重排序
            if filtered_results:
                reranked_results = rerank_service.rerank(query, filtered_results, top_k=top_k)
                
                # 格式化结果
                for result in reranked_results:
                    all_results.append({
                        'title': result['metadata']['title'],
                        'text': result['text']
                    })
        
        return jsonify({
            'status': 'success',
            'data': {
                'results': all_results
            }
        })
        
    except Exception as e:
        logger.error(f"文本检索错误: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500