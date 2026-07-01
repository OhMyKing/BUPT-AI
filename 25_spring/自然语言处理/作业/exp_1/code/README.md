# 词向量构建与评价：基于SVD与SGNS的方法比较研究

## 项目概述

本项目实现了两种词向量构建方法：
1. 基于奇异值分解（SVD）的方法
2. 基于Skip-Gram负采样（SGNS）的方法

并对这两种方法在WordSim-353数据集上的性能进行了比较评估。

## 环境要求

- Python 3.8+
- PyTorch 2.0.0
- CUDA 11.8（可选，用于GPU加速）
- 其他依赖库：scipy, numpy, scikit-learn, tqdm, wandb

## 文件结构

- `config.py`: 配置参数文件，包含词向量维度、窗口大小、下采样阈值等配置
- `main.py`: 主程序入口，实现整个实验流程
- `model.py`: 模型实现，包含Word2Vec和SGNS模型的定义
- `test.py`: 评估代码，在WordSim-353数据集上计算性能指标
- `utils.py`: 工具函数，包含语料预处理、词表构建、共现矩阵计算等
- `data/`: 存储中间数据，如共现矩阵
- `pts/`: 存储训练过程中保存的模型参数
- `wandb/`: Weights & Biases日志文件，记录训练过程
- `2022211733`: 生成的评估结果文件
- `correlations.txt`: 评估性能的相关系数结果

## 实验设计

本项目设计了两组对照实验：

1. **实验一**：无PPMI变换的SVD + 随机初始化的SGNS
2. **实验二**：有PPMI变换的SVD + 使用SVD向量初始化的SGNS

关键参数设置：
- SVD方法：窗口大小K=5，词向量维度=200
- SGNS方法：窗口大小K=2，词向量维度=200
- 最小词频阈值=5，下采样阈值=1e-5

## 运行说明

1. 准备语料文件 `lmtraining.txt` 和评测数据集 `wordsim353_agreed.txt`，放在项目根目录下
2. 执行主程序：
   ```
   python main.py
   ```

3. 程序将依次执行：
   - 语料预处理与词表构建
   - 构建共现矩阵与SVD降维
   - 训练SGNS模型（使用SVD向量初始化）
   - 在WordSim-353上评估两种方法的性能

4. 结果查看：
   - `2022211733`: 包含每个词对的原始行、SVD相似度、SGNS相似度
   - `correlations.txt`: 包含两种方法的Spearman和Pearson相关系数

## 核心实现

- `build_cooccurrence_matrix()`: 构建共现矩阵，考虑词距离加权
- `apply_ppmi()`: 应用PPMI变换处理共现矩阵
- `apply_svd()`: 对共现矩阵应用SVD降维获取词向量
- `train_sgns_model()`: 训练SGNS模型，可选使用SVD预训练向量初始化
- `evaluate_wordsim()`: 在WordSim-353上评估词向量性能

## 实验结果

本实验的主要发现：

1. PPMI变换显著提升SVD方法性能（Spearman值从0.298提升至0.627）
2. SVD初始化大幅提升SGNS模型性能（Spearman值从0.348提升至0.659）
3. 结合SVD和SGNS的两阶段训练策略获得最佳性能，综合了全局统计和局部上下文学习的优势

详细结果请参见`correlations.txt`文件和实验报告。

## 其他说明

- 为提高效率，共现矩阵使用稀疏表示并保存到`data/`目录
- SGNS模型训练过程中的检查点保存在`pts/`目录