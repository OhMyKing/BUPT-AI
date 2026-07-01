import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd

# Load results file
def load_results(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# Parse model and experiment info from filename
def parse_file_info(file_name):
    # 获取文件名（移除路径）
    file_name = file_name.split('/')[-1]
    
    # 对于以 "exp_1_" 或 "exp_2_" 开头的文件名
    if file_name.startswith("exp_"):
        parts = file_name.split('_', 2)  # 只分割前两个下划线
        exp_num = parts[1]  # 实验编号（1或2）
        
        # 处理模型名称部分（移除 "_analysis.json"）
        model_name_with_ext = parts[2]
        model_name = model_name_with_ext.replace("_analysis.json", "")
        
        return exp_num, model_name
    else:
        # 如果文件名格式不符合预期，返回默认值或错误处理
        raise ValueError(f"Unexpected file name format: {file_name}")

# Puzzle name mapping (Chinese to English)
puzzle_name_mapping = {
    "闺蜜": "Best Friends",
    "山顶": "Mountain Top",
    "午夜列车": "Midnight Train",
    "仪式": "Ceremony",
    "四岁的妈妈": "Four-Year-Old Mother",
    "海龟汤的故事": "Turtle Soup Story",
    "水草": "Seaweed",
    "粉色连衣裙的女人": "Woman in Pink Dress",
    "交换照片": "Photo Exchange",
    "马戏团": "Circus",
    "十八楼": "18th Floor",
    "条件": "Condition",
    "滑梯": "Slide",
    "视力": "Eyesight",
    "死刑犯跟恶魔": "Death Row Inmate and Demon",
    "数数": "Counting",
    "高跟鞋": "High Heels",
    "阳台上的女孩": "Girl on the Balcony",
    "半根火柴": "Half a Match",
    "一幅画": "A Painting",
    "隧道": "Tunnel",
    "电梯": "Elevator",
    "小红裙": "Little Red Dress",
    "新闻": "News",
    "洗衣机": "Washing Machine",
    "丢失的手机": "Lost Phone",
    "见家长": "Meeting Parents",
    "日记": "Diary",
    "伪造": "Forgery",
    "1237": "1237",
    "鱼": "Fish",
    "打折的零食": "Discounted Snacks"
}

# Answer category mapping
answer_mapping = {
    "是": "Yes",
    "不是": "No",
    "这个问题与解谜无关": "Irrelevant"
}

# Main function
def main():
    # Result files
    result_files = [
        "./analysis/exp_1_claude37_analysis.json",
        "./analysis/exp_1_glm4_analysis.json",
        "./analysis/exp_1_gpt4o_analysis.json",
        "./analysis/exp_1_qwen2.5-1.5B_analysis.json",
        "./analysis/exp_1_qwen2.5-1.5B_GRPO_finetune_analysis.json",
        "./analysis/exp_2_claude37_analysis.json",
        "./analysis/exp_2_glm4_analysis.json",
        "./analysis/exp_2_gpt4o_analysis.json",
        "./analysis/exp_2_qwen2.5-1.5B_analysis.json",
        "./analysis/exp_2_qwen2.5-1.5B_GRPO_finetune_analysis.json",
    ]
    
    # Load all results
    results = {}
    for file_path in result_files:
        exp_num, model_name = parse_file_info(file_path)
        key = f"{model_name}_exp{exp_num}"
        results[key] = load_results(file_path)
    
    # Set style
    sns.set(style="whitegrid")
    plt.rcParams.update({'font.size': 12})
    
    # Generate visualizations
    plot_model_accuracy_comparison(results)
    plot_f1_scores_comparison(results)
    plot_round_accuracy(results)
    plot_puzzle_performance(results)
    plot_confusion_matrices(results)

# 1. Model accuracy comparison
def plot_model_accuracy_comparison(results):
    models = ["claude37", "glm4", "gpt4o", "qwen2.5-1.5B", "qwen2.5-1.5B_GRPO_finetune"]
    model_display_names = {
        "claude37": "Claude 3.7", 
        "glm4": "ChatGLM4", 
        "gpt4o": "GPT-4o",
        "qwen2.5-1.5B": "Qwen2.5-1.5B",
        "qwen2.5-1.5B_GRPO_finetune": "Qwen2.5-1.5B (GRPO)"
    }
    
    exp1_acc = []
    exp2_acc = []
    
    for model in models:
        exp1_key = f"{model}_exp1"
        exp2_key = f"{model}_exp2"
        
        exp1_acc.append(results[exp1_key]["overall_accuracy"] * 100)
        exp2_acc.append(results[exp2_key]["overall_accuracy"] * 100)
    
    x = np.arange(len(models))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(14, 6))  # Increased width for more models
    rects1 = ax.bar(x - width/2, exp1_acc, width, label='Experiment 1 (No Context)')
    rects2 = ax.bar(x + width/2, exp2_acc, width, label='Experiment 2 (With Context)')
    
    # Add value labels
    for i, rect in enumerate(rects1):
        height = rect.get_height()
        ax.annotate(f'{height:.2f}%',
                   xy=(rect.get_x() + rect.get_width()/2, height),
                   xytext=(0, 3), textcoords="offset points",
                   ha='center', va='bottom')
    
    for i, rect in enumerate(rects2):
        height = rect.get_height()
        ax.annotate(f'{height:.2f}%',
                   xy=(rect.get_x() + rect.get_width()/2, height),
                   xytext=(0, 3), textcoords="offset points",
                   ha='center', va='bottom')
    
    # Add improvement percentage
    for i in range(len(models)):
        growth = exp2_acc[i] - exp1_acc[i]
        color = 'green' if growth > 0 else 'red'
        ax.annotate(f'{growth:+.2f}%',
                   xy=(i, max(exp1_acc[i], exp2_acc[i]) + 1),
                   color=color, ha='center', weight='bold')
    
    ax.set_ylabel('Accuracy (%)')
    ax.set_title('Model Accuracy Comparison Between Experiments')
    ax.set_xticks(x)
    ax.set_xticklabels([model_display_names[model] for model in models], rotation=15)  # Added rotation
    ax.legend()
    ax.set_ylim(50, 100)  # Set y-axis range to highlight differences
    
    plt.tight_layout()
    plt.savefig('model_accuracy_comparison.png', dpi=300)
    plt.close()

