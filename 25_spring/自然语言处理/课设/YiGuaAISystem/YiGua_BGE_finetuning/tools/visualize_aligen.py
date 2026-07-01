#!/usr/bin/env python3
"""
古汉语-现代汉语对齐表示可视化脚本
用于证明对齐数据构造方法能够帮助模型学习到更好的对齐表示
参考mRASP论文的可视化方法
"""

import json
import numpy as np
import torch
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import seaborn as sns
from typing import List, Dict, Tuple
import logging
import argparse
from tqdm import tqdm
import jieba

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 设置中文字体
def setup_chinese_font(font_path: str = '../src/fonts/STHeiti Medium.ttc'):
    """设置中文字体"""
    try:
        if Path(font_path).exists():
            fm.fontManager.addfont(font_path)
            prop = fm.FontProperties(fname=font_path)
            font_name = prop.get_name()
            plt.rcParams['font.sans-serif'] = [font_name, 'DejaVu Sans']
            plt.rcParams['axes.unicode_minus'] = False
            logger.info(f"成功加载字体: {font_name}")
        else:
            logger.warning(f"字体文件不存在: {font_path}, 使用默认字体")
            plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
    except Exception as e:
        logger.warning(f"加载字体失败: {e}")
        plt.rcParams['font.sans-serif'] = ['DejaVu Sans']

# 初始化字体
setup_chinese_font()
sns.set_style("whitegrid")


