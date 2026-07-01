from collections import Counter
import re
from scipy.spatial.distance import cosine
import numpy as np
import torch
from torch.utils.data import Dataset
import random
from scipy import sparse
from config import MIN_COUNT, SGNS_WINDOW_SIZE, SUBSAMPLE_THRESHOLD

class PermutedSubsampledCorpus(Dataset):
    def __init__(self, tokens, vocab, word_freq, window_size=SGNS_WINDOW_SIZE, ss_t=SUBSAMPLE_THRESHOLD):
        self.tokens = tokens
        self.vocab = vocab
        self.word_freq = word_freq
        self.window_size = window_size
        
        # 计算下采样概率
        self.subsampling_rates = {}
        for word, freq in word_freq.items():
            # 计算保留概率: 1 - sqrt(t/f)
            self.subsampling_rates[word] = 1.0 - np.sqrt(ss_t / freq)
        
        # 创建训练数据
        self.data = self._create_training_data()
        
    def _create_training_data(self):
        """创建训练数据对，应用下采样"""
        data = []
        for i, target_word in enumerate(self.tokens):
            if target_word not in self.vocab:
                continue
                
            # 下采样频繁词
            if target_word in self.subsampling_rates and random.random() > self.subsampling_rates[target_word]:
                continue
                
            target_id = self.vocab[target_word]
            
            # 获取窗口内的上下文词
            window_size = random.randint(1, self.window_size)  # 动态窗口大小
            for j in range(max(0, i - window_size), min(len(self.tokens), i + window_size + 1)):
                if i == j:  # 跳过词本身
                    continue
                    
                context_word = self.tokens[j]
                if context_word not in self.vocab:
                    continue
                    
                context_id = self.vocab[context_word]
                data.append((target_id, context_id))
        
        return data
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        target_id, context_id = self.data[idx]
        return torch.tensor(target_id), torch.tensor(context_id)


def preprocess_corpus(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read().lower()
    
    # 按空格和标点进行分词
    tokens = re.findall(r'\b\w+\b', text)
    return tokens

def build_vocab(tokens, min_count=MIN_COUNT):
    word_counts = Counter(tokens)
    filtered_words = {word: count for word, count in word_counts.items() 
                      if count >= min_count}
    
    vocab = {'<UNK>': 0}  # 添加未知词标记
    id2word = {0: '<UNK>'}
    
    for i, (word, _) in enumerate(sorted(filtered_words.items(), key=lambda x: x[1], reverse=True)):
        vocab[word] = i + 1
        id2word[i + 1] = word
    
    # 计算词频率
    total_words = sum(filtered_words.values())
    word_freq = {word: count / total_words for word, count in filtered_words.items()}
    
    return vocab, id2word, word_freq

def cosine_similarity(vec1, vec2):
    """计算两个向量的余弦相似度"""
    if np.all(vec1 == 0) or np.all(vec2 == 0):
        return 0.0
    return 1 - cosine(vec1, vec2)

def apply_ppmi(cooc_matrix):
    """应用Positive Pointwise Mutual Information变换到共现矩阵"""
    
    # 获取词频（边缘概率）
    row_sum = np.array(cooc_matrix.sum(axis=1)).flatten()
    col_sum = np.array(cooc_matrix.sum(axis=0)).flatten()
    
    # 计算总和用于归一化
    total_sum = float(cooc_matrix.sum())
    
    # 避免除以零，添加一个小的epsilon
    epsilon = 1e-10
    
    # PMI计算
    rows, cols = cooc_matrix.nonzero()
    num_nonzero = len(rows)
    
    # 初始化新稀疏矩阵的数据数组
    new_data = np.zeros(num_nonzero)
    
    # 计算非零元素的PPMI
    for idx in range(num_nonzero):
        i, j = rows[idx], cols[idx]
        count = cooc_matrix[i, j]
        
        # 计算PMI
        p_i_j = count / total_sum
        p_i = row_sum[i] / total_sum
        p_j = col_sum[j] / total_sum
        
        # 避免log(0)通过添加epsilon
        pmi = np.log((p_i_j + epsilon) / ((p_i * p_j) + epsilon))
        
        # 应用PPMI（将负PMI值设为0）
        new_data[idx] = max(0, pmi)
    
    # 创建带有PPMI值的新稀疏矩阵
    ppmi_matrix = sparse.csr_matrix((new_data, (rows, cols)), shape=cooc_matrix.shape)
    
    return ppmi_matrix