from collections import defaultdict
import torch
import torch.optim as optim
from torch.utils.data import DataLoader
from scipy import sparse
from sklearn.decomposition import TruncatedSVD
from tqdm import tqdm
import os
import wandb
import numpy as np
from scipy.sparse import linalg as splinalg
import os
from scipy import sparse

from model import Word2Vec, SGNS
from test import evaluate_wordsim
from utils import PermutedSubsampledCorpus, apply_ppmi, build_vocab, preprocess_corpus
from config import *

def build_cooccurrence_matrix(tokens, vocab, window_size=SVD_WINDOW_SIZE, save_path=None):
    # 先检查是否已有保存的共现矩阵
    if save_path and os.path.exists(save_path):
        print(f"发现已有共现矩阵，正在从 {save_path} 加载...")
        try:
            cooc_matrix = sparse.load_npz(save_path)
            print(f"成功加载共现矩阵: 形状={cooc_matrix.shape}, 非零元素个数={cooc_matrix.nnz}")
            return cooc_matrix
        except Exception as e:
            print(f"加载共现矩阵失败: {e}")
            print("正在重新构建共现矩阵...")
    else:
        print("未找到保存的共现矩阵，开始构建新矩阵...")
    
    vocab_size = len(vocab)
    word_ids = [vocab.get(word, 0) for word in tokens]  # OOV词映射为<UNK>
    cooccurrence = defaultdict(float)
    
    print(f"开始计算共现统计，窗口大小={window_size}...")
    for i, target_id in enumerate(word_ids):
        # 在窗口内计算共现次数
        for j in range(max(0, i - window_size), min(len(word_ids), i + window_size + 1)):
            if i == j:  # 跳过词本身
                continue
            
            context_id = word_ids[j]
            
            # 按照距离加权，越远的上下文权重越低
            weight = 1.0 / abs(i - j)  # 添加距离权重
            cooccurrence[(target_id, context_id)] += weight
    
    # 转化为稀疏矩阵以提高效率
    rows, cols, data = [], [], []
    for (i, j), count in cooccurrence.items():
        # 确保索引不超出词表范围
        if i < vocab_size and j < vocab_size:
            rows.append(i)
            cols.append(j)
            data.append(count)
    
    cooc_matrix = sparse.csr_matrix((data, (rows, cols)), shape=(vocab_size, vocab_size))
    print(f"共现矩阵构建完成: 形状={cooc_matrix.shape}, 非零元素个数={cooc_matrix.nnz}")
    
    # 保存共现矩阵
    if save_path:
        print(f"正在保存共现矩阵到 {save_path}...")
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            sparse.save_npz(save_path, cooc_matrix)
            print("共现矩阵保存成功")
        except Exception as e:
            print(f"保存共现矩阵失败: {e}")
    
    return cooc_matrix

def apply_svd(cooc_matrix, n_components=EMBEDDING_DIM):
    print("正在对共现矩阵应用PMMI变换...")
    cooc_matrix = apply_ppmi(cooc_matrix)

    print("正在进行奇异值分解...")
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    word_vectors = svd.fit_transform(cooc_matrix)

    # 对词向量进行归一化处理
    print("正在对词向量进行归一化...")
    norm = np.linalg.norm(word_vectors, axis=1, keepdims=True)
    # 避免除以0
    norm[norm == 0] = 1.0
    word_vectors = word_vectors / norm
    
    # # 获取选取的奇异值
    # selected_singular_values = svd.singular_values_
    # sum_selected = np.sum(selected_singular_values)
    
    # try:
    #     # 计算所有奇异值
    #     n_rows, n_cols = cooc_matrix.shape
    #     min_dim = min(n_rows, n_cols)
    #     max_k = min(min_dim, 1000)  # 最多计算1000个奇异值
        
    #     # 使用svds计算奇异值
    #     _, all_singular_values, _ = splinalg.svds(cooc_matrix, k=max_k)
    #     all_singular_values = np.abs(all_singular_values)  # 确保所有奇异值都是正的
    #     all_singular_values = np.sort(all_singular_values)[::-1]  # 排序
        
    #     # 计算非零奇异值数量（使用小阈值来确定非零值）
    #     epsilon = 1e-10
    #     num_nonzero = np.sum(all_singular_values > epsilon)
        
    #     # 计算所有奇异值之和
    #     sum_all = np.sum(all_singular_values)
        
    #     # 计算比例
    #     ratio = sum_selected / sum_all if sum_all > 0 else 0
        
    #     print(f"非零奇异值总数: {num_nonzero}")
    #     print(f"选取的奇异值个数: {n_components}")
    #     print(f"选取的奇异值之和: {sum_selected}")
    #     print(f"全部奇异值之和: {sum_all}")
    #     print(f"选取奇异值占总奇异值的比例: {ratio:.4f}")
        
    # except Exception as e:
    #     print(f"计算所有奇异值时出错: {e}")
    #     print("使用Frobenius范数估计奇异值信息...")
    
    return word_vectors