# 2. F1 scores comparison by class
def plot_f1_scores_comparison(results):
    models = ["claude37", "glm4", "gpt4o", "qwen2.5-1.5B", "qwen2.5-1.5B_GRPO_finetune"]
    model_display_names = {
        "claude37": "Claude 3.7", 
        "glm4": "ChatGLM4", 
        "gpt4o": "GPT-4o",
        "qwen2.5-1.5B": "Qwen2.5-1.5B",
        "qwen2.5-1.5B_GRPO_finetune": "Qwen2.5-1.5B (GRPO)"
    }
    experiments = ["exp1", "exp2"]
    
    # Create dataframe
    data = []
    for model in models:
        for exp in experiments:
            key = f"{model}_{exp}"
            f1_scores = results[key]["f1_scores"]["per_class"]
            for class_name, metrics in f1_scores.items():
                data.append({
                    "Model": model_display_names[model],
                    "Experiment": f"Experiment {exp[-1]}",
                    "Class": answer_mapping.get(class_name, class_name),
                    "F1 Score": metrics["f1"] * 100  # Convert to percentage
                })
    
    df = pd.DataFrame(data)
    
    # Create visualization
    plt.figure(figsize=(16, 8))  # Increased width
    chart = sns.catplot(
        data=df,
        kind="bar",
        x="Model", y="F1 Score", hue="Class", col="Experiment",
        palette="viridis", height=6, aspect=1.5  # Increased aspect ratio
    )
    
    # Set labels and titles
    chart.set_axis_labels("Model", "F1 Score (%)")
    chart.set_titles("{col_name}")
    chart.fig.suptitle("F1 Scores by Answer Category", y=1.05, fontsize=16)
    
    # Add value labels
    for ax in chart.axes.flat:
        # Rotate x-axis labels
        plt.setp(ax.get_xticklabels(), rotation=15, ha="right")
        for p in ax.patches:
            ax.annotate(f'{p.get_height():.1f}', 
                       (p.get_x() + p.get_width() / 2., p.get_height()), 
                       ha='center', va='bottom', 
                       xytext=(0, 5), textcoords='offset points',
                       fontsize=8)
    
    plt.tight_layout()
    plt.savefig('f1_scores_comparison.png', dpi=300)
    plt.close()

