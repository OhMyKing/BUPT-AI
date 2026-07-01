import torch
from typing import List, Union
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL, EMBEDDING_BATCH_SIZE
from utils.logger import setup_logger

logger = setup_logger(__name__)

class EmbeddingService:
    """文本嵌入服务"""
    
    def __init__(self):
        logger.info(f"加载Embedding模型: {EMBEDDING_MODEL}")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = self.model.to(self.device)
        logger.info(f"模型加载完成，使用设备: {self.device}")
    
    def encode(self, texts: Union[str, List[str]], 
               batch_size: int = EMBEDDING_BATCH_SIZE) -> torch.Tensor:
        """将文本转换为向量"""
        if isinstance(texts, str):
            texts = [texts]
        
        logger.debug(f"编码 {len(texts)} 个文本")
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            convert_to_tensor=True,
            show_progress_bar=len(texts) > 100
        )
        
        return embeddings
    
    def get_embedding_dim(self) -> int:
        """获取嵌入维度"""
        return self.model.get_sentence_embedding_dimension()