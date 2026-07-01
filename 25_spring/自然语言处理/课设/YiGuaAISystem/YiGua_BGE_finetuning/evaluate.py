#!/usr/bin/env python3
"""
RAG Embedding Model Benchmark
用于评估Embedding模型在古文-现代文检索任务上的性能
"""

import json
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path
import torch
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import logging
from tqdm import tqdm
import argparse
import time
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import seaborn as sns
from datetime import datetime

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 设置自定义字体
def setup_font(font_path: str = './src/fonts/STHeiti Medium.ttc'):
    """设置matplotlib使用的字体"""
    try:
        # 检查字体文件是否存在
        if Path(font_path).exists():
            # 注册字体
            fm.fontManager.addfont(font_path)
            # 获取字体名称
            prop = fm.FontProperties(fname=font_path)
            font_name = prop.get_name()
            # 设置为默认字体
            plt.rcParams['font.sans-serif'] = [font_name, 'DejaVu Sans']
            plt.rcParams['axes.unicode_minus'] = False
            logger.info(f"Successfully loaded font: {font_name} from {font_path}")
        else:
            logger.warning(f"Font file not found: {font_path}, using default font")
            plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
            plt.rcParams['axes.unicode_minus'] = False
    except Exception as e:
        logger.warning(f"Failed to load font: {e}, using default font")
        plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False

# 初始化字体设置
setup_font()
sns.set_style("whitegrid")


@dataclass
class BenchmarkResult:
    """评估结果数据类"""
    accuracy: float
    recall_at_1: float
    recall_at_3: float
    recall_at_5: float
    recall_at_10: float
    avg_retrieval_time: float
    total_samples: int
    correct_samples: int
    model_name: str
    # 新增：embedding距离指标
    avg_cosine_distance: float = 0.0
    avg_euclidean_distance: float = 0.0
    std_cosine_distance: float = 0.0
    std_euclidean_distance: float = 0.0
    
    def __str__(self):
        return f"""
Benchmark Results for {self.model_name}:
----------------------------------------
Total Samples: {self.total_samples}
Correct Samples: {self.correct_samples}
Accuracy (Recall@1): {self.accuracy:.4f}
Recall@3: {self.recall_at_3:.4f}
Recall@5: {self.recall_at_5:.4f}
Recall@10: {self.recall_at_10:.4f}
Average Retrieval Time: {self.avg_retrieval_time:.4f}s

Embedding Distance Metrics:
----------------------------------------
Average Cosine Distance: {self.avg_cosine_distance:.4f} (±{self.std_cosine_distance:.4f})
Average Euclidean Distance: {self.avg_euclidean_distance:.4f} (±{self.std_euclidean_distance:.4f})
"""