# 3. Accuracy by round number
def plot_round_accuracy(results):
    plt.figure(figsize=(14, 8))  # Increased width
    
    models = ["claude37", "glm4", "gpt4o", "qwen2.5-1.5B", "qwen2.5-1.5B_GRPO_finetune"]
    model_display_names = {
        "claude37": "Claude 3.7", 
        "glm4": "ChatGLM4", 
        "gpt4o": "GPT-4o",
        "qwen2.5-1.5B": "Qwen2.5-1.5B",
        "qwen2.5-1.5B_GRPO_finetune": "Qwen2.5-1.5B (GRPO)"
    }
    experiments = ["exp1", "exp2"]
    exp_styles = ['-', '--']
    markers = ['o', 's', '^', 'D', '*']  # Added more markers
    colors = ['blue', 'red', 'green', 'purple', 'orange']  # Added more colors
    
    for i, model in enumerate(models):
        for j, exp in enumerate(experiments):
            key = f"{model}_{exp}"
            round_data = results[key]["round_accuracy"]
            
            # Sort rounds
            rounds = sorted([int(r) for r in round_data.keys()])
            acc = [round_data[str(r)] * 100 for r in rounds]
            
            plt.plot(rounds, acc, color=colors[i], linestyle=exp_styles[j],
                     marker=markers[i], label=f"{model_display_names[model]} - Exp {exp[-1]}")
    
    plt.xlabel('Round Number')
    plt.ylabel('Accuracy (%)')
    plt.title('Accuracy Progression by Round')
    plt.grid(True)
    plt.legend(loc='lower right', fontsize=9)  # Smaller font for legend
    plt.xticks(range(1, 9))
    plt.ylim(30, 105)
    
    plt.tight_layout()
    plt.savefig('round_accuracy.png', dpi=300)
    plt.close()

