from typing import List, Dict, Tuple
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from config import RERANK_MODEL
from utils.logger import setup_logger

logger = setup_logger(__name__)

class RerankService:
    """重排序服务"""
    
    def __init__(self):
        logger.info(f"加载Rerank模型: {RERANK_MODEL}")
        self.tokenizer = AutoTokenizer.from_pretrained(RERANK_MODEL)
        self.model = AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL)
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = self.model.to(self.device)
        self.model.eval()
        logger.info(f"Rerank模型加载完成，使用设备: {self.device}")
    
    def rerank(self, query: str, documents: List[Dict], top_k: int = 5) -> List[Dict]:
        """对检索结果进行重排序"""
        if not documents:
            return []
        
        pairs = [[query, doc['text']] for doc in documents]
        
        with torch.no_grad():
            inputs = self.tokenizer(
                pairs,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors='pt'
            ).to(self.device)
            
            scores = self.model(**inputs).logits.squeeze(-1)
            scores = torch.sigmoid(scores).cpu().numpy()
        
        # 将分数添加到文档中并排序
        for i, doc in enumerate(documents):
            doc['rerank_score'] = float(scores[i])
        
        # 按重排序分数降序排序
        reranked = sorted(documents, key=lambda x: x['rerank_score'], reverse=True)
        
        return reranked[:top_k]