class C3BenchmarkEvaluator:
    """C3 Benchmark评估器"""
    
    def __init__(self, model_name: str = "BAAI/bge-large-zh-v1.5", 
                 device: Optional[str] = None,
                 font_path: Optional[str] = None):
        """
        初始化评估器
        
        Args:
            model_name: Sentence Transformer模型名称
            device: 计算设备 ('cuda', 'cpu', None for auto)
            font_path: 自定义字体路径
        """
        self.model_name = model_name
        
        # 设置字体
        if font_path:
            setup_font(font_path)
        
        # 自动选择设备
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
            
        logger.info(f"Loading model: {model_name} on {self.device}")
        self.model = SentenceTransformer(model_name, device=self.device)
        logger.info("Model loaded successfully")
        
    def load_data(self, data_path: str) -> List[Dict]:
        """加载数据集"""
        data_path = Path(data_path)
        if not data_path.exists():
            raise FileNotFoundError(f"Data file not found: {data_path}")
            
        logger.info(f"Loading data from: {data_path}")
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data)} samples")
        return data
        
    def encode_texts(self, texts: List[str], batch_size: int = 32, 
                     show_progress: bool = True) -> np.ndarray:
        """
        批量编码文本
        
        Args:
            texts: 文本列表
            batch_size: 批处理大小
            show_progress: 是否显示进度条
            
        Returns:
            编码后的向量矩阵
        """
        logger.info(f"Encoding {len(texts)} texts...")
        
        if show_progress:
            # 使用进度条
            embeddings = []
            for i in tqdm(range(0, len(texts), batch_size), desc="Encoding"):
                batch = texts[i:i + batch_size]
                batch_embeddings = self.model.encode(batch, convert_to_numpy=True)
                embeddings.append(batch_embeddings)
            embeddings = np.vstack(embeddings)
        else:
            embeddings = self.model.encode(texts, batch_size=batch_size, 
                                         convert_to_numpy=True, show_progress_bar=False)
        
        return embeddings
    
    def calculate_embedding_distances(self, embeddings1: np.ndarray, 
                                    embeddings2: np.ndarray) -> Dict[str, float]:
        """
        计算两组embedding之间的距离
        
        Args:
            embeddings1: 第一组embedding（古文）
            embeddings2: 第二组embedding（现代文）
            
        Returns:
            包含各种距离指标的字典
        """
        assert len(embeddings1) == len(embeddings2), "Embeddings must have same length"
        
        # 计算余弦距离（1 - 余弦相似度）
        cosine_distances = []
        for i in range(len(embeddings1)):
            cos_sim = cosine_similarity(embeddings1[i:i+1], embeddings2[i:i+1])[0][0]
            cosine_distances.append(1 - cos_sim)
        
        # 计算欧氏距离
        euclidean_distances = np.linalg.norm(embeddings1 - embeddings2, axis=1)
        
        # 计算统计量
        results = {
            'avg_cosine_distance': np.mean(cosine_distances),
            'std_cosine_distance': np.std(cosine_distances),
            'avg_euclidean_distance': np.mean(euclidean_distances),
            'std_euclidean_distance': np.std(euclidean_distances),
            'min_cosine_distance': np.min(cosine_distances),
            'max_cosine_distance': np.max(cosine_distances),
            'min_euclidean_distance': np.min(euclidean_distances),
            'max_euclidean_distance': np.max(euclidean_distances),
            'cosine_distances': cosine_distances,
            'euclidean_distances': euclidean_distances.tolist()
        }
        
        return results
        
    def evaluate(self, data_path: str, batch_size: int = 32, 
                 top_k: int = 10) -> BenchmarkResult:
        """
        执行评估
        
        Args:
            data_path: 数据集路径
            batch_size: 批处理大小
            top_k: 检索的最大数量
            
        Returns:
            评估结果
        """
        # 加载数据
        data = self.load_data(data_path)
        
        # 提取文本
        classical_texts = [item['classical_Chinese'] for item in data]
        modern_texts = [item['modern_Chinese'] for item in data]
        
        # 编码文本
        logger.info("Encoding classical Chinese texts...")
        classical_embeddings = self.encode_texts(classical_texts, batch_size)
        
        logger.info("Encoding modern Chinese texts...")
        modern_embeddings = self.encode_texts(modern_texts, batch_size)
        
        # 计算embedding距离
        logger.info("Calculating embedding distances...")
        distance_metrics = self.calculate_embedding_distances(
            classical_embeddings, modern_embeddings
        )
        
        # 执行检索并计算指标
        logger.info("Performing retrieval evaluation...")
        results = self._calculate_metrics(
            query_embeddings=modern_embeddings,
            key_embeddings=classical_embeddings,
            ground_truth_indices=list(range(len(data))),
            top_k=top_k,
            distance_metrics=distance_metrics
        )
        
        return results
        
    def _calculate_metrics(self, query_embeddings: np.ndarray, 
                          key_embeddings: np.ndarray,
                          ground_truth_indices: List[int], 
                          top_k: int = 10,
                          distance_metrics: Optional[Dict[str, float]] = None) -> BenchmarkResult:
        """
        计算评估指标
        
        Args:
            query_embeddings: 查询向量（现代文）
            key_embeddings: 索引向量（古文）
            ground_truth_indices: 真实标签索引
            top_k: 检索的最大数量
            distance_metrics: embedding距离指标
            
        Returns:
            评估结果
        """
        n_queries = len(query_embeddings)
        
        # 初始化指标
        recall_at_k = {1: 0, 3: 0, 5: 0, 10: 0}
        retrieval_times = []
        
        # 对每个查询进行检索
        for i in tqdm(range(n_queries), desc="Evaluating"):
            start_time = time.time()
            
            # 计算余弦相似度
            query_embedding = query_embeddings[i:i+1]
            similarities = cosine_similarity(query_embedding, key_embeddings)[0]
            
            # 获取top-k索引
            top_k_indices = np.argsort(similarities)[::-1][:top_k]
            
            retrieval_time = time.time() - start_time
            retrieval_times.append(retrieval_time)
            
            # 检查是否命中
            ground_truth = ground_truth_indices[i]
            for k in recall_at_k.keys():
                if ground_truth in top_k_indices[:k]:
                    recall_at_k[k] += 1
                    
        # 计算最终指标
        for k in recall_at_k.keys():
            recall_at_k[k] /= n_queries
            
        result = BenchmarkResult(
            accuracy=recall_at_k[1],
            recall_at_1=recall_at_k[1],
            recall_at_3=recall_at_k[3],
            recall_at_5=recall_at_k[5],
            recall_at_10=recall_at_k[10],
            avg_retrieval_time=np.mean(retrieval_times),
            total_samples=n_queries,
            correct_samples=int(recall_at_k[1] * n_queries),
            model_name=self.model_name,
            avg_cosine_distance=distance_metrics['avg_cosine_distance'] if distance_metrics else 0.0,
            avg_euclidean_distance=distance_metrics['avg_euclidean_distance'] if distance_metrics else 0.0,
            std_cosine_distance=distance_metrics['std_cosine_distance'] if distance_metrics else 0.0,
            std_euclidean_distance=distance_metrics['std_euclidean_distance'] if distance_metrics else 0.0
        )
        
        return result
        
    def evaluate_with_hard_negatives(self, data_path: str, 
                                   category_field: str = 'category',
                                   batch_size: int = 32) -> Dict[str, BenchmarkResult]:
        """
        按类别评估，同类别内的其他样本作为hard negatives
        
        Args:
            data_path: 数据集路径
            category_field: 类别字段名
            batch_size: 批处理大小
            
        Returns:
            各类别的评估结果
        """
        data = self.load_data(data_path)
        
        # 按类别分组
        categories = {}
        for i, item in enumerate(data):
            cat = item.get(category_field, 'unknown')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((i, item))
            
        logger.info(f"Found {len(categories)} categories")
        
        # 对每个类别进行评估
        category_results = {}
        for cat, items in categories.items():
            if len(items) < 2:  # 跳过样本太少的类别
                continue
                
            logger.info(f"\nEvaluating category: {cat} ({len(items)} samples)")
            
            # 提取该类别的文本
            indices = [item[0] for item in items]
            classical_texts = [item[1]['classical_Chinese'] for item in items]
            modern_texts = [item[1]['modern_Chinese'] for item in items]
            
            # 编码
            classical_embeddings = self.encode_texts(classical_texts, batch_size, show_progress=False)
            modern_embeddings = self.encode_texts(modern_texts, batch_size, show_progress=False)
            
            # 计算embedding距离
            distance_metrics = self.calculate_embedding_distances(
                classical_embeddings, modern_embeddings
            )
            
            # 计算指标
            ground_truth_indices = list(range(len(items)))
            result = self._calculate_metrics(
                query_embeddings=modern_embeddings,
                key_embeddings=classical_embeddings,
                ground_truth_indices=ground_truth_indices,
                top_k=min(10, len(items)),
                distance_metrics=distance_metrics
            )
            
            category_results[cat] = result
            
        return category_results
    
    def visualize_embedding_distances(self, distance_metrics: Dict[str, float], 
                                    save_path: Optional[str] = None):
        """
        可视化embedding距离分布
        
        Args:
            distance_metrics: 距离指标字典
            save_path: 保存路径
        """
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 10))
        
        # 1. 余弦距离分布直方图
        cosine_distances = distance_metrics.get('cosine_distances', [])
        ax1.hist(cosine_distances, bins=30, color='skyblue', edgecolor='black', alpha=0.7)
        ax1.axvline(distance_metrics['avg_cosine_distance'], color='red', 
                   linestyle='--', linewidth=2, label=f"Mean: {distance_metrics['avg_cosine_distance']:.3f}")
        ax1.set_xlabel('Cosine Distance', fontsize=12)
        ax1.set_ylabel('Frequency', fontsize=12)
        ax1.set_title('Distribution of Cosine Distances', fontsize=14)
        ax1.legend()
        
        # 2. 欧氏距离分布直方图
        euclidean_distances = distance_metrics.get('euclidean_distances', [])
        ax2.hist(euclidean_distances, bins=30, color='lightcoral', edgecolor='black', alpha=0.7)
        ax2.axvline(distance_metrics['avg_euclidean_distance'], color='darkred', 
                   linestyle='--', linewidth=2, label=f"Mean: {distance_metrics['avg_euclidean_distance']:.3f}")
        ax2.set_xlabel('Euclidean Distance', fontsize=12)
        ax2.set_ylabel('Frequency', fontsize=12)
        ax2.set_title('Distribution of Euclidean Distances', fontsize=14)
        ax2.legend()
        
        # 3. 距离统计箱线图
        distance_data = [cosine_distances, euclidean_distances]
        ax3.boxplot(distance_data, labels=['Cosine', 'Euclidean'])
        ax3.set_ylabel('Distance', fontsize=12)
        ax3.set_title('Distance Statistics Box Plot', fontsize=14)
        ax3.grid(True, alpha=0.3)
        
        # 4. 距离相关性散点图
        if len(cosine_distances) > 0 and len(euclidean_distances) > 0:
            ax4.scatter(cosine_distances, euclidean_distances, alpha=0.5, s=30)
            ax4.set_xlabel('Cosine Distance', fontsize=12)
            ax4.set_ylabel('Euclidean Distance', fontsize=12)
            ax4.set_title('Cosine vs Euclidean Distance Correlation', fontsize=14)
            ax4.grid(True, alpha=0.3)
            
            # 添加相关系数
            correlation = np.corrcoef(cosine_distances, euclidean_distances)[0, 1]
            ax4.text(0.05, 0.95, f'Correlation: {correlation:.3f}', 
                    transform=ax4.transAxes, verticalalignment='top',
                    bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.suptitle('Embedding Distance Analysis', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Figure saved to: {save_path}")
        else:
            plt.show()
        plt.close()
        
    def visualize_results(self, result: BenchmarkResult, save_path: Optional[str] = None):
        """
        可视化单个评估结果（增强版，包含距离信息）
        
        Args:
            result: 评估结果
            save_path: 保存路径，None则显示
        """
        fig = plt.figure(figsize=(16, 10))
        gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)
        
        # 1. Recall@K 柱状图
        ax1 = fig.add_subplot(gs[0, 0])
        k_values = ['1', '3', '5', '10']
        recall_values = [
            result.recall_at_1,
            result.recall_at_3,
            result.recall_at_5,
            result.recall_at_10
        ]
        
        bars = ax1.bar(k_values, recall_values, color='skyblue', edgecolor='navy', alpha=0.7)
        ax1.set_xlabel('K', fontsize=12)
        ax1.set_ylabel('Recall@K', fontsize=12)
        ax1.set_title(f'Recall@K for {result.model_name}', fontsize=14)
        ax1.set_ylim(0, 1.1)
        
        # 在柱状图上添加数值
        for bar, value in zip(bars, recall_values):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                    f'{value:.3f}', ha='center', va='bottom')
        
        # 2. 饼图显示正确/错误比例
        ax2 = fig.add_subplot(gs[0, 1])
        sizes = [result.correct_samples, result.total_samples - result.correct_samples]
        labels = ['Correct', 'Incorrect']
        colors = ['#90EE90', '#FFB6C1']
        explode = (0.05, 0)
        
        ax2.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%',
                shadow=True, startangle=90)
        ax2.set_title(f'Retrieval Accuracy\n(Total: {result.total_samples} samples)', fontsize=14)
        
        # 3. Embedding距离信息
        ax3 = fig.add_subplot(gs[0, 2])
        distance_metrics = {
            'Cosine': result.avg_cosine_distance,
            'Euclidean': result.avg_euclidean_distance
        }
        bars = ax3.bar(distance_metrics.keys(), distance_metrics.values(), 
                       color=['lightblue', 'lightcoral'], alpha=0.7)
        ax3.set_ylabel('Average Distance', fontsize=12)
        ax3.set_title('Average Embedding Distances', fontsize=14)
        
        # 添加误差线
        errors = [result.std_cosine_distance, result.std_euclidean_distance]
        ax3.errorbar(range(len(distance_metrics)), list(distance_metrics.values()), 
                    yerr=errors, fmt='none', color='black', capsize=5)
        
        # 在柱状图上添加数值
        for bar, (name, value), err in zip(bars, distance_metrics.items(), errors):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height + err + 0.01,
                    f'{value:.3f}\n±{err:.3f}', ha='center', va='bottom', fontsize=10)
        
        # 4. 性能概览表格
        ax4 = fig.add_subplot(gs[1, :])
        ax4.axis('tight')
        ax4.axis('off')
        
        table_data = [
            ['Metric', 'Value'],
            ['Total Samples', f'{result.total_samples}'],
            ['Correct Samples', f'{result.correct_samples}'],
            ['Accuracy (Recall@1)', f'{result.accuracy:.4f}'],
            ['Recall@3', f'{result.recall_at_3:.4f}'],
            ['Recall@5', f'{result.recall_at_5:.4f}'],
            ['Recall@10', f'{result.recall_at_10:.4f}'],
            ['Avg Retrieval Time', f'{result.avg_retrieval_time:.4f}s'],
            ['Avg Cosine Distance', f'{result.avg_cosine_distance:.4f} (±{result.std_cosine_distance:.4f})'],
            ['Avg Euclidean Distance', f'{result.avg_euclidean_distance:.4f} (±{result.std_euclidean_distance:.4f})']
        ]
        
        table = ax4.table(cellText=table_data, cellLoc='left', loc='center',
                         colWidths=[0.3, 0.7])
        table.auto_set_font_size(False)
        table.set_fontsize(11)
        table.scale(1, 1.5)
        
        # 设置表格样式
        for i in range(len(table_data)):
            if i == 0:  # 表头
                for j in range(2):
                    table[(i, j)].set_facecolor('#4472C4')
                    table[(i, j)].set_text_props(weight='bold', color='white')
            else:
                for j in range(2):
                    if i % 2 == 0:
                        table[(i, j)].set_facecolor('#D9E1F2')
                    else:
                        table[(i, j)].set_facecolor('#F2F2F2')
        
        plt.suptitle(f'Benchmark Results - {datetime.now().strftime("%Y-%m-%d %H:%M")}', 
                     fontsize=16, fontweight='bold')
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Figure saved to: {save_path}")
        else:
            plt.show()
        plt.close()
        
    def visualize_category_results(self, category_results: Dict[str, BenchmarkResult], 
                                 save_path: Optional[str] = None):
        """
        可视化分类别评估结果（增强版）
        
        Args:
            category_results: 各类别的评估结果
            save_path: 保存路径，None则显示
        """
        # 准备数据
        categories = list(category_results.keys())
        metrics = {
            'Recall@1': [r.recall_at_1 for r in category_results.values()],
            'Recall@3': [r.recall_at_3 for r in category_results.values()],
            'Recall@5': [r.recall_at_5 for r in category_results.values()],
            'Recall@10': [r.recall_at_10 for r in category_results.values()],
            'Cosine Distance': [r.avg_cosine_distance for r in category_results.values()],
            'Euclidean Distance': [r.avg_euclidean_distance for r in category_results.values()]
        }
        
        # 创建图表
        fig, axes = plt.subplots(2, 3, figsize=(18, 12))
        fig.suptitle('Category-wise Benchmark Results', fontsize=16, fontweight='bold')
        
        # 1. 各类别Recall@1对比
        ax1 = axes[0, 0]
        bars = ax1.bar(categories, metrics['Recall@1'], color='lightcoral', alpha=0.7)
        ax1.set_xlabel('Category', fontsize=12)
        ax1.set_ylabel('Recall@1', fontsize=12)
        ax1.set_title('Recall@1 by Category', fontsize=14)
        ax1.set_ylim(0, 1.1)
        ax1.tick_params(axis='x', rotation=45)
        
        # 添加平均线
        avg_recall1 = np.mean(metrics['Recall@1'])
        ax1.axhline(y=avg_recall1, color='red', linestyle='--', alpha=0.7, 
                   label=f'Average: {avg_recall1:.3f}')
        ax1.legend()
        
        # 2. 所有Recall@K的热力图
        ax2 = axes[0, 1]
        heatmap_data = np.array([metrics[f'Recall@{k}'] for k in [1, 3, 5, 10]])
        sns.heatmap(heatmap_data, annot=True, fmt='.3f', cmap='YlOrRd', 
                   xticklabels=categories, yticklabels=['Recall@1', 'Recall@3', 'Recall@5', 'Recall@10'],
                   ax=ax2, cbar_kws={'label': 'Recall Score'})
        ax2.set_title('Recall@K Heatmap', fontsize=14)
        ax2.tick_params(axis='x', rotation=45)
        
        # 3. 样本数量分布
        ax3 = axes[0, 2]
        sample_counts = [r.total_samples for r in category_results.values()]
        bars = ax3.bar(categories, sample_counts, color='skyblue', alpha=0.7)
        ax3.set_xlabel('Category', fontsize=12)
        ax3.set_ylabel('Number of Samples', fontsize=12)
        ax3.set_title('Sample Distribution by Category', fontsize=14)
        ax3.tick_params(axis='x', rotation=45)
        
        # 在柱状图上添加数值
        for bar, count in zip(bars, sample_counts):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                    f'{int(count)}', ha='center', va='bottom')
        
        # 4. Recall增长曲线
        ax4 = axes[1, 0]
        k_values = [1, 3, 5, 10]
        for i, cat in enumerate(categories):
            recall_curve = [
                category_results[cat].recall_at_1,
                category_results[cat].recall_at_3,
                category_results[cat].recall_at_5,
                category_results[cat].recall_at_10
            ]
            ax4.plot(k_values, recall_curve, marker='o', label=cat, alpha=0.7)
        
        ax4.set_xlabel('K', fontsize=12)
        ax4.set_ylabel('Recall@K', fontsize=12)
        ax4.set_title('Recall@K Growth Curves', fontsize=14)
        ax4.set_xticks(k_values)
        ax4.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        ax4.grid(True, alpha=0.3)
        
        # 5. 余弦距离对比
        ax5 = axes[1, 1]
        bars = ax5.bar(categories, metrics['Cosine Distance'], color='lightblue', alpha=0.7)
        ax5.set_xlabel('Category', fontsize=12)
        ax5.set_ylabel('Average Cosine Distance', fontsize=12)
        ax5.set_title('Cosine Distance by Category', fontsize=14)
        ax5.tick_params(axis='x', rotation=45)
        
        # 添加误差线
        cosine_stds = [r.std_cosine_distance for r in category_results.values()]
        ax5.errorbar(range(len(categories)), metrics['Cosine Distance'], 
                    yerr=cosine_stds, fmt='none', color='black', capsize=5)
        
        # 6. 欧氏距离对比
        ax6 = axes[1, 2]
        bars = ax6.bar(categories, metrics['Euclidean Distance'], color='lightcoral', alpha=0.7)
        ax6.set_xlabel('Category', fontsize=12)
        ax6.set_ylabel('Average Euclidean Distance', fontsize=12)
        ax6.set_title('Euclidean Distance by Category', fontsize=14)
        ax6.tick_params(axis='x', rotation=45)
        
        # 添加误差线
        euclidean_stds = [r.std_euclidean_distance for r in category_results.values()]
        ax6.errorbar(range(len(categories)), metrics['Euclidean Distance'], 
                    yerr=euclidean_stds, fmt='none', color='black', capsize=5)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Figure saved to: {save_path}")
        else:
            plt.show()
        plt.close()
        
    def visualize_comparison(self, results_list: List[Tuple[str, BenchmarkResult]], 
                           save_path: Optional[str] = None):
        """
        可视化多个模型的对比结果（增强版）
        
        Args:
            results_list: [(model_name, result), ...]
            save_path: 保存路径
        """
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        
        model_names = [name for name, _ in results_list]
        
        # 1. 各模型Recall@K对比
        x = np.arange(len(model_names))
        width = 0.2
        
        recall_metrics = {
            'Recall@1': [r.recall_at_1 for _, r in results_list],
            'Recall@3': [r.recall_at_3 for _, r in results_list],
            'Recall@5': [r.recall_at_5 for _, r in results_list],
            'Recall@10': [r.recall_at_10 for _, r in results_list]
        }
        
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
        for i, (k, values) in enumerate(recall_metrics.items()):
            offset = (i - 1.5) * width
            bars = ax1.bar(x + offset, values, width, label=k, color=colors[i], alpha=0.8)
            
            # 添加数值标签
            for bar in bars:
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{height:.3f}', ha='center', va='bottom', fontsize=8)
        
        ax1.set_xlabel('Model', fontsize=12)
        ax1.set_ylabel('Recall Score', fontsize=12)
        ax1.set_title('Model Comparison - Recall@K', fontsize=14)
        ax1.set_xticks(x)
        ax1.set_xticklabels(model_names, rotation=15, ha='right')
        ax1.legend()
        ax1.set_ylim(0, 1.15)
        
        # 2. 检索时间对比
        retrieval_times = [r.avg_retrieval_time * 1000 for _, r in results_list]  # 转换为毫秒
        bars = ax2.bar(model_names, retrieval_times, color='orange', alpha=0.7)
        ax2.set_xlabel('Model', fontsize=12)
        ax2.set_ylabel('Average Retrieval Time (ms)', fontsize=12)
        ax2.set_title('Model Comparison - Retrieval Speed', fontsize=14)
        ax2.tick_params(axis='x', rotation=15)
        
        # 添加数值标签
        for bar, time in zip(bars, retrieval_times):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{time:.2f}', ha='center', va='bottom')
        
        # 3. 余弦距离对比
        cosine_distances = [r.avg_cosine_distance for _, r in results_list]
        cosine_stds = [r.std_cosine_distance for _, r in results_list]
        bars = ax3.bar(model_names, cosine_distances, color='lightblue', alpha=0.7, 
                       yerr=cosine_stds, capsize=5)
        ax3.set_xlabel('Model', fontsize=12)
        ax3.set_ylabel('Average Cosine Distance', fontsize=12)
        ax3.set_title('Model Comparison - Cosine Distance', fontsize=14)
        ax3.tick_params(axis='x', rotation=15)
        
        # 添加数值标签
        for bar, dist, std in zip(bars, cosine_distances, cosine_stds):
            height = bar.get_height()
            ax3.text(bar.get_x() + bar.get_width()/2., height + std + 0.01,
                    f'{dist:.3f}', ha='center', va='bottom')
        
        # 4. 欧氏距离对比
        euclidean_distances = [r.avg_euclidean_distance for _, r in results_list]
        euclidean_stds = [r.std_euclidean_distance for _, r in results_list]
        bars = ax4.bar(model_names, euclidean_distances, color='lightcoral', alpha=0.7,
                      yerr=euclidean_stds, capsize=5)
        ax4.set_xlabel('Model', fontsize=12)
        ax4.set_ylabel('Average Euclidean Distance', fontsize=12)
        ax4.set_title('Model Comparison - Euclidean Distance', fontsize=14)
        ax4.tick_params(axis='x', rotation=15)
        
        # 添加数值标签
        for bar, dist, std in zip(bars, euclidean_distances, euclidean_stds):
            height = bar.get_height()
            ax4.text(bar.get_x() + bar.get_width()/2., height + std + 0.01,
                    f'{dist:.3f}', ha='center', va='bottom')
        
        plt.suptitle('Multi-Model Benchmark Comparison', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Figure saved to: {save_path}")
        else:
            plt.show()
        plt.close()


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='C3 Benchmark Evaluator')
    parser.add_argument('--data_path', type=str, 
                        default='./datas/benchmark/C3_bench/C3_bench.json',
                        help='Path to the benchmark data')
    parser.add_argument('--model_name', type=str, 
                        default='BAAI/bge-large-zh-v1.5',
                        help='Name of the sentence transformer model')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='Batch size for encoding')
    parser.add_argument('--top_k', type=int, default=10,
                        help='Top-k for retrieval evaluation')
    parser.add_argument('--device', type=str, default=None,
                        help='Device to use (cuda/cpu)')
    parser.add_argument('--eval_by_category', action='store_true',
                        help='Evaluate by category with hard negatives')
    parser.add_argument('--save_figures', action='store_true',
                        help='Save visualization figures')
    parser.add_argument('--figure_dir', type=str, default='./outputs/figures/random',
                        help='Directory to save figures')
    parser.add_argument('--font_path', type=str, 
                        default='./src/fonts/STHeiti Medium.ttc',
                        help='Path to custom font file')
    parser.add_argument('--visualize_distances', action='store_true',
                        help='Generate detailed distance distribution plots')
    
    args = parser.parse_args()
    
    # 创建图表保存目录
    if args.save_figures:
        figure_dir = Path(args.figure_dir)
        figure_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 创建评估器
    evaluator = C3BenchmarkEvaluator(
        model_name=args.model_name,
        device=args.device,
        font_path=args.font_path
    )
    
    # 执行评估
    logger.info("Starting evaluation...")
    
    # 总是执行全局评估
    global_result = evaluator.evaluate(
        data_path=args.data_path,
        batch_size=args.batch_size,
        top_k=args.top_k
    )
    
    print("\n" + "="*50)
    print("GLOBAL EVALUATION RESULTS")
    print("="*50)
    print(global_result)
    
    # 可视化全局结果
    if args.save_figures:
        global_fig_path = figure_dir / f"global_results_{timestamp}.png"
        evaluator.visualize_results(global_result, save_path=str(global_fig_path))
    else:
        evaluator.visualize_results(global_result)
    
    # 如果需要，可视化距离分布
    if args.visualize_distances:
        # 重新计算以获取详细的距离数据
        data = evaluator.load_data(args.data_path)
        classical_texts = [item['classical_Chinese'] for item in data]
        modern_texts = [item['modern_Chinese'] for item in data]
        
        classical_embeddings = evaluator.encode_texts(classical_texts, args.batch_size)
        modern_embeddings = evaluator.encode_texts(modern_texts, args.batch_size)
        
        distance_metrics = evaluator.calculate_embedding_distances(
            classical_embeddings, modern_embeddings
        )
        
        if args.save_figures:
            distance_fig_path = figure_dir / f"distance_distribution_{timestamp}.png"
            evaluator.visualize_embedding_distances(distance_metrics, save_path=str(distance_fig_path))
        else:
            evaluator.visualize_embedding_distances(distance_metrics)
    
    # 按类别评估
    if args.eval_by_category:
        category_results = evaluator.evaluate_with_hard_negatives(
            data_path=args.data_path,
            batch_size=args.batch_size
        )
        
        print("\n" + "="*50)
        print("CATEGORY-WISE EVALUATION RESULTS")
        print("="*50)
        
        overall_accuracy = []
        overall_cosine_distance = []
        overall_euclidean_distance = []
        
        for cat, result in category_results.items():
            print(f"\nCategory: {cat}")
            print(result)
            overall_accuracy.append(result.accuracy)
            overall_cosine_distance.append(result.avg_cosine_distance)
            overall_euclidean_distance.append(result.avg_euclidean_distance)
            
        print(f"\nOverall Average Accuracy: {np.mean(overall_accuracy):.4f}")
        print(f"Overall Average Cosine Distance: {np.mean(overall_cosine_distance):.4f}")
        print(f"Overall Average Euclidean Distance: {np.mean(overall_euclidean_distance):.4f}")
        
        # 可视化分类结果
        if args.save_figures:
            category_fig_path = figure_dir / f"category_results_{timestamp}.png"
            evaluator.visualize_category_results(category_results, save_path=str(category_fig_path))
        else:
            evaluator.visualize_category_results(category_results)
        
        # 创建对比图（全局 vs 各类别平均）
        comparison_data = [
            ("Global", global_result),
            ("Category Average", BenchmarkResult(
                accuracy=np.mean(overall_accuracy),
                recall_at_1=np.mean([r.recall_at_1 for r in category_results.values()]),
                recall_at_3=np.mean([r.recall_at_3 for r in category_results.values()]),
                recall_at_5=np.mean([r.recall_at_5 for r in category_results.values()]),
                recall_at_10=np.mean([r.recall_at_10 for r in category_results.values()]),
                avg_retrieval_time=np.mean([r.avg_retrieval_time for r in category_results.values()]),
                total_samples=sum(r.total_samples for r in category_results.values()),
                correct_samples=sum(r.correct_samples for r in category_results.values()),
                model_name=args.model_name,
                avg_cosine_distance=np.mean(overall_cosine_distance),
                avg_euclidean_distance=np.mean(overall_euclidean_distance),
                std_cosine_distance=np.std(overall_cosine_distance),
                std_euclidean_distance=np.std(overall_euclidean_distance)
            ))
        ]
        
        if args.save_figures:
            comparison_fig_path = figure_dir / f"comparison_{timestamp}.png"
            evaluator.visualize_comparison(comparison_data, save_path=str(comparison_fig_path))
        else:
            evaluator.visualize_comparison(comparison_data)
    
    logger.info("Evaluation completed!")
    
    if args.save_figures:
        logger.info(f"All figures saved to: {figure_dir}")


if __name__ == "__main__":
    main()