# 4. Performance on selected puzzles
def plot_puzzle_performance(results, mode="all", batch_size=8):
    models = ["claude37", "glm4", "gpt4o", "qwen2.5-1.5B", "qwen2.5-1.5B_GRPO_finetune"]
    model_display_names = {
        "claude37": "Claude 3.7", 
        "glm4": "ChatGLM4", 
        "gpt4o": "GPT-4o",
        "qwen2.5-1.5B": "Qwen2.5-1.5B",
        "qwen2.5-1.5B_GRPO_finetune": "Qwen2.5-1.5B (GRPO)"
    }
    
    # 从结果中收集所有故事
    all_puzzles = []
    for model in models:
        for exp in ["exp1", "exp2"]:
            key = f"{model}_{exp}"
            if key in results and "puzzle_f1_scores" in results[key]:
                for puzzle in results[key]["puzzle_f1_scores"].keys():
                    if puzzle not in all_puzzles and puzzle.strip():  # 忽略空字符串
                        all_puzzles.append(puzzle)
    
    # 热图模式 - 创建所有故事的热图
    if mode == "all":
        # 准备热图数据
        heatmap_data = {}
        for puzzle in all_puzzles:
            puzzle_name = puzzle_name_mapping.get(puzzle, puzzle)
            heatmap_data[puzzle_name] = {}
            
            for model in models:
                for exp in ["exp1", "exp2"]:
                    key = f"{model}_{exp}"
                    column_name = f"{model_display_names[model]} - Exp {exp[-1]}"
                    
                    if key in results and "puzzle_f1_scores" in results[key] and puzzle in results[key]["puzzle_f1_scores"]:
                        micro_f1 = results[key]["puzzle_f1_scores"][puzzle]["micro_f1"] * 100
                        heatmap_data[puzzle_name][column_name] = micro_f1
                    else:
                        heatmap_data[puzzle_name][column_name] = float('nan')
        
        # 转换为DataFrame以便绘图
        heatmap_df = pd.DataFrame(heatmap_data).T
        
        # 绘制热图
        plt.figure(figsize=(16, len(all_puzzles) * 0.4))  # Increased width
        ax = sns.heatmap(
            heatmap_df, 
            annot=True, 
            fmt=".1f", 
            cmap="YlGnBu", 
            linewidths=0.5,
            cbar_kws={'label': 'Micro F1 Score (%)'}
        )
        
        # plt.title("所有故事的模型性能对比", fontsize=16)
        plt.tight_layout()
        plt.savefig('all_puzzle_performance_heatmap.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 创建模型平均性能条形图
        model_avg = {}
        for col in heatmap_df.columns:
            model_avg[col] = heatmap_df[col].mean()
        
        avg_df = pd.DataFrame(list(model_avg.items()), columns=['Model', 'Average F1'])
        
        plt.figure(figsize=(14, 6))  # Increased width
        chart = sns.barplot(x='Model', y='Average F1', data=avg_df, palette="deep")
        
        plt.title("Average Model Performance", fontsize=16)
        plt.xlabel("")
        plt.ylabel("Average Micro F1 (%)")
        plt.xticks(rotation=45, ha="right")
        
        # 添加数值标注
        for p in chart.patches:
            chart.annotate(f'{p.get_height():.1f}', 
                       (p.get_x() + p.get_width() / 2., p.get_height()), 
                       ha='center', va='bottom', 
                       xytext=(0, 5), textcoords='offset points',
                       fontsize=10)
        
        plt.tight_layout()
        plt.savefig('average_model_performance.png', dpi=300)
        plt.close()
    
    # 批处理模式 - 分批创建条形图
    elif mode == "batch":
        # 收集数据
        data = []
        for puzzle in all_puzzles:
            for model in models:
                for exp in ["exp1", "exp2"]:
                    key = f"{model}_{exp}"
                    if key in results and "puzzle_f1_scores" in results[key] and puzzle in results[key]["puzzle_f1_scores"]:
                        micro_f1 = results[key]["puzzle_f1_scores"][puzzle]["micro_f1"] * 100
                        data.append({
                            "Puzzle": puzzle_name_mapping.get(puzzle, puzzle),
                            "Model": model_display_names[model],
                            "Experiment": f"Experiment {exp[-1]}",
                            "Micro F1": micro_f1
                        })
        
        df = pd.DataFrame(data)
        
        # 按批次处理故事
        for i in range(0, len(all_puzzles), batch_size):
            batch_puzzles = [puzzle_name_mapping.get(p, p) for p in all_puzzles[i:i+batch_size]]
            batch_df = df[df["Puzzle"].isin(batch_puzzles)]
            
            plt.figure(figsize=(18, 10))  # Increased width
            
            chart = sns.catplot(
                data=batch_df,
                kind="bar",
                x="Puzzle", y="Micro F1", hue="Model", col="Experiment",
                palette="deep", height=5, aspect=1.5,  # Increased aspect ratio
                sharey=True
            )
            
            chart.set_axis_labels("故事", "Micro F1 分数 (%)")
            chart.set_titles("{col_name}")
            batch_num = i // batch_size + 1
            chart.fig.suptitle(f"故事性能对比 (批次 {batch_num})", y=1.05, fontsize=16)
            
            # 旋转x轴标签以防止重叠
            for ax in chart.axes.flat:
                plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
                # Use a smaller font size for the hue legend
                ax.legend(fontsize=8)
                for p in ax.patches:
                    ax.annotate(f'{p.get_height():.1f}', 
                               (p.get_x() + p.get_width() / 2., p.get_height()), 
                               ha='center', va='bottom', 
                               xytext=(0, 5), textcoords='offset points',
                               fontsize=7)  # Smaller font for annotations
            
            plt.tight_layout()
            plt.savefig(f'puzzle_performance_batch_{batch_num}.png', dpi=300, bbox_inches='tight')
            plt.close()
    
    # 选定模式 - 沿用原始图表风格，但可视化所有故事
    else:
        # 收集数据
        data = []
        for puzzle in all_puzzles:
            for model in models:
                for exp in ["exp1", "exp2"]:
                    key = f"{model}_{exp}"
                    if key in results and "puzzle_f1_scores" in results[key] and puzzle in results[key]["puzzle_f1_scores"]:
                        micro_f1 = results[key]["puzzle_f1_scores"][puzzle]["micro_f1"] * 100
                        data.append({
                            "Puzzle": puzzle_name_mapping.get(puzzle, puzzle),
                            "Model": model_display_names[model],
                            "Experiment": f"Experiment {exp[-1]}",
                            "Micro F1": micro_f1
                        })
        
        df = pd.DataFrame(data)
        
        plt.figure(figsize=(18, 10))  # Increased width
        
        chart = sns.catplot(
            data=df,
            kind="bar",
            x="Puzzle", y="Micro F1", hue="Model", col="Experiment",
            palette="deep", height=6, aspect=1.5,  # Increased aspect ratio
            sharey=True
        )
        
        chart.set_axis_labels("故事", "Micro F1 分数 (%)")
        chart.set_titles("{col_name}")
        chart.fig.suptitle("所有故事的性能对比", y=1.05, fontsize=16)
        
        # 旋转x轴标签以防止重叠
        for ax in chart.axes.flat:
            plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
            # Use a smaller font size for the hue legend
            ax.legend(fontsize=8)
            for p in ax.patches:
                ax.annotate(f'{p.get_height():.1f}', 
                           (p.get_x() + p.get_width() / 2., p.get_height()), 
                           ha='center', va='bottom', 
                           xytext=(0, 5), textcoords='offset points',
                           fontsize=7)  # Smaller font for annotations
        
        plt.tight_layout()
        plt.savefig('puzzle_performance.png', dpi=300, bbox_inches='tight')
        plt.close()

# 5. Confusion matrices visualization
def plot_confusion_matrices(results):
    models = ["claude37", "glm4", "gpt4o", "qwen2.5-1.5B", "qwen2.5-1.5B_GRPO_finetune"]
    model_display_names = {
        "claude37": "Claude 3.7", 
        "glm4": "ChatGLM4", 
        "gpt4o": "GPT-4o",
        "qwen2.5-1.5B": "Qwen2.5-1.5B",
        "qwen2.5-1.5B_GRPO_finetune": "Qwen2.5-1.5B (GRPO)"
    }
    experiments = ["exp1", "exp2"]
    
    # Create a more flexible grid layout for the additional models
    fig, axes = plt.subplots(len(models), len(experiments), figsize=(14, 25))  # Increased height
    
    for i, model in enumerate(models):
        for j, exp in enumerate(experiments):
            key = f"{model}_{exp}"
            cm = np.array(results[key]["confusion_matrix"])
            classes = [answer_mapping.get(c, c) for c in results[key]["confusion_matrix_classes"]]
            
            # Calculate percentages
            row_sums = cm.sum(axis=1, keepdims=True)
            # Avoid division by zero
            with np.errstate(divide='ignore', invalid='ignore'):
                cm_percent = np.divide(cm, row_sums, where=row_sums!=0) * 100
                cm_percent = np.nan_to_num(cm_percent)
            
            # Plot confusion matrix
            sns.heatmap(cm_percent, annot=cm, fmt='d', cmap="Blues", 
                       xticklabels=classes, yticklabels=classes,
                       ax=axes[i, j], cbar=False)
            
            axes[i, j].set_title(f"{model_display_names[model]} - Experiment {exp[-1]}")
            if i == len(models) - 1:
                axes[i, j].set_xlabel("Predicted")
            if j == 0:
                axes[i, j].set_ylabel("True")
    
    plt.tight_layout()
    plt.savefig('confusion_matrices.png', dpi=300)
    plt.close()
if __name__ == "__main__":
    main()