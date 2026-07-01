"""
从双音节词对齐结果构造BGE微调数据集
支持双向检索：古文->现代文 和 现代文->古文
正例包含所有不同程度的对齐结果（去重）
"""

import json
import random
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Set
from tqdm import tqdm
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_aligned_data(aligned_path: str) -> List[Dict]:
    """
    加载对齐后的数据
    
    Args:
        aligned_path: 对齐数据文件路径
        
    Returns:
        对齐数据列表
    """
    with open(aligned_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    logger.info(f"加载了 {len(data)} 条对齐数据")
    return data


def extract_unique_alignments(sentence_data: Dict) -> List[str]:
    """
    从句子数据中提取所有去重的对齐结果
    
    Args:
        sentence_data: 包含不同概率对齐结果的句子数据
        
    Returns:
        去重后的对齐文本列表
    """
    unique_alignments = set()
    
    # 添加原始句子
    unique_alignments.add(sentence_data['original'])
    
    # 添加所有概率级别的对齐结果
    for prob in ['30%', '50%', '70%']:
        if prob in sentence_data['replacements']:
            aligned_text = sentence_data['replacements'][prob]['aligned_text']
            unique_alignments.add(aligned_text)
    
    # 转换为列表并排序（保证顺序一致）
    return sorted(list(unique_alignments))


def construct_training_data(
    aligned_data: List[Dict], 
    num_negatives: int = 3,
    bidirectional: bool = True,
    hard_negative_ratio: float = 0.5,
    seed: int = 42
) -> List[Dict]:
    """
    构造训练数据
    
    Args:
        aligned_data: 对齐数据列表
        num_negatives: 每个样本的负例数量
        bidirectional: 是否构造双向数据（古->现 和 现->古）
        hard_negative_ratio: 难负例比例（同类型文本作为负例）
        seed: 随机种子
        
    Returns:
        训练数据列表
    """
    random.seed(seed)
    training_data = []
    
    # 提取所有文本用于负例构造
    all_originals = []
    all_targets = []
    all_aligned_texts = []
    
    for item in aligned_data:
        all_originals.append(item['original'])
        all_targets.append(item['target'])
        # 收集所有对齐结果
        for prob in ['30%', '50%', '70%']:
            if prob in item['replacements']:
                all_aligned_texts.append(item['replacements'][prob]['aligned_text'])
    
    # 去重
    all_aligned_texts = list(set(all_aligned_texts))
    
    logger.info("构造训练数据...")
    
    for idx, item in enumerate(tqdm(aligned_data, desc="处理数据")):
        original = item['original']
        target = item['target']
        
        # 获取所有去重的对齐结果作为正例
        unique_alignments = extract_unique_alignments(item)
        # 正例包括：原始现代文翻译 + 所有对齐变体
        positive_examples = [target] + [align for align in unique_alignments if align != original]
        # 去重
        positive_examples = list(set(positive_examples))
        
        # 1. 古文 -> 现代文（包含对齐变体）
        if bidirectional or random.random() < 0.5:
            # 构造负例
            negatives = []
            num_hard_neg = int(num_negatives * hard_negative_ratio)
            num_easy_neg = num_negatives - num_hard_neg
            
            # 难负例：其他现代文翻译和对齐文本
            hard_neg_candidates = []
            for j, other_item in enumerate(aligned_data):
                if j != idx:
                    hard_neg_candidates.append(other_item['target'])
                    # 也可以包含其他句子的对齐结果
                    other_alignments = extract_unique_alignments(other_item)
                    hard_neg_candidates.extend(other_alignments)
            
            hard_neg_candidates = list(set(hard_neg_candidates))
            if len(hard_neg_candidates) >= num_hard_neg:
                hard_neg_indices = random.sample(range(len(hard_neg_candidates)), num_hard_neg)
                negatives.extend([hard_neg_candidates[i] for i in hard_neg_indices])
            else:
                negatives.extend(hard_neg_candidates)
            
            # 简单负例：随机古文
            easy_neg_candidates = [item['original'] for j, item in enumerate(aligned_data) if j != idx]
            if len(easy_neg_candidates) >= num_easy_neg:
                easy_neg_indices = random.sample(range(len(easy_neg_candidates)), num_easy_neg)
                negatives.extend([easy_neg_candidates[i] for i in easy_neg_indices])
            else:
                negatives.extend(easy_neg_candidates)
            
            training_data.append({
                'query': original,
                'pos': positive_examples,  # 包含所有对齐变体
                'neg': negatives[:num_negatives]  # 确保不超过指定数量
            })
        
        # 2. 现代文 -> 古文（以及对齐变体）
        if bidirectional:
            # 反向的正例：原始古文 + 所有对齐变体
            reverse_positive = [original] + unique_alignments
            reverse_positive = list(set(reverse_positive))
            
            # 构造负例
            negatives = []
            num_hard_neg = int(num_negatives * hard_negative_ratio)
            num_easy_neg = num_negatives - num_hard_neg
            
            # 难负例：其他古文和对齐文本
            hard_neg_candidates = []
            for j, other_item in enumerate(aligned_data):
                if j != idx:
                    hard_neg_candidates.append(other_item['original'])
                    other_alignments = extract_unique_alignments(other_item)
                    hard_neg_candidates.extend(other_alignments)
            
            hard_neg_candidates = list(set(hard_neg_candidates))
            if len(hard_neg_candidates) >= num_hard_neg:
                hard_neg_indices = random.sample(range(len(hard_neg_candidates)), num_hard_neg)
                negatives.extend([hard_neg_candidates[i] for i in hard_neg_indices])
            else:
                negatives.extend(hard_neg_candidates)
            
            # 简单负例：随机现代文
            easy_neg_candidates = [item['target'] for j, item in enumerate(aligned_data) if j != idx]
            if len(easy_neg_candidates) >= num_easy_neg:
                easy_neg_indices = random.sample(range(len(easy_neg_candidates)), num_easy_neg)
                negatives.extend([easy_neg_candidates[i] for i in easy_neg_indices])
            else:
                negatives.extend(easy_neg_candidates)
            
            training_data.append({
                'query': target,
                'pos': reverse_positive,  # 包含古文和所有对齐变体
                'neg': negatives[:num_negatives]
            })
    
    # 随机打乱数据
    random.shuffle(training_data)
    
    return training_data


def add_instruction_prompts(
    data: List[Dict],
    classical_to_modern_prompt: str = "将下面的古文翻译成现代文：",
    modern_to_classical_prompt: str = "找出下面现代文对应的古文原文："
) -> List[Dict]:
    """
    为查询添加指令提示（可选）
    
    Args:
        data: 训练数据
        classical_to_modern_prompt: 古文到现代文的提示
        modern_to_classical_prompt: 现代文到古文的提示
        
    Returns:
        添加提示后的数据
    """
    logger.info("添加指令提示...")
    
    for item in tqdm(data, desc="添加提示"):
        query = item['query']
        # 通过正例的平均长度判断方向
        avg_pos_length = sum(len(p) for p in item['pos']) / len(item['pos'])
        
        # 判断查询方向
        if avg_pos_length > len(query) * 1.2:  # 正例（现代文）通常更长
            # 古文 -> 现代文
            item['query'] = classical_to_modern_prompt + query
        else:
            # 现代文 -> 古文
            item['query'] = modern_to_classical_prompt + query
    
    return data


def split_dataset(
    data: List[Dict], 
    train_ratio: float = 0.9,
    val_ratio: float = 0.05,
    test_ratio: float = 0.05
) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    分割数据集
    
    Args:
        data: 全部数据
        train_ratio: 训练集比例
        val_ratio: 验证集比例
        test_ratio: 测试集比例
        
    Returns:
        (训练集, 验证集, 测试集)
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "比例之和必须为1"
    
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


def analyze_dataset(data: List[Dict]) -> Dict:
    """分析数据集统计信息"""
    stats = {
        'total_samples': len(data),
        'avg_query_length': sum(len(item['query']) for item in data) / len(data) if data else 0,
        'avg_pos_count': sum(len(item['pos']) for item in data) / len(data) if data else 0,
        'avg_pos_length': sum(sum(len(p) for p in item['pos'])/len(item['pos']) for item in data) / len(data) if data else 0,
        'avg_neg_count': sum(len(item.get('neg', [])) for item in data) / len(data) if data else 0,
        'samples_with_neg': sum(1 for item in data if 'neg' in item and item['neg'])
    }
    return stats


def main():
    parser = argparse.ArgumentParser(description='从对齐数据构造BGE训练数据')
    
    # 输入输出参数
    parser.add_argument('--aligned_file', type=str, default='../datas/dataset/aligen_dev.json',
                        help='对齐数据文件路径')
    parser.add_argument('--output_dir', type=str, default='../datas/finetune/aligned/',
                        help='输出目录')
    
    # 数据构造参数
    parser.add_argument('--num_negatives', type=int, default=3,
                        help='每个样本的负例数量')
    parser.add_argument('--bidirectional', action='store_true', default=True,
                        help='是否构造双向数据')
    parser.add_argument('--hard_negative_ratio', type=float, default=0.5,
                        help='难负例比例（0-1）')
    parser.add_argument('--add_instruction', action='store_true',
                        help='是否添加指令提示')
    
    # 数据集分割参数
    parser.add_argument('--train_ratio', type=float, default=0.6,
                        help='训练集比例')
    parser.add_argument('--val_ratio', type=float, default=0.2,
                        help='验证集比例')
    parser.add_argument('--test_ratio', type=float, default=0.2,
                        help='测试集比例')
    
    # 其他参数
    parser.add_argument('--seed', type=int, default=42,
                        help='随机种子')
    parser.add_argument('--show_examples', type=int, default=3,
                        help='显示的样例数量')
    
    args = parser.parse_args()
    
    # 创建输出目录
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 加载对齐数据
    aligned_data = load_aligned_data(args.aligned_file)
    
    # 构造训练数据
    training_data = construct_training_data(
        aligned_data,
        num_negatives=args.num_negatives,
        bidirectional=args.bidirectional,
        hard_negative_ratio=args.hard_negative_ratio,
        seed=args.seed
    )
    
    logger.info(f"构造了 {len(training_data)} 条训练数据")
    
    # 可选：添加指令提示
    if args.add_instruction:
        training_data = add_instruction_prompts(training_data)
    
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
    
    # 分析数据集
    logger.info("\n数据集统计信息:")
    for split_name, split_data in [('训练集', train_data), ('验证集', val_data), ('测试集', test_data)]:
        if split_data:
            stats = analyze_dataset(split_data)
            logger.info(f"\n{split_name}:")
            logger.info(f"  样本数: {stats['total_samples']}")
            logger.info(f"  平均查询长度: {stats['avg_query_length']:.1f}")
            logger.info(f"  平均正例数量: {stats['avg_pos_count']:.1f}")
            logger.info(f"  平均正例长度: {stats['avg_pos_length']:.1f}")
            logger.info(f"  平均负例数: {stats['avg_neg_count']:.1f}")
            logger.info(f"  包含负例的样本数: {stats['samples_with_neg']}")
    
    # 显示样例
    if args.show_examples > 0 and train_data:
        logger.info(f"\n训练数据样例（前{args.show_examples}条）:")
        for i, item in enumerate(train_data[:args.show_examples]):
            logger.info(f"\n样例 {i+1}:")
            logger.info(f"  Query: {item['query'][:100]}{'...' if len(item['query']) > 100 else ''}")
            logger.info(f"  Positive examples ({len(item['pos'])} 个):")
            for j, pos in enumerate(item['pos'][:3]):  # 最多显示3个正例
                logger.info(f"    {j+1}: {pos[:100]}{'...' if len(pos) > 100 else ''}")
            if len(item['pos']) > 3:
                logger.info(f"    ... 还有 {len(item['pos']) - 3} 个正例")
            if 'neg' in item and item['neg']:
                logger.info(f"  Negative 1: {item['neg'][0][:100]}{'...' if len(item['neg'][0]) > 100 else ''}")
                logger.info(f"  负例总数: {len(item['neg'])}")
    
    # 保存数据构造配置
    config = {
        'aligned_file': args.aligned_file,
        'num_negatives': args.num_negatives,
        'bidirectional': args.bidirectional,
        'hard_negative_ratio': args.hard_negative_ratio,
        'add_instruction': args.add_instruction,
        'train_ratio': args.train_ratio,
        'val_ratio': args.val_ratio,
        'test_ratio': args.test_ratio,
        'seed': args.seed,
        'total_aligned_sentences': len(aligned_data),
        'total_training_samples': len(training_data),
        'train_samples': len(train_data),
        'val_samples': len(val_data),
        'test_samples': len(test_data)
    }
    
    with open(output_dir / 'data_config.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    logger.info(f"\n数据构造完成！所有文件已保存到: {output_dir}")


if __name__ == "__main__":
    main()