import re
import jieba
from typing import List, Tuple
from config import MAX_CHUNK_SIZE, CHUNK_OVERLAP
from utils.logger import setup_logger

logger = setup_logger(__name__)

class TextProcessor:
    """文本处理器，用于分块和预处理文言文文本"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """清理文本，去除多余空格和特殊字符"""
        # 去除多余空白字符
        text = re.sub(r'\s+', ' ', text)
        # 去除特殊控制字符
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        return text.strip()
    
    @staticmethod
    def split_into_chunks(text: str, max_size: int = MAX_CHUNK_SIZE, 
                         overlap: int = CHUNK_OVERLAP) -> List[Tuple[str, int]]:
        """将文本分割成固定大小的块，返回(chunk_text, chunk_index)列表"""
        chunks = []
        sentences = re.split(r'[。！？；]', text)
        
        current_chunk = ""
        chunk_index = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # 如果当前句子本身就超过最大长度，需要进一步分割
            if len(sentence) > max_size:
                # 按逗号分割
                sub_sentences = sentence.split('，')
                for sub_sentence in sub_sentences:
                    if len(current_chunk) + len(sub_sentence) + 1 <= max_size:
                        current_chunk += sub_sentence + '，'
                    else:
                        if current_chunk:
                            chunks.append((current_chunk.rstrip('，'), chunk_index))
                            chunk_index += 1
                        current_chunk = sub_sentence + '，'
            else:
                # 正常处理
                if len(current_chunk) + len(sentence) + 1 <= max_size:
                    current_chunk += sentence + '。'
                else:
                    if current_chunk:
                        chunks.append((current_chunk.rstrip('。'), chunk_index))
                        chunk_index += 1
                    
                    # 保留重叠部分
                    if overlap > 0 and chunks:
                        overlap_text = chunks[-1][0][-overlap:]
                        current_chunk = overlap_text + sentence + '。'
                    else:
                        current_chunk = sentence + '。'
        
        # 处理最后一个块
        if current_chunk:
            chunks.append((current_chunk.rstrip('。'), chunk_index))
        
        logger.info(f"文本被分割成 {len(chunks)} 个块")
        return chunks
    
    @staticmethod
    def extract_keywords(text: str, top_k: int = 10) -> List[str]:
        """提取文本关键词"""
        words = jieba.lcut(text)
        # 过滤停用词和短词
        words = [w for w in words if len(w) >= 2]
        # 统计词频
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        # 按频率排序
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, freq in sorted_words[:top_k]]