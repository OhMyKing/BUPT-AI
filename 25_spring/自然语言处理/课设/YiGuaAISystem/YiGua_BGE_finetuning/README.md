# YiGua BGE finetuning - BGE模型古汉语检索微调项目

## 项目概述

本项目是2025年**自然语言处理**课程实践的一部分，专注于BGE (BAAI General Embedding) 模型在古汉语检索任务上的微调研究。项目源于"来易卦，来一卦——基于文言文检索增强生成的易学咨询系统"的实际需求，旨在提升大语言模型在处理传统古籍内容时的检索准确性。

### 研究背景

当前大语言模型在处理传统易学、八字理论等古文内容时存在明显的幻觉现象。本项目通过对BGE-large-zh-v1.5模型进行专门的微调，使其更好地理解和检索文言文内容，从而为RAG (Retrieval Augmented Generation) 系统提供更准确的检索支持。

## 项目结构

```
BGE_finetuning_v0.2.0/
├── datas/                    # 数据目录（需从百度网盘下载）
│   ├── benchmark/           # C3 Benchmark评测数据
│   ├── dataset/            # 原始平行语料数据
│   └── finetune/           # 处理后的微调数据集
│       ├── random/         # 随机负例策略数据
│       ├── hard/           # 困难负例策略数据
│       ├── aligned/        # 双音节词对齐策略数据
│       └── aligned_hard/   # 混合策略数据
├── tools/                   # 数据处理工具
│   ├── spilt_datas.py      # 数据集划分工具
│   ├── align_datas.py      # 双音节词对齐工具
│   ├── construct_*.py      # 各种训练数据构造脚本
├── checkpoints/             # 微调模型检查点（需从百度网盘下载）
├── train.py                 # 模型训练主程序
├── evaluate.py              # 模型评估程序
└── outputs/figures/         # 评估结果可视化
```

## 数据准备

### 下载数据
数据文件较大，请从百度网盘下载：
- 链接: https://pan.baidu.com/s/1r8PvMJhPct91faFCu0OIWA?pwd=p3f3 
- 提取码: p3f3

下载后解压到项目根目录。

### 数据说明
- **原始数据**: `dataset`目录包含古文-现代文平行语料（.src为古文，.tgt为现代文翻译）
- **训练数据**: `finetune`目录包含四种不同策略构造的训练数据：
  - `random`: 使用随机负例的对比学习数据
  - `hard`: 基于embedding相似度选择困难负例
  - `aligned`: 利用双音节词对齐技术增强正例
  - `aligned_hard`: 结合对齐技术和困难负例的混合策略

## 核心创新点

### 1. 双音节词对齐技术
```python
# 使用动态规划进行古文-现代文的双音节词对齐
python tools/align_datas.py
```
通过识别古文单字与现代文双音节词的对应关系，生成多样化的正例样本。

### 2. 多策略负例构造
- **随机负例**: 基础对比学习策略
- **困难负例**: 使用BGE模型找到最相似的非配对文本作为负例
- **混合策略**: 结合多种负例构造方法

### 3. 针对性评估体系
使用C3 Benchmark (Comprehensive Classical Chinese Benchmark) 进行评估，重点关注：
- Recall@K (K=1,3,5,10)
- 古文-现代文配对检索准确率
- Embedding空间距离分析

## 快速开始

### 环境配置
```bash
# 创建虚拟环境
conda create -n bge-finetune python=3.8
conda activate bge-finetune

# 安装依赖
pip install -r requirements.txt
```

### 数据处理
```bash
# 1. 数据集划分（5% dev, 79.5% train, 20% test）
python tools/spilt_datas.py

# 2. 构造训练数据（以aligned策略为例）
python tools/align_datas.py
python tools/construct_aligen_pos_dataset.py --output_dir ./datas/finetune/aligned/
```

### 模型训练
```bash
# 训练BGE模型（以aligned数据为例）
python train.py \
    --train_data ./datas/finetune/aligned/train_data.jsonl \
    --val_data ./datas/finetune/aligned/val_data.jsonl \
    --model_name BAAI/bge-large-zh-v1.5 \
    --num_epochs 3 \
    --batch_size 32 \
    --learning_rate 1e-5 \
    --save_dir ./checkpoints/aligned/
```

### 模型评估
```bash
# 在C3 Benchmark上评估
python evaluate.py \
    --model_name ./checkpoints/aligned/best_model \
    --data_path ./datas/benchmark/C3_bench/C3_bench.json \
    --save_figures \
    --figure_dir ./outputs/figures/aligned/
```

## 实验结果

项目在C3 Benchmark上进行了系统评估，主要发现：

1. **基线模型**: BGE-large-zh-v1.5在未经微调时的Recall@1约为89%
2. **微调效果**: 
   - Random策略: Recall@1提升至91%
   - Aligned策略: Recall@1提升至91.7%
   - Hard策略: Recall@1提升至93.4%
   - Aligned-Hard混合策略: Recall@1达到93.4%，并相对Hard策略获得了Embedding空间的更好表示

详细的实验结果和可视化图表请查看`outputs/figures/`目录。

3. **微调模型**: 效果最好的Aligned-Hard混合策略微调模型文件较大，请从百度网盘下载：
- 链接: https://pan.baidu.com/s/1r8PvMJhPct91faFCu0OIWA?pwd=p3f3 
- 提取码: p3f3

下载后解压到项目根目录。

## 技术亮点

1. **文言文特化处理**: 针对文言文"词类活用"、"一词多义"等特点设计专门的处理策略
2. **双音节词对齐**: 创新性地利用古今汉语演变规律增强训练数据
3. **多维度评估**: 不仅关注检索准确率，还分析了embedding空间的距离分布
4. **工程化实现**: 完整的数据处理-训练-评估pipeline，便于复现和扩展

## 相关资源

- C3 Benchmark：[古汉语理解能力基准测试集](https://github.com/SCUT-DLVCLab/C3bench)
- BGE模型：[BAAI/bge-large-zh-v1.5](https://huggingface.co/BAAI/bge-large-zh-v1.5)

## 致谢

感谢自然语言处理课程的指导老师和助教，以及BAAI提供的BGE预训练模型。

## 联系方式

如有问题，请通过课程平台联系项目组成员。也可联系组长 王殿云（手机/微信：13800000000）