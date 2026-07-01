"""
合并双音节词对齐数据和基于Embedding的Hard Negative数据
使用对齐结果作为正例，使用最近Embedding作为负例
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple
from tqdm import tqdm
import logging
from collections import defaultdict

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_jsonl(file_path: str) -> List[Dict]:
    """加载JSONL文件"""
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data


def save_jsonl(data: List[Dict], output_path: str):
    """保存为JSONL格式"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    logger.info(f"保存了 {len(data)} 条数据到: {output_path}")


def merge_datasets(aligned_dir: Path, hard_dir: Path) -> Tuple[List[Dict], List[Dict]]:
    """
    合并aligned和hard目录下的所有数据
    
    Returns:
        (all_aligned_data, all_hard_data)
    """
    # 加载aligned数据
    aligned_files = ['train_data.jsonl', 'val_data.jsonl', 'test_data.jsonl']
    all_aligned_data = []
    
    logger.info("加载aligned数据...")
    for file_name in aligned_files:
        file_path = aligned_dir / file_name
        if file_path.exists():
            data = load_jsonl(file_path)
            all_aligned_data.extend(data)
            logger.info(f"  {file_name}: {len(data)} 条")
        else:
            logger.warning(f"  文件不存在: {file_path}")
    
    # 加载hard数据
    hard_files = ['train_data.jsonl', 'val_data.jsonl', 'test_data.jsonl']
    all_hard_data = []
    
    logger.info("加载hard数据...")
    for file_name in hard_files:
        file_path = hard_dir / file_name
        if file_path.exists():
            data = load_jsonl(file_path)
            all_hard_data.extend(data)
            logger.info(f"  {file_name}: {len(data)} 条")
        else:
            logger.warning(f"  文件不存在: {file_path}")
    
    logger.info(f"总计加载: aligned={len(all_aligned_data)}, hard={len(all_hard_data)}")
    
    return all_aligned_data, all_hard_data


def create_query_index(data: List[Dict]) -> Dict[str, List[Dict]]:
    """
    创建基于query的索引，处理可能的重复query
    
    Args:
        data: 数据列表
        
    Returns:
        query到数据项列表的映射
    """
    query_index = defaultdict(list)
    
    for item in data:
        query = item['query']
        query_index[query].append(item)
    
    return query_index


def merge_aligned_hard_data(all_aligned_data: List[Dict], 
                          all_hard_data: List[Dict]) -> List[Dict]:
    """
    合并aligned和hard数据
    使用aligned的正例和hard的负例
    
    Args:
        all_aligned_data: 所有aligned数据
        all_hard_data: 所有hard数据
        
    Returns:
        合并后的数据
    """
    # 创建hard数据的query索引
    logger.info("创建hard数据索引...")
    hard_query_index = create_query_index(all_hard_data)
    
    # 合并数据
    logger.info("合并数据...")
    all_aligned_hard_data = []
    matched_count = 0
    unmatched_queries = []
    
    for aligned_item in tqdm(all_aligned_data, desc="处理aligned数据"):
        query = aligned_item['query']
        
        # 查找对应的hard数据
        if query in hard_query_index:
            # 如果有多个匹配，使用第一个（或可以实现更复杂的选择策略）
            hard_items = hard_query_index[query]
            hard_item = hard_items[0]  # 使用第一个匹配
            
            # 合并数据：使用aligned的query和pos，hard的neg
            merged_item = {
                'query': query,
                'pos': aligned_item['pos'],  # 使用aligned的正例（包含对齐变体）
                'neg': hard_item.get('neg', [])  # 使用hard的负例（基于embedding相似度）
            }
            
            all_aligned_hard_data.append(merged_item)
            matched_count += 1
        else:
            # 如果没有找到匹配的hard数据，保留原始aligned数据
            # 但使用空的负例列表或保留原有负例
            merged_item = {
                'query': query,
                'pos': aligned_item['pos'],
                'neg': aligned_item.get('neg', [])  # 保留原有负例或使用空列表
            }
            all_aligned_hard_data.append(merged_item)
            unmatched_queries.append(query[:50] + '...' if len(query) > 50 else query)
    
    logger.info(f"成功匹配: {matched_count}/{len(all_aligned_data)} ({matched_count/len(all_aligned_data)*100:.1f}%)")
    
    if unmatched_queries:
        logger.warning(f"未匹配的query数: {len(unmatched_queries)}")
        if len(unmatched_queries) <= 10:
            logger.warning(f"未匹配的query示例: {unmatched_queries}")
        else:
            logger.warning(f"未匹配的query示例（前10个）: {unmatched_queries[:10]}")
    
    return all_aligned_hard_data


def split_dataset(data: List[Dict], 
                 train_ratio: float = 0.6,
                 val_ratio: float = 0.2,
                 test_ratio: float = 0.2) -> Tuple[List[Dict], List[Dict], List[Dict]]:
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


