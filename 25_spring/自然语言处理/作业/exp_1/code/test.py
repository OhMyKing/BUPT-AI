from scipy.stats import spearmanr, pearsonr
from utils import cosine_similarity

def evaluate_wordsim(eval_file, word_to_vec_svd, word_to_vec_sgns):
    人工评分列表 = []
    svd相似度列表 = []
    sgns相似度列表 = []
    
    with open(eval_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    results = []
    for line in lines:
        line = line.strip()
        parts = line.split('\t')
        
        # 跳过格式不正确的行
        if len(parts) < 3:
            results.append((line, 0.0, 0.0))
            continue
        
        # 提取单词对
        word1, word2 = parts[1].lower(), parts[2].lower()
        
        # 尝试从第一列提取人工评分（如果可以转换为浮点数）
        人工评分 = None
        try:
            人工评分 = float(parts[0])
        except (ValueError, IndexError):
            # 尝试从最后一列提取人工评分
            if len(parts) > 3:
                try:
                    人工评分 = float(parts[3])
                except (ValueError, IndexError):
                    pass
        
        # 计算SVD相似度
        if word1 in word_to_vec_svd and word2 in word_to_vec_svd:
            sim_svd = cosine_similarity(word_to_vec_svd[word1], word_to_vec_svd[word2])
        else:
            sim_svd = 0.0
        
        # 计算SGNS相似度
        if word1 in word_to_vec_sgns and word2 in word_to_vec_sgns:
            sim_sgns = cosine_similarity(word_to_vec_sgns[word1], word_to_vec_sgns[word2])
        else:
            sim_sgns = 0.0
        
        # 只有在有人工评分且两个词都存在于两个词向量表示中时，才计入相关系数的计算
        if 人工评分 is not None and word1 in word_to_vec_svd and word2 in word_to_vec_svd and word1 in word_to_vec_sgns and word2 in word_to_vec_sgns:
            人工评分列表.append(人工评分)
            svd相似度列表.append(sim_svd)
            sgns相似度列表.append(sim_sgns)
        
        results.append((line, sim_svd, sim_sgns))
    
    # 如果有人工评分，计算相关系数
    if 人工评分列表 and len(人工评分列表) > 1:
        # 计算Spearman等级相关系数
        spearman_svd, p_value_spearman_svd = spearmanr(人工评分列表, svd相似度列表)
        spearman_sgns, p_value_spearman_sgns = spearmanr(人工评分列表, sgns相似度列表)
        
        # 计算Pearson相关系数
        pearson_svd, p_value_pearson_svd = pearsonr(人工评分列表, svd相似度列表)
        pearson_sgns, p_value_pearson_sgns = pearsonr(人工评分列表, sgns相似度列表)
        
        print(f"有效词对数量: {len(人工评分列表)}")
        print(f"SVD方法 Spearman等级相关系数: {spearman_svd:.4f}, p值: {p_value_spearman_svd:.4f}")
        print(f"SVD方法 Pearson相关系数: {pearson_svd:.4f}, p值: {p_value_pearson_svd:.4f}")
        print(f"SGNS方法 Spearman等级相关系数: {spearman_sgns:.4f}, p值: {p_value_spearman_sgns:.4f}")
        print(f"SGNS方法 Pearson相关系数: {pearson_sgns:.4f}, p值: {p_value_pearson_sgns:.4f}")
        
        # 返回结果和相关系数
        return results, {
            'spearman_svd': spearman_svd,
            'p_value_spearman_svd': p_value_spearman_svd,
            'pearson_svd': pearson_svd,
            'p_value_pearson_svd': p_value_pearson_svd,
            'spearman_sgns': spearman_sgns,
            'p_value_spearman_sgns': p_value_spearman_sgns,
            'pearson_sgns': pearson_sgns,
            'p_value_pearson_sgns': p_value_pearson_sgns
        }
    else:
        if not 人工评分列表:
            print("警告：无法从文件中提取人工评分，无法计算相关系数")
        else:
            print("警告：没有足够的有效数据点来计算相关系数")
        return results, None