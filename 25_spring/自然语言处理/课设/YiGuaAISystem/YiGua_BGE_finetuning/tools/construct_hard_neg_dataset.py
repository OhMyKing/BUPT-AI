"""
使用Embedding相似度构造Hard Negative的BGE训练数据
通过BAAI/bge-large-zh-v1.5找到最相似的文本作为难负例
"""

import json
import random
import argparse
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
from tqdm import tqdm
import logging
import torch
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import faiss  # 用于高效相似度搜索
import pickle

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class HardNegativeDataConstructor:
    """基于Embedding的Hard Negative数据构造器"""
    
    def __init__(self, model_name: str = "BAAI/bge-large-zh-v1.5", 
                 device: str = None, 
                 batch_size: int = 32):
        """
        初始化构造器
        
        Args:
            model_name: Embedding模型名称
            device: 计算设备
            batch_size: 编码批大小
        """
        self.batch_size = batch_size
        
        # 自动选择设备
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
        
        logger.info(f"加载模型: {model_name} on {self.device}")
        self.model = SentenceTransformer(model_name, device=self.device)
        logger.info("模型加载完成")
        
        # 缓存embedding
        self.embeddings_cache = {}
        
    def load_parallel_data(self, src_path: str, tgt_path: str) -> List[Tuple[str, str]]:
        """加载平行语料"""
        with open(src_path, 'r', encoding='utf-8') as f:
            src_lines = [line.strip() for line in f if line.strip()]
        
        with open(tgt_path, 'r', encoding='utf-8') as f:
            tgt_lines = [line.strip() for line in f if line.strip()]
        
        if len(src_lines) != len(tgt_lines):
            logger.warning(f"源文件和目标文件行数不匹配: {len(src_lines)} vs {len(tgt_lines)}")
            min_len = min(len(src_lines), len(tgt_lines))
            src_lines = src_lines[:min_len]
            tgt_lines = tgt_lines[:min_len]
        
        logger.info(f"加载了 {len(src_lines)} 对平行语料")
        return list(zip(src_lines, tgt_lines))
    
    def encode_texts(self, texts: List[str], cache_key: str = None) -> np.ndarray:
        """
        编码文本为向量
        
        Args:
            texts: 文本列表
            cache_key: 缓存键名
            
        Returns:
            编码后的向量矩阵
        """
        # 检查缓存
        if cache_key and cache_key in self.embeddings_cache:
            logger.info(f"使用缓存的embeddings: {cache_key}")
            return self.embeddings_cache[cache_key]
        
        logger.info(f"编码 {len(texts)} 个文本...")
        embeddings = self.model.encode(
            texts, 
            batch_size=self.batch_size,
            convert_to_numpy=True,
            show_progress_bar=True,
            normalize_embeddings=True  # 归一化以便直接使用点积计算余弦相似度
        )
        
        # 缓存结果
        if cache_key:
            self.embeddings_cache[cache_key] = embeddings
        
        return embeddings
    
    def build_faiss_index(self, embeddings: np.ndarray) -> faiss.IndexFlatIP:
        """
        构建FAISS索引用于快速相似度搜索
        
        Args:
            embeddings: 向量矩阵
            
        Returns:
            FAISS索引
        """
        logger.info("构建FAISS索引...")
        dimension = embeddings.shape[1]
        
        # 使用内积索引（因为向量已归一化，内积等于余弦相似度）
        index = faiss.IndexFlatIP(dimension)
        
        # 添加向量到索引
        index.add(embeddings.astype('float32'))
        
        logger.info(f"索引构建完成，包含 {index.ntotal} 个向量")
        return index
    
    def find_hard_negatives(self, 
                          query_embeddings: np.ndarray,
                          key_embeddings: np.ndarray,
                          k: int = 10,
                          exclude_self: bool = True) -> List[List[int]]:
        """
        为每个查询找到最相似的k个候选
        
        Args:
            query_embeddings: 查询向量
            key_embeddings: 候选向量库
            k: 返回的最相似候选数
            exclude_self: 是否排除自身
            
        Returns:
            每个查询的top-k候选索引列表
        """
        # 构建索引
        index = self.build_faiss_index(key_embeddings)
        
        # 搜索最相似的候选
        logger.info(f"搜索top-{k}最相似的候选...")
        
        # 如果需要排除自身，搜索k+1个
        search_k = k + 1 if exclude_self else k
        
        similarities, indices = index.search(
            query_embeddings.astype('float32'), 
            search_k
        )
        
        # 处理结果
        hard_negatives = []
        for i, (sims, idxs) in enumerate(zip(similarities, indices)):
            if exclude_self:
                # 排除自身（通常是第一个，相似度最高）
                mask = idxs != i
                filtered_idxs = idxs[mask][:k]
            else:
                filtered_idxs = idxs[:k]
            
            hard_negatives.append(filtered_idxs.tolist())
        
        return hard_negatives
    
    def construct_training_data(self,
                              parallel_data: List[Tuple[str, str]],
                              num_hard_negatives: int = 3,
                              num_random_negatives: int = 1,
                              bidirectional: bool = True,
                              mix_negative_types: bool = True,
                              save_embeddings: bool = True,
                              embeddings_path: str = None) -> List[Dict]:
        """
        构造训练数据
        
        Args:
            parallel_data: 平行语料
            num_hard_negatives: hard negative数量
            num_random_negatives: 随机负例数量
            bidirectional: 是否双向
            mix_negative_types: 是否混合古文和现代文作为负例
            save_embeddings: 是否保存embeddings
            embeddings_path: embeddings保存路径
            
        Returns:
            训练数据列表
        """
        # 分离古文和现代文
        classical_texts = [pair[0] for pair in parallel_data]
        modern_texts = [pair[1] for pair in parallel_data]
        
        # 生成embeddings
        logger.info("生成古文embeddings...")
        classical_embeddings = self.encode_texts(classical_texts, cache_key='classical')
        
        logger.info("生成现代文embeddings...")
        modern_embeddings = self.encode_texts(modern_texts, cache_key='modern')
        
        # 保存embeddings（可选）
        if save_embeddings and embeddings_path:
            logger.info(f"保存embeddings到: {embeddings_path}")
            with open(embeddings_path, 'wb') as f:
                pickle.dump({
                    'classical_embeddings': classical_embeddings,
                    'modern_embeddings': modern_embeddings,
                    'classical_texts': classical_texts,
                    'modern_texts': modern_texts
                }, f)
        
        training_data = []
        
        # 1. 古文 -> 现代文
        if bidirectional or random.random() < 0.5:
            logger.info("构造古文->现代文数据...")
            
            # 找到每个古文最相似的其他现代文作为hard negatives
            hard_neg_indices = self.find_hard_negatives(
                classical_embeddings,
                modern_embeddings,
                k=num_hard_negatives * 2,  # 多找一些以备筛选
                exclude_self=True
            )
            
            for idx, (classical, modern) in enumerate(tqdm(parallel_data, desc="古文->现代文")):
                negatives = []
                
                # Hard negatives: 最相似的其他现代文
                hard_negs = hard_neg_indices[idx][:num_hard_negatives]
                negatives.extend([modern_texts[i] for i in hard_negs])
                
                # 可选：混合一些古文作为负例（增加难度）
                if mix_negative_types and num_random_negatives > 0:
                    random_classical_indices = random.sample(
                        [i for i in range(len(classical_texts)) if i != idx],
                        min(num_random_negatives, len(classical_texts) - 1)
                    )
                    negatives.extend([classical_texts[i] for i in random_classical_indices])
                
                training_data.append({
                    'query': classical,
                    'pos': [modern],
                    'neg': negatives
                })
        
        # 2. 现代文 -> 古文
        if bidirectional:
            logger.info("构造现代文->古文数据...")
            
            # 找到每个现代文最相似的其他古文作为hard negatives
            hard_neg_indices = self.find_hard_negatives(
                modern_embeddings,
                classical_embeddings,
                k=num_hard_negatives * 2,
                exclude_self=True
            )
            
            for idx, (classical, modern) in enumerate(tqdm(parallel_data, desc="现代文->古文")):
                negatives = []
                
                # Hard negatives: 最相似的其他古文
                hard_negs = hard_neg_indices[idx][:num_hard_negatives]
                negatives.extend([classical_texts[i] for i in hard_negs])
                
                # 可选：混合一些现代文作为负例
                if mix_negative_types and num_random_negatives > 0:
                    random_modern_indices = random.sample(
                        [i for i in range(len(modern_texts)) if i != idx],
                        min(num_random_negatives, len(modern_texts) - 1)
                    )
                    negatives.extend([modern_texts[i] for i in random_modern_indices])
                
                training_data.append({
                    'query': modern,
                    'pos': [classical],
                    'neg': negatives
                })
        
        # 随机打乱
        random.shuffle(training_data)
        
        return training_data
    
    def analyze_hard_negatives(self, training_data: List[Dict], 
                              sample_size: int = 10) -> Dict:
        """
        分析hard negatives的质量
        
        Args:
            training_data: 训练数据
            sample_size: 分析的样本数
            
        Returns:
            分析结果
        """
        logger.info("分析hard negatives质量...")
        
        # 随机采样
        samples = random.sample(training_data, min(sample_size, len(training_data)))
        
        similarities = []
        
        for sample in samples:
            query = sample['query']
            pos = sample['pos'][0]
            negs = sample.get('neg', [])
            
            if not negs:
                continue
            
            # 计算相似度
            texts = [query, pos] + negs
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            
            # 查询与正例的相似度
            pos_sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            
            # 查询与负例的相似度
            neg_sims = []
            for i in range(2, len(embeddings)):
                neg_sim = cosine_similarity([embeddings[0]], [embeddings[i]])[0][0]
                neg_sims.append(neg_sim)
            
            similarities.append({
                'pos_sim': pos_sim,
                'neg_sims': neg_sims,
                'avg_neg_sim': np.mean(neg_sims),
                'max_neg_sim': np.max(neg_sims),
                'min_neg_sim': np.min(neg_sims)
            })
        
        # 统计分析
        analysis = {
            'avg_pos_similarity': np.mean([s['pos_sim'] for s in similarities]),
            'avg_neg_similarity': np.mean([s['avg_neg_sim'] for s in similarities]),
            'avg_max_neg_similarity': np.mean([s['max_neg_sim'] for s in similarities]),
            'avg_min_neg_similarity': np.mean([s['min_neg_sim'] for s in similarities]),
            'hard_negative_ratio': sum(1 for s in similarities if s['max_neg_sim'] > 0.5) / len(similarities)
        }
        
        return analysis


