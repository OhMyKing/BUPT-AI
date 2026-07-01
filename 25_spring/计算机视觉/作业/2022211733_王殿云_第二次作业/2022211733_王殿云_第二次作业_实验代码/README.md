# 计算机视觉-第二次课程作业-图像分类系统
2022211733 王殿云

## 项目概述
本系统实现了基于SIFT特征和词袋模型(Bag of Visual Words)的场景分类。
系统采用模块化设计，支持切换不同的实验配置。

## 项目结构:
- main.py: 主程序，实验配置和执行入口
- feature_extraction.py: 实现特征提取功能（SIFT，密集SIFT，RootSIFT）
- feature_representation.py: 实现特征表示方法（码本构建，词袋模型，空间金字塔匹配）
- classifier.py: 实现分类器（SVM，集成SVM）

## 数据集要求:
- 数据集应包含多个类别文件夹，每个文件夹名对应类别名
- 每个类别中编号前150号的样本作为训练集，其余为测试集

## 支持的实验配置:
1. SIFT特征+Kmeans+词袋表示+支撑向量机
2. 密集SIFT+Kmeans+词袋表示+支撑向量机
3. SIFT特征+Kmeans+词袋表示+空间金字塔匹配+支撑向量机
4. SIFT特征+RootSIFT归一化+Kmeans+词袋表示+支撑向量机
5. SIFT特征+Kmeans+词袋表示+集成SVM方法
6. 密集SIFT+RootSIFT归一化+Kmeans+词袋表示+空间金字塔匹配+集成SVM方法

## 使用方法:
1. 确保数据集位于'15-Scene'目录下
2. 修改main.py中的experiment_to_run变量选择要运行的实验配置
3. 执行main.py运行选定的实验

## 依赖库:
- numpy
- opencv-python (cv2)
- scikit-learn
- matplotlib
- seaborn

## 运行试验:
```
python main.py
```
