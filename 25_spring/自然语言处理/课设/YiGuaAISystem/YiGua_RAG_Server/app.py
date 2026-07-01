from flask import Flask, jsonify
from flask_cors import CORS
from api.books import books_bp
from api.texts import texts_bp
from config import API_HOST, API_PORT, API_DEBUG
from utils.logger import setup_logger

logger = setup_logger(__name__)

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 启用CORS
    CORS(app)
    
    # 注册端口
    app.register_blueprint(books_bp, url_prefix='/api/v1/books')
    app.register_blueprint(texts_bp, url_prefix='/api/v1/texts')
    
    # 健康检查端点
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Classical Chinese RAG System'
        })
    
    # 错误处理
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'status': 'error',
            'message': '端点不存在'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"内部服务器错误: {error}")
        return jsonify({
            'status': 'error',
            'message': '内部服务器错误'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    logger.info(f"启动文言文RAG系统 - {API_HOST}:{API_PORT}")
    app.run(host=API_HOST, port=API_PORT, debug=API_DEBUG)