def split_dataset(data: List[Dict], 
                 train_ratio: float = 0.9,
                 val_ratio: float = 0.05,
                 test_ratio: float = 0.05) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """分割数据集"""
    n = len(data)
    train_size = int(n * train_ratio)
    val_size = int(n * val_ratio)
    
    train_data = data[:train_size]
    val_data = data[train_size:train_size + val_size]
    test_data = data[train_size + val_size:]
    
    return train_data, val_data, test_data


def save_jsonl(data: List[Dict], output_path: str):
    """保存为JSONL格式"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    logger.info(f"保存了 {len(data)} 条数据到: {output_path}")


def main():
    parser = argparse.ArgumentParser(description='使用Embedding相似度构造Hard Negative训练数据')
    
    # 输入输出参数
    parser.add_argument('--src_file', type=str, default='../datas/dataset/dev.src',
                        help='源文件路径（古文）')
    parser.add_argument('--tgt_file', type=str, default='../datas/dataset/dev.tgt',
                        help='目标文件路径（现代文）')
    parser.add_argument('--output_dir', type=str, default='../data/finetune/hard',
                        help='输出目录')
    
    # 模型参数
    parser.add_argument('--model_name', type=str, default='BAAI/bge-large-zh-v1.5',
                        help='用于生成embedding的模型')
    parser.add_argument('--device', type=str, default=None,
                        help='计算设备 (cuda/cpu)')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='编码批大小')
    
    # 数据构造参数
    parser.add_argument('--num_hard_negatives', type=int, default=3,
                        help='每个样本的hard negative数量')
    parser.add_argument('--num_random_negatives', type=int, default=1,
                        help='每个样本的随机负例数量')
    parser.add_argument('--bidirectional', action='store_true', default=True,
                        help='是否构造双向数据')
    parser.add_argument('--mix_negative_types', action='store_true', default=True,
                        help='是否混合不同类型的负例')
    
    # 数据集分割参数
    parser.add_argument('--train_ratio', type=float, default=0.9,
                        help='训练集比例')
    parser.add_argument('--val_ratio', type=float, default=0.05,
                        help='验证集比例')
    parser.add_argument('--test_ratio', type=float, default=0.05,
                        help='测试集比例')
    
    # 其他参数
    parser.add_argument('--seed', type=int, default=42,
                        help='随机种子')
    parser.add_argument('--save_embeddings', action='store_true',
                        help='是否保存embeddings')
    parser.add_argument('--analyze_samples', type=int, default=10,
                        help='分析的样本数量')
    parser.add_argument('--load_embeddings', type=str, default=None,
                        help='加载已有的embeddings文件')
    
    args = parser.parse_args()
    
    # 设置随机种子
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    
    # 创建输出目录
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 初始化构造器
    constructor = HardNegativeDataConstructor(
        model_name=args.model_name,
        device=args.device,
        batch_size=args.batch_size
    )
    
    # 加载数据
    parallel_data = constructor.load_parallel_data(args.src_file, args.tgt_file)
    
    # 如果提供了embeddings文件，加载它
    if args.load_embeddings and Path(args.load_embeddings).exists():
        logger.info(f"加载embeddings: {args.load_embeddings}")
        with open(args.load_embeddings, 'rb') as f:
            saved_data = pickle.load(f)
            constructor.embeddings_cache['classical'] = saved_data['classical_embeddings']
            constructor.embeddings_cache['modern'] = saved_data['modern_embeddings']
    
    # 构造训练数据
    embeddings_path = output_dir / 'embeddings.pkl' if args.save_embeddings else None
    training_data = constructor.construct_training_data(
        parallel_data,
        num_hard_negatives=args.num_hard_negatives,
        num_random_negatives=args.num_random_negatives,
        bidirectional=args.bidirectional,
        mix_negative_types=args.mix_negative_types,
        save_embeddings=args.save_embeddings,
        embeddings_path=embeddings_path
    )
    
    logger.info(f"构造了 {len(training_data)} 条训练数据")
    
    # 分析hard negatives质量
    if args.analyze_samples > 0:
        analysis = constructor.analyze_hard_negatives(training_data, args.analyze_samples)
        logger.info("\nHard Negatives质量分析:")
        logger.info(f"  平均正例相似度: {analysis['avg_pos_similarity']:.4f}")
        logger.info(f"  平均负例相似度: {analysis['avg_neg_similarity']:.4f}")
        logger.info(f"  平均最大负例相似度: {analysis['avg_max_neg_similarity']:.4f}")
        logger.info(f"  平均最小负例相似度: {analysis['avg_min_neg_similarity']:.4f}")
        logger.info(f"  高相似度负例比例 (>0.5): {analysis['hard_negative_ratio']:.2%}")
    
    # 分割数据集
    train_data, val_data, test_data = split_dataset(
        training_data,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio
    )
    
    # 保存数据
    save_jsonl(train_data, output_dir / 'train_data.jsonl')
    save_jsonl(val_data, output_dir / 'val_data.jsonl')
    save_jsonl(test_data, output_dir / 'test_data.jsonl')
    
    # 保存配置
    config = {
        'src_file': args.src_file,
        'tgt_file': args.tgt_file,
        'model_name': args.model_name,
        'num_hard_negatives': args.num_hard_negatives,
        'num_random_negatives': args.num_random_negatives,
        'bidirectional': args.bidirectional,
        'mix_negative_types': args.mix_negative_types,
        'total_samples': len(training_data),
        'train_samples': len(train_data),
        'val_samples': len(val_data),
        'test_samples': len(test_data)
    }
    
    with open(output_dir / 'config.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    # 显示样例
    logger.info("\n数据样例:")
    for i, item in enumerate(train_data[:3]):
        logger.info(f"\n样例 {i+1}:")
        logger.info(f"Query: {item['query'][:100]}...")
        logger.info(f"Positive: {item['pos'][0][:100]}...")
        if 'neg' in item and item['neg']:
            logger.info(f"Hard Negatives ({len(item['neg'])}条):")
            for j, neg in enumerate(item['neg'][:2]):
                logger.info(f"  {j+1}. {neg[:100]}...")
    
    logger.info(f"\n数据构造完成！所有文件已保存到: {output_dir}")


if __name__ == "__main__":
    main()