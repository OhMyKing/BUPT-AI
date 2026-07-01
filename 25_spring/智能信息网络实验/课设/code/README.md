# 中文新闻文本标题分类实验

## 项目概述

本项目是针对"飞桨学习赛：中文新闻文本标题分类"竞赛的综合解决方案。我们的团队（OhMyKing）在本次竞赛中取得了**月榜第一**的成绩（截止2025年5月27日），最终准确率达到**90.54893%**。

本项目系统性地解决了中文新闻标题分类面临的三大核心挑战：
1. **语言复杂性**：中文缺乏明确词边界，字符具有高度多义性
2. **数据长尾问题**：头尾类别样本比例高达500:1的极端不平衡
3. **短文本问题**：新闻标题平均长度仅10-30字符，语义信息稀疏

## 技术方案

### 1. 基础模型：RoBERTa-wwm-ext-large + 伪标签学习

- **模型选择**：`hfl/chinese-roberta-wwm-ext-large`（24层，3.3亿参数）
- **全词掩码**：采用WWM策略，更适合中文语义理解
- **伪标签学习**：
  - 第一阶段：在标注数据上训练基础模型
  - 第二阶段：对测试集生成高置信度（≥0.9）伪标签，扩充训练集

### 2. LSFA（标签特定特征增强）

针对严重的类别不平衡问题，我们复现并改进了AAAI 2023的LSFA方法：
- **解耦表示学习**：通过标签特定注意力机制，为每个标签生成独特的特征表示
- **头尾知识迁移**：将头部标签的二阶统计量迁移到尾部标签
- **原型监督对比学习**：优化特征空间分布，增强类别区分性

### 3. 基于LLM的内容扩充（创新方法）

- **动机**：解决短文本语义信息不足的问题
- **实现**：使用Qwen2.5-1.5B-Instruct为每个标题生成150-200字的新闻内容
- **理论支撑**：从互信息理论角度证明了方法的有效性

## 实验结果

### 性能提升路径
1. **基础模型**：89.22%
2. **+ 伪标签学习**：89.52%（+0.30%）
3. **+ LSFA数据增强**：90.00%（+0.48%）
4. **+ LLM内容扩充**：**90.55%**（+0.55%）

### 类别性能分析
通过LSFA和LLM增强后，各类别性能均有提升，特别是尾部类别：
- 星座类：78.77% → 97.85%（+19.08%）
- 彩票类：80.49% → 97.92%（+17.43%）
- 时尚类：83.57% → 98.02%（+14.45%）

## 项目结构

```
.
├── main.py                    # 主程序：RoBERTa+伪标签学习
├── data_analyze.py            # 数据分析与可视化
├── llm_enhance_data.py        # LLM数据增强实现
├── README.md                  # 项目说明文档
├── datas/                     # 数据文件夹（需从竞赛平台下载）
│   ├── train.txt             # 训练数据（752,421条）
│   ├── dev.txt               # 验证数据
│   └── test.txt              # 测试数据
├── outputs/                   # 输出文件夹
│   ├── headline_analysis.png  # 数据分析图表
│   ├── result.txt            # 预测结果
│   └── submission.zip        # 提交文件
└── LSFA/                     # LSFA方法实现
    ├── main.py               # LSFA主程序
    ├── model.py              # 模型架构（BiLSTM+注意力）
    ├── dataset.py            # 数据处理
    ├── calibration.py        # 分类器校准
    ├── contrastive.py        # 对比学习
    └── transfer/             # 特征增强模块
        ├── collector.py      # 特征收集
        ├── generator.py      # VAE生成器
        └── transfer_model.py # PVAE模型
```

## 快速开始

### 环境配置
```bash
# 创建虚拟环境
conda create -n news-classification python=3.10
conda activate news-classification

# 安装依赖
pip install torch>=1.9.0
pip install transformers>=4.20.0
pip install pandas numpy scikit-learn matplotlib seaborn tqdm
pip install wandb  # 可选，用于实验跟踪
```

### 数据准备
1. 从飞桨竞赛平台下载数据文件
2. 将train.txt、dev.txt、test.txt放置在`datas/`目录下

### 运行实验

#### 方法一：RoBERTa + 伪标签学习（推荐）
```bash
python main.py
```

#### 方法二：LSFA方法
```bash
cd LSFA
python preprocess.py  # 数据预处理
python main.py        # 模型训练
```

#### 数据分析
```bash
python data_analyze.py  # 生成数据分布图表
```

#### LLM数据增强（可选）
```bash
python llm_enhance_data.py  # 需要GPU，支持断点续传
```

## 核心创新点

1. **系统性解决方案**：针对中文新闻分类的三大挑战提出完整解决方案
2. **LSFA优化应用**：成功将LSFA方法应用于中文场景，有效缓解长尾问题
3. **LLM内容扩充**：创新性地利用LLM解决短文本问题，并提供理论证明
4. **训练策略优化**：结合warmup、余弦退火、伪标签等技术提升性能

## 实验环境

- **硬件**：NVIDIA RTX 4090 (24GB)
- **软件**：PyTorch 2.1.2, CUDA 11.8, Python 3.10
- **训练参数**：
  - Batch Size: 64
  - Learning Rate: 2e-5
  - Epochs: 4
  - Max Length: 48（标题） / 512（扩充后）

## 数据集信息

**THUCNews数据集**（14个类别）：
- 财经、彩票、房产、股票、家居、教育、科技、社会、时尚、时政、体育、星座、游戏、娱乐
- 训练集：752,421条
- 类别分布：极端不平衡（科技类146,637条 vs 星座类3,221条）

## 团队成员

- 王殿云 (2022211733)
- 王博涵 (2022211735)  
- 王艺栋 (2022211799)