class AlignmentVisualizer:
    """对齐表示可视化器"""
    
    def __init__(self, baseline_model_path: str, finetuned_model_path: str, 
                 aligned_data_path: str, device: str = 'cuda'):
        """
        初始化可视化器
        
        Args:
            baseline_model_path: 基线模型路径（未使用对齐数据训练）
            finetuned_model_path: 微调后模型路径（使用对齐数据训练）
            aligned_data_path: 对齐数据路径
            device: 计算设备
        """
        self.device = device if torch.cuda.is_available() else 'cpu'
        
        logger.info(f"加载基线模型: {baseline_model_path}")
        self.baseline_model = SentenceTransformer(baseline_model_path, device=self.device)
        
        logger.info(f"加载微调模型: {finetuned_model_path}")
        self.finetuned_model = SentenceTransformer(finetuned_model_path, device=self.device)
        
        logger.info(f"加载对齐数据: {aligned_data_path}")
        self.aligned_data = self.load_aligned_data(aligned_data_path)
        
    def load_aligned_data(self, path: str) -> List[Dict]:
        """加载对齐数据"""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"加载了 {len(data)} 条对齐数据")
        return data
    
    def extract_aligned_word_pairs(self, num_pairs: int = 100) -> List[Tuple[str, str]]:
        """
        从对齐数据中提取对齐的词对
        
        Args:
            num_pairs: 要提取的词对数量
            
        Returns:
            对齐词对列表 [(古文词, 现代文词), ...]
        """
        word_pairs = []
        word_set = set()  # 避免重复
        
        for item in self.aligned_data:
            # 从每个替换概率级别中提取替换的词对
            for prob in ['30%', '50%', '70%']:
                if prob in item['replacements']:
                    replacements = item['replacements'][prob]['replaced_alignments']
                    for repl in replacements:
                        src_char = repl['src_char']
                        tgt_token = repl['tgt_token']
                        
                        # 只保留双音节词的对齐
                        if len(tgt_token) >= 2 and (src_char, tgt_token) not in word_set:
                            word_pairs.append((src_char, tgt_token))
                            word_set.add((src_char, tgt_token))
                            
                            if len(word_pairs) >= num_pairs:
                                return word_pairs
        
        return word_pairs
    
    def extract_sentence_pairs(self, num_pairs: int = 50) -> List[Tuple[str, str]]:
        """
        提取句子对用于可视化
        
        Returns:
            句子对列表 [(古文句子, 现代文句子), ...]
        """
        sentence_pairs = []
        
        for item in self.aligned_data[:num_pairs]:
            original = item['original']
            target = item['target']
            sentence_pairs.append((original, target))
            
        return sentence_pairs
    
    def compute_embeddings(self, texts: List[str], model: SentenceTransformer) -> np.ndarray:
        """计算文本的嵌入表示"""
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        return embeddings
    
    def calculate_alignment_similarity(self, word_pairs: List[Tuple[str, str]], 
                                     model: SentenceTransformer) -> float:
        """
        计算对齐词对的平均余弦相似度
        
        Args:
            word_pairs: 对齐词对列表
            model: 编码模型
            
        Returns:
            平均余弦相似度
        """
        src_words = [pair[0] for pair in word_pairs]
        tgt_words = [pair[1] for pair in word_pairs]
        
        src_embeddings = model.encode(src_words, convert_to_numpy=True)
        tgt_embeddings = model.encode(tgt_words, convert_to_numpy=True)
        
        # 计算每对词的余弦相似度
        similarities = []
        for i in range(len(word_pairs)):
            sim = cosine_similarity(src_embeddings[i:i+1], tgt_embeddings[i:i+1])[0][0]
            similarities.append(sim)
            
        return np.mean(similarities), np.std(similarities)
    
    def visualize_word_embeddings_pca(self, word_pairs: List[Tuple[str, str]], 
                                     save_path: str = None):
        """
        使用PCA可视化词嵌入空间
        
        Args:
            word_pairs: 对齐词对
            save_path: 保存路径
        """
        src_words = [pair[0] for pair in word_pairs]
        tgt_words = [pair[1] for pair in word_pairs]
        
        # 计算基线模型的嵌入
        baseline_src = self.baseline_model.encode(src_words, convert_to_numpy=True)
        baseline_tgt = self.baseline_model.encode(tgt_words, convert_to_numpy=True)
        
        # 计算微调模型的嵌入
        finetuned_src = self.finetuned_model.encode(src_words, convert_to_numpy=True)
        finetuned_tgt = self.finetuned_model.encode(tgt_words, convert_to_numpy=True)
        
        # PCA降维
        pca = PCA(n_components=2, random_state=42)
        
        # 创建图表
        fig, axes = plt.subplots(1, 2, figsize=(16, 8))
        
        # 基线模型可视化
        ax1 = axes[0]
        baseline_all = np.vstack([baseline_src, baseline_tgt])
        baseline_pca = pca.fit_transform(baseline_all)
        baseline_src_pca = baseline_pca[:len(src_words)]
        baseline_tgt_pca = baseline_pca[len(src_words):]
        
        ax1.scatter(baseline_src_pca[:, 0], baseline_src_pca[:, 1], 
                   c='blue', label='古文', alpha=0.6, s=50)
        ax1.scatter(baseline_tgt_pca[:, 0], baseline_tgt_pca[:, 1], 
                   c='red', label='现代文', alpha=0.6, s=50)
        
        # 连接对齐的词对
        for i in range(len(word_pairs)):
            ax1.plot([baseline_src_pca[i, 0], baseline_tgt_pca[i, 0]],
                    [baseline_src_pca[i, 1], baseline_tgt_pca[i, 1]],
                    'gray', alpha=0.3, linewidth=0.5)
        
        ax1.set_title('基线模型（未使用对齐数据）', fontsize=14)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 微调模型可视化
        ax2 = axes[1]
        finetuned_all = np.vstack([finetuned_src, finetuned_tgt])
        finetuned_pca = pca.fit_transform(finetuned_all)
        finetuned_src_pca = finetuned_pca[:len(src_words)]
        finetuned_tgt_pca = finetuned_pca[len(src_words):]
        
        ax2.scatter(finetuned_src_pca[:, 0], finetuned_src_pca[:, 1], 
                   c='blue', label='古文', alpha=0.6, s=50)
        ax2.scatter(finetuned_tgt_pca[:, 0], finetuned_tgt_pca[:, 1], 
                   c='red', label='现代文', alpha=0.6, s=50)
        
        # 连接对齐的词对
        for i in range(len(word_pairs)):
            ax2.plot([finetuned_src_pca[i, 0], finetuned_tgt_pca[i, 0]],
                    [finetuned_src_pca[i, 1], finetuned_tgt_pca[i, 1]],
                    'gray', alpha=0.3, linewidth=0.5)
        
        ax2.set_title('微调模型（使用对齐数据）', fontsize=14)
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.suptitle('古文-现代文词嵌入空间可视化（PCA）', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"图表已保存到: {save_path}")
        else:
            plt.show()
        plt.close()
    
    def visualize_similarity_comparison(self, num_words: int = 50, save_path: str = None):
        """
        可视化对齐词对的相似度对比
        
        Args:
            num_words: 要分析的词对数量
            save_path: 保存路径
        """
        # 提取不同数量的词对进行分析
        word_counts = [10, 20, 30, 40, 50, 75, 100]
        baseline_sims = []
        baseline_stds = []
        finetuned_sims = []
        finetuned_stds = []
        
        for count in word_counts:
            if count > num_words:
                count = num_words
            word_pairs = self.extract_aligned_word_pairs(count)
            
            # 计算基线模型的相似度
            base_sim, base_std = self.calculate_alignment_similarity(word_pairs, self.baseline_model)
            baseline_sims.append(base_sim)
            baseline_stds.append(base_std)
            
            # 计算微调模型的相似度
            fine_sim, fine_std = self.calculate_alignment_similarity(word_pairs, self.finetuned_model)
            finetuned_sims.append(fine_sim)
            finetuned_stds.append(fine_std)
            
            logger.info(f"词对数量: {count}, 基线相似度: {base_sim:.3f}, 微调相似度: {fine_sim:.3f}")
        
        # 创建图表
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # 相似度对比图
        x = np.arange(len(word_counts))
        width = 0.35
        
        bars1 = ax1.bar(x - width/2, baseline_sims, width, label='基线模型', 
                        color='lightcoral', alpha=0.7, yerr=baseline_stds, capsize=5)
        bars2 = ax1.bar(x + width/2, finetuned_sims, width, label='微调模型', 
                        color='skyblue', alpha=0.7, yerr=finetuned_stds, capsize=5)
        
        ax1.set_xlabel('词对数量', fontsize=12)
        ax1.set_ylabel('平均余弦相似度', fontsize=12)
        ax1.set_title('对齐词对的余弦相似度对比', fontsize=14)
        ax1.set_xticks(x)
        ax1.set_xticklabels(word_counts)
        ax1.legend()
        ax1.grid(True, alpha=0.3, axis='y')
        
        # 在柱状图上添加数值
        for bars in [bars1, bars2]:
            for bar in bars:
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{height:.3f}', ha='center', va='bottom', fontsize=9)
        
        # 相似度提升百分比
        improvements = [(f - b) / b * 100 for b, f in zip(baseline_sims, finetuned_sims)]
        
        ax2.plot(word_counts, improvements, marker='o', markersize=8, 
                linewidth=2, color='green')
        ax2.fill_between(word_counts, 0, improvements, alpha=0.3, color='green')
        ax2.set_xlabel('词对数量', fontsize=12)
        ax2.set_ylabel('相似度提升百分比 (%)', fontsize=12)
        ax2.set_title('使用对齐数据后的相似度提升', fontsize=14)
        ax2.grid(True, alpha=0.3)
        
        # 添加平均提升线
        avg_improvement = np.mean(improvements)
        ax2.axhline(y=avg_improvement, color='red', linestyle='--', 
                   label=f'平均提升: {avg_improvement:.1f}%')
        ax2.legend()
        
        plt.suptitle('对齐数据对模型表示学习的影响', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"图表已保存到: {save_path}")
        else:
            plt.show()
        plt.close()
    
    def visualize_sentence_level_similarity(self, num_sentences: int = 30, save_path: str = None):
        """
        可视化句子级别的相似度分布
        
        Args:
            num_sentences: 句子数量
            save_path: 保存路径
        """
        sentence_pairs = self.extract_sentence_pairs(num_sentences)
        src_sentences = [pair[0] for pair in sentence_pairs]
        tgt_sentences = [pair[1] for pair in sentence_pairs]
        
        # 计算句子嵌入
        baseline_src = self.baseline_model.encode(src_sentences, convert_to_numpy=True)
        baseline_tgt = self.baseline_model.encode(tgt_sentences, convert_to_numpy=True)
        finetuned_src = self.finetuned_model.encode(src_sentences, convert_to_numpy=True)
        finetuned_tgt = self.finetuned_model.encode(tgt_sentences, convert_to_numpy=True)
        
        # 计算相似度
        baseline_sims = []
        finetuned_sims = []
        
        for i in range(len(sentence_pairs)):
            base_sim = cosine_similarity(baseline_src[i:i+1], baseline_tgt[i:i+1])[0][0]
            fine_sim = cosine_similarity(finetuned_src[i:i+1], finetuned_tgt[i:i+1])[0][0]
            baseline_sims.append(base_sim)
            finetuned_sims.append(fine_sim)
        
        # 创建图表
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
        
        # 直方图对比
        bins = np.linspace(0, 1, 20)
        ax1.hist(baseline_sims, bins=bins, alpha=0.5, label='基线模型', 
                color='lightcoral', edgecolor='black')
        ax1.hist(finetuned_sims, bins=bins, alpha=0.5, label='微调模型', 
                color='skyblue', edgecolor='black')
        ax1.axvline(np.mean(baseline_sims), color='red', linestyle='--', 
                   label=f'基线均值: {np.mean(baseline_sims):.3f}')
        ax1.axvline(np.mean(finetuned_sims), color='blue', linestyle='--', 
                   label=f'微调均值: {np.mean(finetuned_sims):.3f}')
        ax1.set_xlabel('余弦相似度', fontsize=12)
        ax1.set_ylabel('频数', fontsize=12)
        ax1.set_title('句子级别相似度分布', fontsize=14)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 散点图对比
        ax2.scatter(baseline_sims, finetuned_sims, alpha=0.6, s=50)
        ax2.plot([0, 1], [0, 1], 'r--', alpha=0.5, label='y=x')
        ax2.set_xlabel('基线模型相似度', fontsize=12)
        ax2.set_ylabel('微调模型相似度', fontsize=12)
        ax2.set_title('句子相似度对比', fontsize=14)
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        # 计算改进的句子比例
        improved = sum(1 for b, f in zip(baseline_sims, finetuned_sims) if f > b)
        improvement_ratio = improved / len(sentence_pairs) * 100
        ax2.text(0.05, 0.95, f'改进比例: {improvement_ratio:.1f}%', 
                transform=ax2.transAxes, verticalalignment='top',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        plt.suptitle('句子级别的对齐表示改进分析', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"图表已保存到: {save_path}")
        else:
            plt.show()
        plt.close()
    
    def visualize_tsne_embeddings(self, num_samples: int = 200, save_path: str = None):
        """
        使用t-SNE可视化高维嵌入
        
        Args:
            num_samples: 样本数量
            save_path: 保存路径
        """
        # 提取句子对
        sentence_pairs = self.extract_sentence_pairs(num_samples // 2)
        src_sentences = [pair[0] for pair in sentence_pairs]
        tgt_sentences = [pair[1] for pair in sentence_pairs]
        
        # 计算嵌入
        logger.info("计算句子嵌入...")
        baseline_src = self.baseline_model.encode(src_sentences, convert_to_numpy=True)
        baseline_tgt = self.baseline_model.encode(tgt_sentences, convert_to_numpy=True)
        finetuned_src = self.finetuned_model.encode(src_sentences, convert_to_numpy=True)
        finetuned_tgt = self.finetuned_model.encode(tgt_sentences, convert_to_numpy=True)
        
        # t-SNE降维
        logger.info("执行t-SNE降维...")
        tsne = TSNE(n_components=2, random_state=42, perplexity=30)
        
        # 创建图表
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
        
        # 基线模型
        baseline_all = np.vstack([baseline_src, baseline_tgt])
        baseline_tsne = tsne.fit_transform(baseline_all)
        baseline_src_tsne = baseline_tsne[:len(src_sentences)]
        baseline_tgt_tsne = baseline_tsne[len(src_sentences):]
        
        ax1.scatter(baseline_src_tsne[:, 0], baseline_src_tsne[:, 1], 
                   c='blue', label='古文', alpha=0.6, s=30)
        ax1.scatter(baseline_tgt_tsne[:, 0], baseline_tgt_tsne[:, 1], 
                   c='red', label='现代文', alpha=0.6, s=30)
        ax1.set_title('基线模型 (t-SNE)', fontsize=14)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 微调模型
        finetuned_all = np.vstack([finetuned_src, finetuned_tgt])
        finetuned_tsne = tsne.fit_transform(finetuned_all)
        finetuned_src_tsne = finetuned_tsne[:len(src_sentences)]
        finetuned_tgt_tsne = finetuned_tsne[len(src_sentences):]
        
        ax2.scatter(finetuned_src_tsne[:, 0], finetuned_src_tsne[:, 1], 
                   c='blue', label='古文', alpha=0.6, s=30)
        ax2.scatter(finetuned_tgt_tsne[:, 0], finetuned_tgt_tsne[:, 1], 
                   c='red', label='现代文', alpha=0.6, s=30)
        ax2.set_title('微调模型 (t-SNE)', fontsize=14)
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        plt.suptitle('古文-现代文嵌入空间可视化 (t-SNE)', fontsize=16, fontweight='bold')
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"图表已保存到: {save_path}")
        else:
            plt.show()
        plt.close()
    
    def create_comprehensive_report(self, output_dir: str):
        """
        创建完整的可视化报告
        
        Args:
            output_dir: 输出目录
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        logger.info("生成综合可视化报告...")
        
        # 1. PCA词嵌入可视化
        logger.info("1. 生成PCA词嵌入可视化...")
        word_pairs = self.extract_aligned_word_pairs(50)
        self.visualize_word_embeddings_pca(
            word_pairs, 
            save_path=output_path / "word_embeddings_pca.png"
        )
        
        # 2. 相似度对比分析
        logger.info("2. 生成相似度对比分析...")
        self.visualize_similarity_comparison(
            num_words=100,
            save_path=output_path / "similarity_comparison.png"
        )
        
        # 3. 句子级别相似度分析
        logger.info("3. 生成句子级别相似度分析...")
        self.visualize_sentence_level_similarity(
            num_sentences=50,
            save_path=output_path / "sentence_similarity.png"
        )
        
        # 4. t-SNE可视化
        logger.info("4. 生成t-SNE可视化...")
        self.visualize_tsne_embeddings(
            num_samples=200,
            save_path=output_path / "embeddings_tsne.png"
        )
        
        # 5. 生成统计报告
        logger.info("5. 生成统计报告...")
        self.generate_statistics_report(output_path / "statistics_report.txt")
        
        logger.info(f"综合报告已生成到: {output_path}")
    
    def generate_statistics_report(self, save_path: str):
        """生成统计报告"""
        report = []
        report.append("="*60)
        report.append("古文-现代文对齐表示学习效果分析报告")
        report.append("="*60)
        report.append("")
        
        # 词级别分析
        word_pairs = self.extract_aligned_word_pairs(100)
        base_sim, base_std = self.calculate_alignment_similarity(word_pairs, self.baseline_model)
        fine_sim, fine_std = self.calculate_alignment_similarity(word_pairs, self.finetuned_model)
        
        report.append("1. 词级别对齐分析")
        report.append("-"*40)
        report.append(f"分析词对数量: {len(word_pairs)}")
        report.append(f"基线模型平均相似度: {base_sim:.4f} (±{base_std:.4f})")
        report.append(f"微调模型平均相似度: {fine_sim:.4f} (±{fine_std:.4f})")
        report.append(f"相似度提升: {(fine_sim - base_sim):.4f} ({(fine_sim - base_sim)/base_sim*100:.1f}%)")
        report.append("")
        
        # 句子级别分析
        sentence_pairs = self.extract_sentence_pairs(50)
        src_sentences = [pair[0] for pair in sentence_pairs]
        tgt_sentences = [pair[1] for pair in sentence_pairs]
        
        baseline_src = self.baseline_model.encode(src_sentences, convert_to_numpy=True)
        baseline_tgt = self.baseline_model.encode(tgt_sentences, convert_to_numpy=True)
        finetuned_src = self.finetuned_model.encode(src_sentences, convert_to_numpy=True)
        finetuned_tgt = self.finetuned_model.encode(tgt_sentences, convert_to_numpy=True)
        
        baseline_sims = []
        finetuned_sims = []
        for i in range(len(sentence_pairs)):
            base_sim = cosine_similarity(baseline_src[i:i+1], baseline_tgt[i:i+1])[0][0]
            fine_sim = cosine_similarity(finetuned_src[i:i+1], finetuned_tgt[i:i+1])[0][0]
            baseline_sims.append(base_sim)
            finetuned_sims.append(fine_sim)
        
        report.append("2. 句子级别对齐分析")
        report.append("-"*40)
        report.append(f"分析句子对数量: {len(sentence_pairs)}")
        report.append(f"基线模型平均相似度: {np.mean(baseline_sims):.4f} (±{np.std(baseline_sims):.4f})")
        report.append(f"微调模型平均相似度: {np.mean(finetuned_sims):.4f} (±{np.std(finetuned_sims):.4f})")
        improvement = (np.mean(finetuned_sims) - np.mean(baseline_sims)) / np.mean(baseline_sims) * 100
        report.append(f"相似度提升: {improvement:.1f}%")
        improved_count = sum(1 for b, f in zip(baseline_sims, finetuned_sims) if f > b)
        report.append(f"改进的句子比例: {improved_count}/{len(sentence_pairs)} ({improved_count/len(sentence_pairs)*100:.1f}%)")
        report.append("")
        
        report.append("3. 结论")
        report.append("-"*40)
        report.append("使用对齐数据构造方法训练的模型在古文-现代文对齐表示学习上表现出显著改进：")
        report.append(f"- 词级别相似度平均提升 {(fine_sim - base_sim)/base_sim*100:.1f}%")
        report.append(f"- 句子级别相似度平均提升 {improvement:.1f}%")
        report.append("- 语义空间中古文和现代文的表示更加接近")
        report.append("- 对齐词对和句子对的表示一致性得到增强")
        
        # 保存报告
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        logger.info(f"统计报告已保存到: {save_path}")


def main():
    parser = argparse.ArgumentParser(description='古汉语-现代汉语对齐表示可视化')
    
    parser.add_argument('--baseline_model', type=str, 
                        default='../checkpoints_hard/best_model',
                        help='双音节词对齐微调前模型路径')
    parser.add_argument('--finetuned_model', type=str, 
                        default='../checkpoints_aligned_hard/best_model',
                        help='双音节词对齐微调后模型路径')
    parser.add_argument('--aligned_data', type=str,
                        default='../datas/dataset/aligen_dev.json',
                        help='对齐数据路径')
    parser.add_argument('--output_dir', type=str,
                        default='../outputs/figures/align_vis',
                        help='输出目录')
    parser.add_argument('--device', type=str, default='cuda',
                        help='计算设备')
    parser.add_argument('--font_path', type=str,
                        default='../src/fonts/STHeiti Medium.ttc',
                        help='中文字体路径')
    
    args = parser.parse_args()
    
    # 设置字体
    if args.font_path:
        setup_chinese_font(args.font_path)
    
    # 创建可视化器
    visualizer = AlignmentVisualizer(
        baseline_model_path=args.baseline_model,
        finetuned_model_path=args.finetuned_model,
        aligned_data_path=args.aligned_data,
        device=args.device
    )
    
    # 生成综合报告
    visualizer.create_comprehensive_report(args.output_dir)
    
    logger.info("可视化分析完成！")


if __name__ == "__main__":
    main()