import json
import re
import os
import sys
import pickle
from datetime import datetime
import argparse
import numpy as np
from tqdm import tqdm
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

class QwenModel:
    """Qwen模型的封装类"""
    def __init__(self, model_name="Qwen/Qwen2.5-1.5B-Instruct"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name, 
            torch_dtype=torch.float16, 
            device_map="auto"
        )
        
    def generate(self, prompt, max_new_tokens=128):
        """生成模型回答"""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_new_tokens=max_new_tokens,
                do_sample=False,  # 使用贪婪解码以获得确定性输出
                pad_token_id=self.tokenizer.eos_token_id,
            )
        
        response = self.tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        return response.strip()

def load_snli_dataset(file_path):
    """加载SNLI数据集
    
    SNLI格式示例:
    {
        "annotator_labels": ["neutral", "entailment", "neutral", "neutral", "neutral"],
        "captionID": "4705552913.jpg#2",
        "gold_label": "neutral",
        "pairID": "4705552913.jpg#2r1n",
        "sentence1": "Two women are embracing while holding to go packages.",
        "sentence1_binary_parse": "...",
        "sentence1_parse": "...",
        "sentence2": "The sisters are hugging goodbye while holding to go packages after just eating lunch.",
        "sentence2_binary_parse": "...",
        "sentence2_parse": "..."
    }
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = []
        for line in f:
            try:
                item = json.loads(line)
                # 确保包含关键字段
                if all(k in item for k in ["sentence1", "sentence2", "gold_label"]):
                    data.append(item)
            except json.JSONDecodeError:
                print(f"警告: 跳过无效的JSON行")
                continue
    
    print(f"加载了{len(data)}个样本")
    return data

def format_prompt(premise, hypothesis):
    """格式化提示，使模型更容易输出分类标签"""
    prompt = f"""你是一个专门判断文本蕴含关系的助手。给定一个前提句子和一个假设句子，你需要判断它们之间的关系。

前提(Premise): "{premise}"
假设(Hypothesis): "{hypothesis}"

请仔细分析前提和假设之间的关系，并从以下三个选项中选择一个：

1. entailment: 如果基于前提，假设一定为真，那么关系为"entailment"。
2. contradiction: 如果基于前提，假设一定为假，那么关系为"contradiction"。
3. neutral: 如果基于前提，无法确定假设的真假，那么关系为"neutral"。

你的判断 (entailment/contradiction/neutral):"""
    return prompt

def format_retry_prompt(premise, hypothesis):
    """当第一次提取失败时的重试提示，明确要求只输出一个词的答案"""
    prompt = f"""注意：请只返回一个单词作为答案！

判断以下两个句子之间的文本蕴含关系:

前提: "{premise}"
假设: "{hypothesis}"

判断标准:
- entailment: 如果根据前提，我们可以确定假设为真
- contradiction: 如果根据前提，我们可以确定假设为假
- neutral: 如果根据前提，我们无法确定假设的真假

您的回答必须是且仅是以下三个单词之一: entailment, contradiction, neutral

