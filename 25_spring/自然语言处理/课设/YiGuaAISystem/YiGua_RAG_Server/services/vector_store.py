import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import uuid
from config import CHROMA_DB_PATH
from services.embedding_service import EmbeddingService
from utils.logger import setup_logger

logger = setup_logger(__name__)

class VectorStore:
    """ChromaDB向量存储服务"""
    
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        
        # 确保目录存在
        CHROMA_DB_PATH.mkdir(parents=True, exist_ok=True)
        
        # 初始化ChromaDB客户端
        self.client = chromadb.PersistentClient(
            path=str(CHROMA_DB_PATH),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # 创建或获取集合
        self.collection = self.client.get_or_create_collection(
            name="classical_texts",
            metadata={"hnsw:space": "cosine"}
        )
        logger.info("向量存储初始化完成")
    
    def add_texts(self, texts: List[str], metadatas: List[Dict], 
                  ids: Optional[List[str]] = None):
        """添加文本到向量存储"""
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in texts]
        
        # 批量编码文本
        embeddings = self.embedding_service.encode(texts)
        # 确保每个向量是一维的
        if len(embeddings.shape) > 2:
            embeddings = embeddings.squeeze()
        embeddings_list = embeddings.cpu().numpy().tolist()
        
        # 添加到ChromaDB
        self.collection.add(
            embeddings=embeddings_list,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"成功添加 {len(texts)} 个文本到向量存储")
    
    def search(self, queries: List[str], top_k: int = 5) -> Dict[str, List[Dict]]:
        """向量检索"""
        results = {}
        
        for query in queries:
            # 编码查询
            query_embedding = self.embedding_service.encode(query)
            # 确保是一维数组
            if len(query_embedding.shape) > 1:
                query_embedding = query_embedding.squeeze()
            query_embedding_list = query_embedding.cpu().numpy().tolist()
            
            # 检索
            search_results = self.collection.query(
                query_embeddings=[query_embedding_list],
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # 整理结果
            query_results = []
            if search_results['documents'] and search_results['documents'][0]:
                for i in range(len(search_results['documents'][0])):
                    result = {
                        'text': search_results['documents'][0][i],
                        'metadata': search_results['metadatas'][0][i],
                        'score': 1 - search_results['distances'][0][i]  # 转换为相似度分数
                    }
                    query_results.append(result)
            
            results[query] = query_results
        
        logger.info(f"完成 {len(queries)} 个查询的检索")
        return results
    
    def clear(self):
        """清空向量存储"""
        try:
            self.client.delete_collection("classical_texts")
            self.collection = self.client.create_collection(
                name="classical_texts",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("向量存储已清空")
        except Exception as e:
            logger.error(f"清空向量存储失败: {e}")