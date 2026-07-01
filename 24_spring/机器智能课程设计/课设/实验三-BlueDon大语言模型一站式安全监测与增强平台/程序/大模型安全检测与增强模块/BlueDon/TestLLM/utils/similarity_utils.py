import os
from sentence_transformers import SentenceTransformer, util

class SentenceEmbeddingSimilarity:
    def __init__(self, model_path='models.py', model_name='all-MiniLM-L6-v2'):
        self.model_path = os.path.join(model_path, model_name)
        # 检查模型是否已经在指定路径下
        if not os.path.exists(self.model_path):
            print(f"句嵌入模型 {model_name} 不存在于 {model_path}，正在下载...")
            # 下载并保存模型
            model = SentenceTransformer(model_name)
            model.save(self.model_path)
            print(f"句嵌入模型已保存到 {self.model_path}")
        else:
            print(f"加载本地句嵌入模型 {self.model_path}")
            model = SentenceTransformer(self.model_path)
        self.model = model


    def compute_similarity_loss(self, str1, str2):
        embedding1 = self.model.encode(str1, convert_to_tensor=True)
        embedding2 = self.model.encode(str2, convert_to_tensor=True)
        cosine_similarity = util.pytorch_cos_sim(embedding1, embedding2)
        # 将余弦相似度转换为损失值，范围在 [0, 1] 之间
        similarity_loss = 1 - cosine_similarity
        return similarity_loss.item()