答案:"""
    return prompt

def extract_judgment(response):
    """从模型回答中提取蕴含关系判断"""
    # 转为小写以便匹配
    response_lower = response.lower().strip()
    
    # 如果回答非常简短，可能就是直接返回了标签
    if response_lower in ["entailment", "contradiction", "neutral"]:
        return response_lower
    
    # 查找最常见的完整匹配模式
    patterns = [
        # 英文关键词匹配
        r"\bjudgment\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\banswer\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\brelation\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\brelationship\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\s(entailment|contradiction|neutral)[.。]?$",  # 行尾的判断
        r"^(entailment|contradiction|neutral)[.。]?\s",  # 行首的判断
        r"[是为:：]\s*(entailment|contradiction|neutral)",
        r"选择\s*(entailment|contradiction|neutral)",
        r"判断[是为:：]\s*(entailment|contradiction|neutral)",
        r"关系[是为:：]\s*(entailment|contradiction|neutral)",
        r"结论[是为:：]\s*(entailment|contradiction|neutral)",
        r"答案[是为:：]\s*(entailment|contradiction|neutral)",
        # 中文表述匹配
        r"关系[是为:：]\s*[\"\'](.*?)[\"\']",
        # 冒号后的单词匹配
        r"[:：]\s*(entailment|contradiction|neutral)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, response_lower)
        if match:
            extracted = match.group(1).lower().strip()
            # 对于中文表述进行额外处理
            if "蕴含" in extracted or "推断" in extracted or "必然" in extracted:
                return "entailment"
            elif "矛盾" in extracted or "冲突" in extracted or "不可能" in extracted:
                return "contradiction"
            elif "中立" in extracted or "无法确定" in extracted or "可能" in extracted:
                return "neutral"
            elif extracted in ["entailment", "contradiction", "neutral"]:
                return extracted
    
    # 基于整个回答的内容判断
    if "entailment" in response_lower:
        return "entailment"
    elif "contradiction" in response_lower:
        return "contradiction"
    elif "neutral" in response_lower:
        return "neutral"
    
    # 匹配中文表述
    if any(term in response_lower for term in ["蕴含", "暗示", "推导", "必然", "一定成立", "肯定为真"]):
        return "entailment"
    elif any(term in response_lower for term in ["矛盾", "冲突", "相反", "不可能", "不成立", "不能同时为真"]):
        return "contradiction"
    elif any(term in response_lower for term in ["中立", "既不", "可能", "不确定", "无法判断", "不足以确定"]):
        return "neutral"
    
    # 如果所有提取方法都失败，返回None
    return None

def extract_judgment_advanced(response):
    """使用更高级的方法从模型回答中提取判断"""
    # 将文本分割成句子，以便更好地进行判断
    sentences = re.split(r'[.!?。！？]', response.lower())
    
    # 对每个句子单独评分
    label_scores = {
        "entailment": 0,
        "contradiction": 0,
        "neutral": 0
    }
    
    # 关键词词典，包括词和对应的权重
    keywords = {
        "entailment": {
            "entailment": 10, "implies": 5, "follows": 5, "must be true": 8, 
            "definitely true": 8, "necessarily": 5, "certain": 3, "guarantee": 5,
            "蕴含": 10, "推导": 5, "推断": 5, "必然": 8, "肯定为真": 8, "一定成立": 8,
            "必须为真": 8, "确保": 5, "肯定包含": 7, "能够推出": 6
        },
        "contradiction": {
            "contradiction": 10, "contradicts": 8, "conflicts": 5, "impossible": 8,
            "cannot be true": 8, "definitely false": 8, "incompatible": 7,
            "矛盾": 10, "冲突": 8, "不可能": 8, "不成立": 7, "不能同时为真": 8,
            "不一致": 6, "相反": 5, "否定": 6, "互斥": 7
        },
        "neutral": {
            "neutral": 10, "possibly": 5, "might": 3, "could": 3, "may": 3,
            "uncertain": 5, "insufficient": 7, "not enough information": 8,
            "中立": 10, "可能": 4, "或许": 3, "不一定": 6, "无法判断": 7,
            "信息不足": 8, "无法确定": 7, "既不蕴含也不矛盾": 9
        }
    }
    
    # 句子级别的评分
    for sentence in sentences:
        for label, word_weights in keywords.items():
            for word, weight in word_weights.items():
                if word in sentence:
                    label_scores[label] += weight
    
    # 查找是否有明确的判断表达式
    judgment_patterns = [
        (r"判断[是为:：]\s*(entailment|contradiction|neutral)", "group"),
        (r"关系[是为:：]\s*(entailment|contradiction|neutral)", "group"),
        (r"答案[是为:：]\s*(entailment|contradiction|neutral)", "group"),
        (r"[是为:：]\s*(entailment|contradiction|neutral)", "group"),
        (r"选择\s*(entailment|contradiction|neutral)", "group"),
        (r"(entailment|contradiction|neutral)\s*关系", "group"),
        (r"i choose\s*(entailment|contradiction|neutral)", "group"),
        (r"my answer is\s*(entailment|contradiction|neutral)", "group"),
        (r"the answer is\s*(entailment|contradiction|neutral)", "group"),
        (r"the relation is\s*(entailment|contradiction|neutral)", "group")
    ]
    
    for sentence in sentences:
        for pattern, match_type in judgment_patterns:
            match = re.search(pattern, sentence)
            if match:
                if match_type == "group":
                    label = match.group(1).lower()
                    if label in ["entailment", "contradiction", "neutral"]:
                        label_scores[label] += 20  # 给明确的判断表达非常高的权重
    
    # 对于结论句的分析
    conclusion_indicators = ["therefore", "thus", "hence", "so", "as a result", "consequently", "所以", "因此", "故", "总结", "综上所述"]
    for indicator in conclusion_indicators:
        for i, sentence in enumerate(sentences):
            if indicator in sentence and i < len(sentences) - 1:
                # 该句子之后的句子更可能包含最终答案
                next_sentence = sentences[i+1]
                for label in ["entailment", "contradiction", "neutral"]:
                    if label in next_sentence:
                        label_scores[label] += 15
    
    # 如果最高分至少为5分，则返回得分最高的标签
    max_score = max(label_scores.values())
    if max_score >= 5:
        max_labels = [label for label, score in label_scores.items() if score == max_score]
        if len(max_labels) == 1:  # 有明确的胜出者
            return max_labels[0]
    
    # 如果基于关键词的方法失败，尝试更严格的模式匹配
    for sentence in sentences:
        # 尝试找到最后的决定性陈述
        if "i will choose" in sentence or "my judgment is" in sentence or "my answer is" in sentence:
            if "entailment" in sentence:
                return "entailment"
            elif "contradiction" in sentence:
                return "contradiction"
            elif "neutral" in sentence:
                return "neutral"
    
    # 搜索发现频率非常高的短语
    high_confidence_phrases = {
        "entailment": [
            "the hypothesis necessarily follows from the premise",
            "the premise definitely implies the hypothesis",
            "given the premise, the hypothesis must be true",
            "基于前提，假设一定为真",
            "前提必然蕴含假设"
        ],
        "contradiction": [
            "the premise contradicts the hypothesis",
            "the premise and hypothesis cannot both be true",
            "given the premise, the hypothesis must be false",
            "前提与假设相矛盾",
            "前提和假设不能同时为真"
        ],
        "neutral": [
            "the premise neither implies nor contradicts the hypothesis",
            "based on the premise, the hypothesis could be either true or false",
            "there is not enough information to determine",
            "前提既不蕴含也不矛盾假设",
            "根据前提无法确定假设的真假"
        ]
    }
    
    for label, phrases in high_confidence_phrases.items():
        for phrase in phrases:
            if phrase in response.lower():
                return label
    
    # 如果所有方法都失败，返回None
    return None

def evaluate_model(model, dataset, output_dir="evaluation_results", checkpoint_interval=100, verbose=True, output_jsonl=True):
    """评估模型在SNLI任务上的表现
    
    Args:
        model: 模型对象
        dataset: SNLI数据集
        output_dir: 输出目录
        checkpoint_interval: 检查点间隔
        verbose: 是否在终端打印详细信息
        output_jsonl: 是否输出JSONL文件
    """
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 初始化结果数据
    true_labels = []
    predicted_labels = []
    responses = []
    metadata = []
    
    # 创建JSONL输出文件
    jsonl_output_file = None
    if output_jsonl:
        jsonl_output_path = os.path.join(output_dir, f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl")
        jsonl_output_file = open(jsonl_output_path, "w", encoding="utf-8")
        print(f"JSONL输出将保存到: {jsonl_output_path}")
    
    # 记录提取方法的使用情况
    extraction_methods = {
        "basic": 0,     # 基本提取方法成功
        "advanced": 0,  # 高级提取方法成功
        "retry": 0,     # 重试后成功
        "fallback": 0   # 所有方法都失败，使用默认值
    }
    
    # 从检查点恢复（如果存在）
    checkpoint_file = os.path.join(output_dir, "checkpoint.pkl")
    start_idx = 0
    
    if os.path.exists(checkpoint_file):
        print(f"正在从{checkpoint_file}加载检查点")
        with open(checkpoint_file, "rb") as f:
            checkpoint = pickle.load(f)
            true_labels = checkpoint.get("true_labels", [])
            predicted_labels = checkpoint.get("predicted_labels", [])
            responses = checkpoint.get("responses", [])
            metadata = checkpoint.get("metadata", [])
            extraction_methods = checkpoint.get("extraction_methods", extraction_methods)
            start_idx = checkpoint.get("next_idx", 0)
    
    # 处理数据集样本
    # 当前处理的样本索引
    current_idx = start_idx
    
    try:
        for i in tqdm(range(start_idx, len(dataset))):
            current_idx = i  # 更新当前索引，用于中断处理
            item = dataset[i]
            
            premise = item["sentence1"]
            hypothesis = item["sentence2"]
            gold_label = item["gold_label"]
            
            # 跳过没有金标签的样本
            if gold_label == "-":
                continue
            
            # 格式化提示
            prompt = format_prompt(premise, hypothesis)
            
            # 获取模型回答
            response = model.generate(prompt)
            
            # 从回答中提取判断
            extraction_method = "fallback"  # 默认为fallback
            predicted_label = extract_judgment(response)
            
            retry_response = None  # 初始化重试响应为None
            
            if predicted_label:
                extraction_method = "basic"
                extraction_methods["basic"] += 1
            else:
                # 尝试高级提取方法
                predicted_label = extract_judgment_advanced(response)
                
                if predicted_label:
                    extraction_method = "advanced"
                    extraction_methods["advanced"] += 1
                else:
                    # 尝试使用更明确的提示重试
                    retry_prompt = format_retry_prompt(premise, hypothesis)
                    retry_response = model.generate(retry_prompt)
                    predicted_label = extract_judgment(retry_response)
                    
                    if predicted_label:
                        extraction_method = "retry"
                        extraction_methods["retry"] += 1
                        # response = response + "\n\n[重试回答]\n" + retry_response  # 保持原始响应不变
                    else:
                        # 所有方法都失败，使用默认值（通常选择"neutral"）
                        extraction_methods["fallback"] += 1
                        predicted_label = "neutral"
                        # response = response + "\n\n[重试回答]\n" + retry_response + "\n\n[无法提取判断，使用默认值]"
            
            # 存储响应
            responses.append(response)
                
            # 存储结果
            true_labels.append(gold_label)
            predicted_labels.append(predicted_label)
            
            # 创建元数据
            item_metadata = {
                "premise": premise,
                "hypothesis": hypothesis,
                "item_id": item.get("pairID", str(i)),  # 使用pairID或者索引作为ID
                "extraction_method": extraction_method
            }
            metadata.append(item_metadata)
            
            # 写入JSONL日志
            if output_jsonl and jsonl_output_file:
                log_entry = {
                    "id": item.get("pairID", str(i)),
                    "premise": premise,
                    "hypothesis": hypothesis,
                    "gold_label": gold_label,
                    "predicted_label": predicted_label,
                    "is_correct": gold_label == predicted_label,
                    "extraction_method": extraction_method,
                    "model_response": response,
                }
                
                # 如果有重试响应，添加到日志中
                if retry_response:
                    log_entry["retry_response"] = retry_response
                
                # 写入JSONL文件
                jsonl_output_file.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
                jsonl_output_file.flush()  # 确保立即写入文件
                
                # 在终端打印简短信息（如果启用详细输出）
                if verbose:
                    # 截取模型响应的前50个字符作为预览
                    response_preview = response[:50].replace("\n", " ") + "..." if len(response) > 50 else response
                    print(f"样本 {i}: 标签={gold_label}, 预测={predicted_label}, 正确={gold_label == predicted_label}, 方法={extraction_method}")
                    print(f"  响应预览: {response_preview}")
            
            # 保存检查点
            if (i + 1) % checkpoint_interval == 0:
                print(f"在样本{i+1}处保存检查点")
                checkpoint = {
                    "true_labels": true_labels,
                    "predicted_labels": predicted_labels,
                    "responses": responses,
                    "metadata": metadata,
                    "extraction_methods": extraction_methods,
                    "next_idx": i + 1,
                    "timestamp": datetime.now().isoformat()
                }
                with open(checkpoint_file, "wb") as f:
                    pickle.dump(checkpoint, f)
    
    except KeyboardInterrupt:
        print("评估被中断。保存当前进度...")
        checkpoint = {
            "true_labels": true_labels,
            "predicted_labels": predicted_labels,
            "responses": responses,
            "metadata": metadata,
            "extraction_methods": extraction_methods,
            "next_idx": current_idx + 1,  # 使用更新的索引
            "timestamp": datetime.now().isoformat()
        }
        with open(checkpoint_file, "wb") as f:
            pickle.dump(checkpoint, f)
        print(f"检查点已保存到{checkpoint_file}")
        
        # 确保关闭JSONL文件
        if output_jsonl and jsonl_output_file:
            jsonl_output_file.close()
            
        raise
    
    # 关闭JSONL输出文件
    if output_jsonl and jsonl_output_file:
        jsonl_output_file.close()
    
    # 计算评估指标
    accuracy = accuracy_score(true_labels, predicted_labels)
    conf_matrix = confusion_matrix(true_labels, predicted_labels, labels=["entailment", "contradiction", "neutral"])
    class_report = classification_report(true_labels, predicted_labels, labels=["entailment", "contradiction", "neutral"])
    
    # 计算提取方法统计
    total_examples = len(true_labels)
    extraction_stats = {
        method: {"count": count, "percentage": count / total_examples * 100}
        for method, count in extraction_methods.items()
    }
    
    # 保存最终结果
    results = {
        "accuracy": accuracy,
        "confusion_matrix": conf_matrix,
        "classification_report": class_report,
        "true_labels": true_labels,
        "predicted_labels": predicted_labels,
        "responses": responses,
        "metadata": metadata,
        "extraction_methods": extraction_methods,
        "extraction_stats": extraction_stats,
        "timestamp": datetime.now().isoformat()
    }
    
    results_file = os.path.join(output_dir, f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl")
    with open(results_file, "wb") as f:
        pickle.dump(results, f)
    
    print(f"最终结果已保存到{results_file}")
    
    # 打印摘要
    print("\n评估摘要:")
    print(f"总样本数: {total_examples}")
    print(f"准确率: {accuracy:.4f}")
    print("\n提取方法统计:")
    for method, stats in extraction_stats.items():
        print(f"  {method}: {stats['count']}个样本 ({stats['percentage']:.2f}%)")
    print("\n混淆矩阵:")
    print(conf_matrix)
    print("\n分类报告:")
    print(class_report)
    
    return results

def analyze_results(results_file):
    """分析评估结果，找出常见问题和失败案例"""
    with open(results_file, "rb") as f:
        results = pickle.load(f)
    
    true_labels = results["true_labels"]
    predicted_labels = results["predicted_labels"]
    metadata = results["metadata"]
    
    # 整体准确率
    accuracy = accuracy_score(true_labels, predicted_labels)
    print(f"整体准确率: {accuracy:.4f}")
    
    # 按提取方法的性能
    methods = {}
    for i, method_info in enumerate(metadata):
        method = method_info["extraction_method"]
        if method not in methods:
            methods[method] = {"correct": 0, "total": 0}
        
        methods[method]["total"] += 1
        if true_labels[i] == predicted_labels[i]:
            methods[method]["correct"] += 1
    
    print("\n按提取方法的性能:")
    for method, stats in methods.items():
        accuracy = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        print(f"  {method}: {accuracy:.4f} ({stats['correct']}/{stats['total']})")
    
    # 查找提取失败的样本
    extraction_failures = []
    for i, method_info in enumerate(metadata):
        if method_info["extraction_method"] == "fallback":
            extraction_failures.append({
                "index": i,
                "premise": method_info["premise"],
                "hypothesis": method_info["hypothesis"],
                "gold_label": true_labels[i],
                "predicted_label": predicted_labels[i],
                "response": results["responses"][i]
            })
    
    if extraction_failures:
        print(f"\n找到{len(extraction_failures)}个提取失败的样本。")
        print("提取失败样本示例:")
        
        # 显示最多5个随机失败样本
        for failure in np.random.choice(extraction_failures, min(5, len(extraction_failures)), replace=False):
            print(f"\n前提: {failure['premise']}")
            print(f"假设: {failure['hypothesis']}")
            print(f"金标签: {failure['gold_label']}")
            print(f"模型回答: {failure['response']}")
    else:
        print("\n未找到提取失败的样本。")
    
    # 按金标签的性能
    label_performance = {}
    for i, label in enumerate(true_labels):
        if label not in label_performance:
            label_performance[label] = {"correct": 0, "total": 0}
        
        label_performance[label]["total"] += 1
        if label == predicted_labels[i]:
            label_performance[label]["correct"] += 1
    
    print("\n按金标签的性能:")
    for label, stats in label_performance.items():
        accuracy = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        print(f"  {label}: {accuracy:.4f} ({stats['correct']}/{stats['total']})")
    
    # 检查常见误分类
    misclassifications = {}
    for i in range(len(true_labels)):
        if true_labels[i] != predicted_labels[i]:
            pair = (true_labels[i], predicted_labels[i])
            if pair not in misclassifications:
                misclassifications[pair] = []
            
            misclassifications[pair].append(i)
    
    print("\n常见误分类:")
    for (true_label, pred_label), indices in misclassifications.items():
        print(f"  {true_label}被预测为{pred_label}: {len(indices)}个样本")
        
        if len(indices) > 0:
            # 显示一个随机示例
            idx = np.random.choice(indices)
            print(f"    示例:")
            print(f"    前提: {metadata[idx]['premise']}")
            print(f"    假设: {metadata[idx]['hypothesis']}")
            print(f"    模型回答: {results['responses'][idx][:100]}...")
    
    return results

def analyze_dataset(dataset):
    """分析SNLI数据集统计信息"""
    total = len(dataset)
    
    # 统计标签分布
    label_counts = {}
    for item in dataset:
        label = item["gold_label"]
        if label not in label_counts:
            label_counts[label] = 0
        label_counts[label] += 1
    
    print("数据集统计信息:")
    print(f"  总样本数: {total}")
    print("  标签分布:")
    for label, count in label_counts.items():
        print(f"    {label}: {count} ({count/total*100:.2f}%)")
    
    # 检查样本平均长度
    s1_lengths = [len(item["sentence1"].split()) for item in dataset]
    s2_lengths = [len(item["sentence2"].split()) for item in dataset]
    
    print(f"  前提(sentence1)平均词数: {sum(s1_lengths)/len(s1_lengths):.2f}")
    print(f"  假设(sentence2)平均词数: {sum(s2_lengths)/len(s2_lengths):.2f}")
    
    # 检查是否有标注者标签
    has_annotator_labels = all("annotator_labels" in item for item in dataset)
    if has_annotator_labels:
        # 检查标注者一致性
        agreement_counts = []
        for item in dataset:
            labels = item["annotator_labels"]
            # 计算众数
            mode_count = max([labels.count(l) for l in set(labels)])
            agreement = mode_count / len(labels)
            agreement_counts.append(agreement)
        
        avg_agreement = sum(agreement_counts) / len(agreement_counts)
        print(f"  标注者平均一致性: {avg_agreement:.4f}")
    
    # 显示几个随机样本
    print("\n随机样本示例:")
    for item in np.random.choice(dataset, min(3, len(dataset)), replace=False):
        print(f"  前提: {item['sentence1']}")
        print(f"  假设: {item['sentence2']}")
        print(f"  标签: {item['gold_label']}")
        print()
    
    return label_counts

def analyze_specific_samples(results, dataset, num_samples=5, error_only=True):
    """分析特定类型的样本表现，帮助理解模型行为"""
    true_labels = results["true_labels"]
    predicted_labels = results["predicted_labels"]
    metadata = results["metadata"]
    responses = results["responses"]
    
    # 找出错误样本的索引
    error_indices = [i for i, (true, pred) in enumerate(zip(true_labels, predicted_labels)) 
                    if (true != pred and error_only) or not error_only]
    
    if not error_indices:
        print("没有找到错误样本！")
        return
    
    # 随机选择样本
    sample_indices = np.random.choice(error_indices, min(num_samples, len(error_indices)), replace=False)
    
    print(f"\n分析{'错误' if error_only else '随机'}样本:")
    for idx in sample_indices:
        sample_info = metadata[idx]
        print(f"\n样本 #{idx}")
        print(f"前提: {sample_info['premise']}")
        print(f"假设: {sample_info['hypothesis']}")
        print(f"实际标签: {true_labels[idx]}")
        print(f"预测标签: {predicted_labels[idx]}")
        print(f"提取方法: {sample_info['extraction_method']}")
        print(f"模型响应摘要: {responses[idx][:300]}...")  # 只显示前300个字符
    
    # 分析每种类型的错误
    if error_only:
        error_pairs = {}
        for idx in error_indices:
            pair = (true_labels[idx], predicted_labels[idx])
            if pair not in error_pairs:
                error_pairs[pair] = 0
            error_pairs[pair] += 1
        
        print("\n错误类型分析:")
        for (true, pred), count in sorted(error_pairs.items(), key=lambda x: x[1], reverse=True):
            print(f"  将 {true} 误判为 {pred}: {count}个样本 ({count/len(error_indices)*100:.2f}%)")
        
        # 检查难度级别
        errors_by_method = {}
        for idx in error_indices:
            method = metadata[idx]["extraction_method"]
            if method not in errors_by_method:
                errors_by_method[method] = 0
            errors_by_method[method] += 1
        
        print("\n提取方法与错误的关系:")
        for method, count in sorted(errors_by_method.items(), key=lambda x: x[1], reverse=True):
            print(f"  使用{method}方法的错误: {count}个样本 ({count/len(error_indices)*100:.2f}%)")
    
    return error_indices

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="在SNLI数据集上评估Qwen2.5-1.5B-Instruct模型")
    parser.add_argument("--model", type=str, default="Qwen/Qwen2.5-1.5B-Instruct", 
                        help="模型名称或路径")
    parser.add_argument("--data", type=str, required=True, 
                        help="SNLI数据集文件路径")
    parser.add_argument("--output_dir", type=str, default="evaluation_results", 
                        help="保存结果的目录")
    parser.add_argument("--checkpoint_interval", type=int, default=100, 
                        help="每N个样本保存一次检查点")
    parser.add_argument("--analyze_only", type=str, default=None, 
                        help="仅分析给定的结果文件，不进行评估")
    parser.add_argument("--analyze_dataset", action="store_true",
                        help="仅分析数据集统计信息，不进行评估")
    parser.add_argument("--sample_size", type=int, default=None,
                        help="随机抽取的样本数量，用于快速测试")
    parser.add_argument("--analyze_samples", action="store_true",
                        help="分析具体样本表现")
    parser.add_argument("--num_samples", type=int, default=5,
                        help="分析时要显示的样本数量")
    parser.add_argument("--error_only", action="store_true", default=True,
                        help="只分析错误样本")
    parser.add_argument("--verbose", action="store_true", default=True,
                        help="在终端打印详细输出")
    parser.add_argument("--no_verbose", action="store_true",
                        help="不在终端打印详细输出")
    parser.add_argument("--output_jsonl", action="store_true", default=True,
                        help="输出详细结果到JSONL文件")
    parser.add_argument("--no_output_jsonl", action="store_true",
                        help="不输出详细结果到JSONL文件")
    
    args = parser.parse_args()
    
    # 处理verbose参数（--no_verbose优先级高于--verbose）
    verbose = args.verbose and not args.no_verbose
    
    # 处理output_jsonl参数（--no_output_jsonl优先级高于--output_jsonl）
    output_jsonl = args.output_jsonl and not args.no_output_jsonl
    
    if args.analyze_only:
        print(f"正在分析来自{args.analyze_only}的结果")
        results = None
        with open(args.analyze_only, "rb") as f:
            results = pickle.load(f)
        
        analyze_results(args.analyze_only)
        
        if args.analyze_samples and results:
            dataset = load_snli_dataset(args.data) if args.data else None
            analyze_specific_samples(
                results=results,
                dataset=dataset,
                num_samples=args.num_samples,
                error_only=args.error_only
            )
        return
    
    print(f"正在加载数据集: {args.data}")
    dataset = load_snli_dataset(args.data)
    
    # 过滤掉无标签的样本
    dataset = [item for item in dataset if item["gold_label"] != "-"]
    print(f"过滤后的样本数: {len(dataset)}")
    
    if args.analyze_dataset:
        analyze_dataset(dataset)
        return
    
    # 随机抽样
    if args.sample_size and args.sample_size < len(dataset):
        np.random.seed(42)  # 设置随机种子以保证可重复性
        dataset = np.random.choice(dataset, args.sample_size, replace=False).tolist()
        print(f"随机抽取了{len(dataset)}个样本进行评估")
    
    print(f"正在加载模型: {args.model}")
    model = QwenModel(args.model)
    
    print(f"开始评估{len(dataset)}个样本")
    print(f"详细输出: {'开启' if verbose else '关闭'}")
    print(f"JSONL输出: {'开启' if output_jsonl else '关闭'}")
    
    results = evaluate_model(
        model=model,
        dataset=dataset,
        output_dir=args.output_dir,
        checkpoint_interval=args.checkpoint_interval,
        verbose=verbose,
        output_jsonl=output_jsonl
    )
    
    print("评估完成!")
    
    # 如果需要，分析具体样本
    if args.analyze_samples:
        analyze_specific_samples(
            results=results,
            dataset=dataset,
            num_samples=args.num_samples,
            error_only=args.error_only
        )

if __name__ == "__main__":
    main()