def train_sgns_model(tokens, vocab, id2word, word_freq, pretrained_embeddings=None, embedding_dim=EMBEDDING_DIM, window_size=SGNS_WINDOW_SIZE, 
                    batch_size=2048, epochs=5, n_negs=20, lr=0.001, save_dir='./pts/', 
                    project_name="word2vec-sgns", subsample_t=SUBSAMPLE_THRESHOLD, cuda=True):
    
    wandb.init(project=project_name, config={
        "embedding_dim": embedding_dim,
        "window_size": window_size,
        "batch_size": batch_size,
        "epochs": epochs,
        "n_negs": n_negs,
        "vocab_size": len(vocab),
        "subsample_threshold": subsample_t,
        "learning_rate": lr,
        "pretrained": "SVD" if pretrained_embeddings is not None else "None"
    })
    
    device = torch.device("cuda" if torch.cuda.is_available() and cuda else "cpu")
    print(f"Using device: {device}")
    
    if not os.path.isdir(save_dir):
        os.makedirs(save_dir)
    
    word2vec = Word2Vec(len(vocab), embedding_dim, pretrained_embeddings=pretrained_embeddings)
    # 初始化模型
    model = SGNS(embedding=word2vec, vocab_size=len(vocab), vocab=vocab, word_freq=word_freq, n_negs=n_negs)
    model = model.to(device)
    
    wandb.watch(model)
    
    # 使用Adam优化器
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    for epoch in range(epochs):
        # 每个epoch重新创建数据集，应用新的下采样
        dataset = PermutedSubsampledCorpus(tokens, vocab, word_freq, window_size, subsample_t)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=4)
        
        total_loss = 0
        progress_bar = tqdm(dataloader, desc=f"Epoch {epoch+1}/{epochs}")
        
        for batch_idx, (target, context) in enumerate(progress_bar):
            target = target.to(device)
            context = context.unsqueeze(1).to(device)
            
            loss = model(target, context)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            progress_bar.set_postfix(loss=f"{total_loss / (batch_idx + 1):.4f}")
            
            if batch_idx % 100 == 0:
                wandb.log({
                    "batch": batch_idx + epoch * len(dataloader),
                    "batch_loss": loss.item()
                })
        
        epoch_loss = total_loss / len(dataloader)
        print(f"Epoch {epoch+1}/{epochs}, Loss: {epoch_loss:.4f}")
        wandb.log({
            "epoch": epoch + 1,
            "epoch_loss": epoch_loss
        })
        
        model_path = os.path.join(save_dir, f'sgns_epoch_{epoch+1}.pt')
        torch.save(model.state_dict(), model_path)
        print(f"Model saved to {model_path}")
    
    wandb.finish()
    
    # 返回训练好的词向量
    return word2vec.get_target_embeddings()

def main():
    corpus_path = 'lmtraining.txt'
    eval_path = 'wordsim353_agreed.txt'
    student_id = "2022211733"
    output_path = f"{student_id}"

    data_dir = "./data/"
    save_dir = './pts/'
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(save_dir, exist_ok=True)
    # 设置共现矩阵和PPMI矩阵的保存路径
    cooc_matrix_path = os.path.join(data_dir, f"cooc_matrix_window{SVD_WINDOW_SIZE}.npz")
    
    print("加载和预处理语料...")
    tokens = preprocess_corpus(corpus_path)
    
    print("构建词表...")
    vocab, id2word, word_freq = build_vocab(tokens)
    print(f"词表大小: {len(vocab)}")
    
    print("为SVD构建共现矩阵...")
    cooc_matrix = build_cooccurrence_matrix(
        tokens, 
        vocab, 
        window_size=SVD_WINDOW_SIZE,
        save_path=cooc_matrix_path
    )
    
    print("应用SVD获取词向量...")
    svd_vectors = apply_svd(cooc_matrix)
    word_to_vec_svd = {id2word[i]: svd_vectors[i] for i in range(len(svd_vectors))}
    
    print("训练Skip-Gram with Negative Sampling模型...")
    sgns_vectors = train_sgns_model(
        tokens=tokens, 
        vocab=vocab, 
        id2word=id2word,
        word_freq=word_freq,
        pretrained_embeddings=svd_vectors,
        window_size=SGNS_WINDOW_SIZE,
        batch_size=2048,
        epochs=5,
        n_negs=20,
        lr=0.001,
        project_name=f"word2vec-sgns-{student_id}"
    )
    word_to_vec_sgns = {id2word[i]: sgns_vectors[i] for i in range(len(sgns_vectors))}
    
    print("在wordsim353上评估词向量...")
    results, correlations = evaluate_wordsim(eval_path, word_to_vec_svd, word_to_vec_sgns)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for original_line, sim_svd, sim_sgns in results:
            f.write(f"{original_line}\t{sim_svd:.6f}\t{sim_sgns:.6f}\n")
    
    if correlations:
        correlation_path = f"correlations.txt"
        with open(correlation_path, 'w', encoding='utf-8') as f:
            f.write("方法\tSpearman系数\tp值\tPearson系数\tp值\n")
            f.write(f"SVD\t{correlations['spearman_svd']:.6f}\t{correlations['p_value_spearman_svd']:.6f}\t{correlations['pearson_svd']:.6f}\t{correlations['p_value_pearson_svd']:.6f}\n")
            f.write(f"SGNS\t{correlations['spearman_sgns']:.6f}\t{correlations['p_value_spearman_sgns']:.6f}\t{correlations['pearson_sgns']:.6f}\t{correlations['p_value_pearson_sgns']:.6f}\n")
        print(f"相关系数已写入 {correlation_path}")
    
    print(f"评估完成。结果已写入 {output_path}")

if __name__ == "__main__":
    main()