def analyze_dataset(data: List[Dict]) -> Dict:
    """分析数据集统计信息"""
    stats = {
        'total_samples': len(data),
        'avg_query_length': sum(len(item['query']) for item in data) / len(data) if data else 0,
        'avg_pos_count': sum(len(item['pos']) for item in data) / len(data) if data else 0,
        'avg_neg_count': sum(len(item.get('neg', [])) for item in data) / len(data) if data else 0,
        'samples_with_neg': sum(1 for item in data if 'neg' in item and item['neg']),
        'samples_without_neg': sum(1 for item in data if 'neg' not in item or not item['neg'])
    }
    
    # 分析正例长度分布
    pos_lengths = []
    for item in data:
        for pos in item['pos']:
            pos_lengths.append(len(pos))
    
    if pos_lengths:
        stats['avg_pos_length'] = sum(pos_lengths) / len(pos_lengths)
        stats['min_pos_length'] = min(pos_lengths)
        stats['max_pos_length'] = max(pos_lengths)
    
    return stats


def main():
    parser = argparse.ArgumentParser(description='合并aligned和hard negative数据')
    
    # 输入参数
    parser.add_argument('--aligned_dir', type=str, default='../datas/finetune/aligned/',
                        help='aligned数据目录')
    parser.add_argument('--hard_dir', type=str, default='../datas/finetune/hard/',
                        help='hard数据目录')
    parser.add_argument('--output_dir', type=str, default='../datas/finetune/aligned_hard/',
                        help='输出目录')
    
    # 数据集分割参数
    parser.add_argument('--train_ratio', type=float, default=0.6,
                        help='训练集比例')
    parser.add_argument('--val_ratio', type=float, default=0.2,
                        help='验证集比例')
    parser.add_argument('--test_ratio', type=float, default=0.2,
                        help='测试集比例')
    
    # 其他参数
    parser.add_argument('--show_examples', type=int, default=3,
                        help='显示的样例数量')
    
    args = parser.parse_args()
    
    # 创建输出目录
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 合并数据
    aligned_dir = Path(args.aligned_dir)
    hard_dir = Path(args.hard_dir)
    
    all_aligned_data, all_hard_data = merge_datasets(aligned_dir, hard_dir)
    
    # 创建合并数据
    all_aligned_hard_data = merge_aligned_hard_data(all_aligned_data, all_hard_data)
    logger.info(f"合并后数据总量: {len(all_aligned_hard_data)}")
    
    # 分割数据集
    train_data, val_data, test_data = split_dataset(
        all_aligned_hard_data,
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
            logger.info(f"  平均负例数量: {stats['avg_neg_count']:.1f}")
            logger.info(f"  包含负例的样本数: {stats['samples_with_neg']}")
            logger.info(f"  无负例的样本数: {stats['samples_without_neg']}")
            if 'avg_pos_length' in stats:
                logger.info(f"  平均正例长度: {stats['avg_pos_length']:.1f}")
    
    # 显示样例
    if args.show_examples > 0 and train_data:
        logger.info(f"\n训练数据样例（前{args.show_examples}条）:")
        for i, item in enumerate(train_data[:args.show_examples]):
            logger.info(f"\n样例 {i+1}:")
            logger.info(f"  Query: {item['query'][:100]}{'...' if len(item['query']) > 100 else ''}")
            logger.info(f"  正例数量: {len(item['pos'])}")
            for j, pos in enumerate(item['pos'][:2]):  # 最多显示2个正例
                logger.info(f"    正例{j+1}: {pos[:100]}{'...' if len(pos) > 100 else ''}")
            if len(item['pos']) > 2:
                logger.info(f"    ... 还有 {len(item['pos']) - 2} 个正例")
            
            if 'neg' in item and item['neg']:
                logger.info(f"  负例数量: {len(item['neg'])}")
                for j, neg in enumerate(item['neg'][:2]):  # 最多显示2个负例
                    logger.info(f"    负例{j+1}: {neg[:100]}{'...' if len(neg) > 100 else ''}")
                if len(item['neg']) > 2:
                    logger.info(f"    ... 还有 {len(item['neg']) - 2} 个负例")
            else:
                logger.info("  负例数量: 0")
    
    # 保存配置信息
    config = {
        'aligned_dir': str(aligned_dir),
        'hard_dir': str(hard_dir),
        'output_dir': str(output_dir),
        'train_ratio': args.train_ratio,
        'val_ratio': args.val_ratio,
        'test_ratio': args.test_ratio,
        'total_aligned_samples': len(all_aligned_data),
        'total_hard_samples': len(all_hard_data),
        'total_merged_samples': len(all_aligned_hard_data),
        'train_samples': len(train_data),
        'val_samples': len(val_data),
        'test_samples': len(test_data)
    }
    
    with open(output_dir / 'merge_config.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    logger.info(f"\n数据合并完成！所有文件已保存到: {output_dir}")


if __name__ == "__main__":
    main()