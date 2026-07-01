import json
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, f1_score, precision_score, recall_score
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any, Tuple

def load_experiment_results(file_path: str) -> Dict[str, Any]:
    """加载实验结果JSON文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        results = json.load(f)
    return results

def create_analysis_dataframe(results: Dict[str, Any]) -> pd.DataFrame:
    """将实验结果转换为DataFrame格式以便分析"""
    rows = []
    
    for puzzle in results["puzzles"]:
        for question in puzzle["questions"]:
            # 使用标准化的答案，如果有的话
            expected_answer = question.get("normalized_expected_answer", question["expected_answer"])
            
            rows.append({
                "puzzle_title": puzzle["title"],
                "round": question["round"],
                "question": question["question"],
                "expected": expected_answer,
                "predicted": question["classified_response"],
                "correct": question["correct"]
            })
    
    return pd.DataFrame(rows)

def calculate_f1_scores(df: pd.DataFrame) -> Dict[str, float]:
    """计算各类别的F1分数以及宏平均/微平均F1分数"""
    # 只使用有效分类的结果
    valid_categories = ["是", "不是", "这个问题与解谜无关"]
    df_filtered = df[df["predicted"] != "未分类"]
    df_filtered = df_filtered[df_filtered["expected"].isin(valid_categories)]
    
    if len(df_filtered) == 0:
        return {
            "per_class": {},
            "macro_f1": 0.0,
            "micro_f1": 0.0,
            "weighted_f1": 0.0
        }
    
    y_true = df_filtered["expected"].tolist()
    y_pred = df_filtered["predicted"].tolist()
    
    # 获取所有唯一类别
    classes = sorted(list(set(y_true) | set(y_pred)))
    
    # 计算各类别的F1分数
    f1_per_class = {}
    for cls in classes:
        # 将当前问题转化为二分类问题（当前类别 vs 其他类别）
        y_true_binary = [1 if y == cls else 0 for y in y_true]
        y_pred_binary = [1 if y == cls else 0 for y in y_pred]
        
        # 计算该类别的precision, recall和F1
        precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
        recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
        f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
        
        f1_per_class[cls] = {
            "precision": precision,
            "recall": recall,
            "f1": f1
        }
    
    # 计算宏平均F1（各类别F1的平均）
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    
    # 计算微平均F1（考虑类别不平衡）
    micro_f1 = f1_score(y_true, y_pred, average="micro", zero_division=0)
    
    # 计算加权F1（按类别频率加权）
    weighted_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    
    return {
        "per_class": f1_per_class,
        "macro_f1": macro_f1,
        "micro_f1": micro_f1,
        "weighted_f1": weighted_f1
    }

def create_confusion_matrix(df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
    """创建混淆矩阵"""
    # 只使用有效分类的结果
    valid_categories = ["是", "不是", "这个问题与解谜无关"]
    df_filtered = df[df["predicted"] != "未分类"]
    df_filtered = df_filtered[df_filtered["expected"].isin(valid_categories)]
    
    if len(df_filtered) == 0:
        return np.array([]), []
    
    y_true = df_filtered["expected"].tolist()
    y_pred = df_filtered["predicted"].tolist()
    
    # 获取所有唯一类别并排序
    classes = sorted(list(set(y_true) | set(y_pred)))
    
    # 计算混淆矩阵
    cm = confusion_matrix(y_true, y_pred, labels=classes)
    
    return cm, classes

def plot_confusion_matrix(cm: np.ndarray, classes: List[str], output_file: str = "confusion_matrix.png"):
    """可视化混淆矩阵"""
    plt.figure(figsize=(10, 8))
    
    # 绘制混淆矩阵热图
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=classes, yticklabels=classes)
    
    plt.xlabel("预测")
    plt.ylabel("实际")
    plt.title("混淆矩阵")
    
    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    plt.close()

def calculate_round_accuracy(df: pd.DataFrame) -> Dict[int, float]:
    """计算每一轮的平均正确率"""
    # 按轮次分组并计算每组的正确率
    round_accuracy = df.groupby("round")["correct"].mean().to_dict()
    return round_accuracy

def extract_error_cases(results: Dict[str, Any]) -> List[Dict[str, Any]]:
    """提取并格式化错误答案的信息"""
    error_cases = []
    
    for puzzle in results["puzzles"]:
        puzzle_title = puzzle["title"]
        puzzle_surface = puzzle["surface"]
        puzzle_bottom = puzzle["bottom"]
        
        for question in puzzle["questions"]:
            if not question["correct"]:
                # 使用标准化的答案，如果有的话
                expected_answer = question.get("normalized_expected_answer", question["expected_answer"])
                
                error_case = {
                    "puzzle_title": puzzle_title,
                    "puzzle_surface": puzzle_surface,
                    "puzzle_bottom": puzzle_bottom,
                    "round": question["round"],
                    "question": question["question"],
                    "expected_answer": expected_answer,
                    "llm_response": question["llm_response"],
                    "classified_response": question["classified_response"]
                }
                error_cases.append(error_case)
    
    return error_cases

def analyze_experiment_results(input_file: str, output_file: str):
    """分析实验结果并保存详细报告"""
    # 加载实验结果
    results = load_experiment_results(input_file)
    
    # 将结果转换为DataFrame
    df = create_analysis_dataframe(results)
    
    # 重新计算总正确率
    overall_accuracy = df["correct"].mean()
    
    # 计算F1分数
    f1_scores = calculate_f1_scores(df)
    
    # 创建混淆矩阵
    cm, classes = create_confusion_matrix(df)
    
    # 计算每轮的正确率
    round_accuracy = calculate_round_accuracy(df)
    
    # 计算每个谜题的F1分数
    puzzle_f1_scores = {}
    for puzzle_title in df["puzzle_title"].unique():
        puzzle_df = df[df["puzzle_title"] == puzzle_title]
        puzzle_f1_scores[puzzle_title] = calculate_f1_scores(puzzle_df)
    
    # 提取错误案例
    error_cases = extract_error_cases(results)
    
    # 创建分析报告
    analysis_report = {
        "overall_accuracy": overall_accuracy,
        "f1_scores": f1_scores,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_classes": classes,
        "round_accuracy": round_accuracy,
        "puzzle_f1_scores": puzzle_f1_scores,
        "error_cases": error_cases
    }
    
    # 保存分析报告
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(analysis_report, f, ensure_ascii=False, indent=2)
    
    return analysis_report

def print_analysis_report(report: Dict[str, Any]):
    """打印分析报告的主要结果"""
    print("===== 海龟汤实验分析报告 =====")
    print(f"总体准确率: {report['overall_accuracy']:.2%}")
    
    print("\n----- F1分数 -----")
    print(f"宏平均F1: {report['f1_scores']['macro_f1']:.4f}")
    print(f"微平均F1: {report['f1_scores']['micro_f1']:.4f}")
    print(f"加权F1: {report['f1_scores']['weighted_f1']:.4f}")
    
    print("\n各类别性能:")
    for cls, metrics in report['f1_scores']['per_class'].items():
        print(f"  {cls}:")
        print(f"    Precision: {metrics['precision']:.4f}")
        print(f"    Recall: {metrics['recall']:.4f}")
        print(f"    F1: {metrics['f1']:.4f}")
    
    print("\n----- 各轮次正确率 -----")
    rounds = sorted(report['round_accuracy'].keys())
    for r in rounds:
        print(f"轮次 {r}: {report['round_accuracy'][r]:.2%}")
    
    print("\n----- 错误案例 -----")
    print(f"错误数量: {len(report['error_cases'])}")
    for i, error in enumerate(report['error_cases']):
        print(f"\n错误 {i+1}:")
        print(f"标题: {error['puzzle_title']}")
        print(f"轮次: {error['round']}")
        print(f"汤面: {error['puzzle_surface']}")
        print(f"汤底: {error['puzzle_bottom']}")
        print(f"问题: {error['question']}")
        print(f"预期答案: {error['expected_answer']}")
        print(f"模型回答: {error['llm_response']}")
        print(f"分类回答: {error['classified_response']}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(base_dir, "results", "exp_2_qwen2.5-1.5B_GRPO_finetune_results.json")
    output_file = os.path.join(base_dir, "analysis", "exp_2_qwen2.5-1.5B_GRPO_finetune_analysis.json")
    
    # 运行分析
    report = analyze_experiment_results(input_file, output_file)
    
    # 打印报告
    print_analysis_report(report)

if __name__ == "__main__":
    main()
