import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from matplotlib.font_manager import FontProperties

# 设置中文字体
font_path = '/System/Library/Fonts/STHeiti Light.ttc'
font_prop = FontProperties(fname=font_path)
plt.rcParams['font.family'] = ['sans-serif']
plt.rcParams['axes.unicode_minus'] = False

with open('train.txt', 'r', encoding='utf-8') as f:
    data = f.read()

# 解析数据
lines = data.strip().split('\n')
headlines = []
categories = []

for line in lines:
    parts = line.strip().split('\t')
    if len(parts) == 2:
        headline, category = parts
        headlines.append(headline)
        categories.append(category)

# 创建DataFrame
df = pd.DataFrame({
    '标题': headlines,
    '类别': categories,
    '标题长度': [len(h) for h in headlines]
})

# 打印基本统计信息
print("数据集大小:", len(df))
print("\n类别分布:")
print(df['类别'].value_counts())
print("\n标题长度统计:")
print(df['标题长度'].describe())

# 创建绘图
plt.figure(figsize=(15, 10))

# 1. 标题长度分布的分组直方图（每2个字符一组）
plt.subplot(2, 1, 1)

# 计算最大标题长度并创建分组（bins）
max_length = df['标题长度'].max()
bins = range(0, max_length + 3, 2)  # +3 确保最后一个组也能显示

# 创建直方图
n, bins, patches = plt.hist(df['标题长度'], bins=bins, alpha=0.7, color='royalblue', edgecolor='black')

# 在每个柱子上方添加频数标签
for i in range(len(n)):
    if n[i] > 0:  # 只在有数据的柱子上添加标签
        plt.text(bins[i] + 1, n[i] + 5, int(n[i]), ha='center', va='bottom', fontsize=9)

# 添加平均线
plt.axvline(df['标题长度'].mean(), color='r', linestyle='--', label=f'平均长度: {df["标题长度"].mean():.2f}')

plt.title('新闻标题长度分布 (每2个字符一组)', fontproperties=font_prop, fontsize=16)
plt.xlabel('标题长度（字符数）', fontproperties=font_prop, fontsize=12)
plt.ylabel('频数', fontproperties=font_prop, fontsize=12)
plt.grid(alpha=0.3)
plt.legend(prop=font_prop)

# 设置x轴刻度，确保每个分组都有标签
plt.xticks(bins)

# 2. 类别数量柱状图
plt.subplot(2, 1, 2)
category_counts = df['类别'].value_counts()
bars = plt.bar(category_counts.index, category_counts.values, color=sns.color_palette("husl", len(category_counts)))

# 在柱状图上方添加数量标签
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height + 0.1,
             f'{height}', ha='center', va='bottom', fontproperties=font_prop)

plt.title('各类别新闻数量统计', fontproperties=font_prop, fontsize=16)
plt.xlabel('新闻类别', fontproperties=font_prop, fontsize=12)
plt.ylabel('数量', fontproperties=font_prop, fontsize=12)
plt.xticks(fontproperties=font_prop, fontsize=10)
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('./outputs/headline_analysis.png', dpi=300, bbox_inches='tight')
plt.show()

# 如果需要更详细的分析
print("\n每个类别的平均标题长度:")
print(df.groupby('类别')['标题长度'].mean().sort_values(ascending=False))