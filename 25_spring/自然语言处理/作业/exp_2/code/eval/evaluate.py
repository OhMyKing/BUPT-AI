import torch
import numpy as np
from typing import Dict, List, Tuple
from seqeval.metrics import f1_score, precision_score, recall_score, classification_report

def convert_ids_to_tags(id_sequences: List[List[int]], id_to_tag: Dict[int, str]) -> List[List[str]]:
    """
    将ID序列列表转换为标签序列列表
    
    Args:
        id_sequences: ID序列的列表 (e.g., [[1, 2, 0], [3, 0, 0]])
        id_to_tag: ID到标签的映射
        
    Returns:
        标签序列的列表 (e.g., [['B-PER', 'I-PER', 'O'], ['B-LOC', 'O', 'O']])
    """
    tag_sequences = []
    for ids in id_sequences:
        # 过滤掉 -100 (通常用于填充或忽略的标签)
        tag_sequences.append([id_to_tag[id_] for id_ in ids if id_ != -100])
    return tag_sequences

def ner_evaluate(true_tag_sequences: List[List[str]], pred_tag_sequences: List[List[str]]) -> Dict[str, float]:
    """
    使用seqeval评估NER预测结果 (基于标签序列列表)
    
    Args:
        true_tag_sequences: 真实的标签序列列表
        pred_tag_sequences: 预测的标签序列列表
        
    Returns:
        包含评估指标的字典
    """
    # 直接使用seqeval计算指标
    f1 = f1_score(true_tag_sequences, pred_tag_sequences)
    precision = precision_score(true_tag_sequences, pred_tag_sequences)
    recall = recall_score(true_tag_sequences, pred_tag_sequences)
    
    return {
        'f1': f1,
        'precision': precision,
        'recall': recall
    }

def ner_evaluate_batch(model, dataloader, device, id_to_tag: Dict[int, str]):
    """
    在整个数据集上评估模型
    
    Args:
        model: 模型
        dataloader: 数据加载器
        device: 设备
        id_to_tag: ID到标签的映射
        
    Returns:
        包含评估结果的字典
    """
    model.eval()
    all_pred_ids: List[List[int]] = []
    all_label_ids: List[List[int]] = []
    total_loss = 0
    loss_fn = torch.nn.CrossEntropyLoss(ignore_index=-100)
    
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            # 模型前向传播
            outputs = model(input_ids, attention_mask)
            
            # 计算损失
            logits = outputs.reshape(-1, outputs.shape[-1])
            labels_flat = labels.reshape(-1)
            loss = loss_fn(logits, labels_flat)
            total_loss += loss.item()
            
            # 获取预测
            predictions = torch.argmax(outputs, dim=-1)
            
            # 收集每个序列的预测和标签 (根据attention_mask去除填充)
            for i in range(len(input_ids)):
                mask = attention_mask[i].bool()
                # 只保留有效部分（非填充）的ID
                pred_ids_seq = predictions[i][mask].cpu().tolist()
                label_ids_seq = labels[i][mask].cpu().tolist()
                
                all_pred_ids.append(pred_ids_seq)
                all_label_ids.append(label_ids_seq)
                
    # 计算平均损失
    avg_loss = total_loss / len(dataloader)
    
    # 将ID序列转换为标签序列
    true_sequences = convert_ids_to_tags(all_label_ids, id_to_tag)
    pred_sequences = convert_ids_to_tags(all_pred_ids, id_to_tag)
    
    # 计算指标
    metrics = ner_evaluate(true_sequences, pred_sequences)
    
    return {
        'loss': avg_loss,
        'pred_sequences': pred_sequences, # 返回标签序列以供后续使用
        'true_sequences': true_sequences,
        **metrics
    }

def print_classification_report(true_tag_sequences: List[List[str]], pred_tag_sequences: List[List[str]]):
    """
    打印分类报告 (基于标签序列列表)
    
    Args:
        true_tag_sequences: 真实的标签序列列表
        pred_tag_sequences: 预测的标签序列列表
    """
    report = classification_report(true_tag_sequences, pred_tag_sequences)
    print("\nClassification Report:\n")
    print(report)

def custom_ner_report(true_tags_sequences, pred_tags_sequences):
    """
    自定义命名实体识别评估报告，确保显示所有标签的指标
    
    Args:
        true_tags_sequences: 真实标签序列列表
        pred_tags_sequences: 预测标签序列列表
        
    Returns:
        详细的评估报告字符串
    """
    # 确保序列长度一致
    aligned_true = []
    aligned_pred = []
    for true_seq, pred_seq in zip(true_tags_sequences, pred_tags_sequences):
        min_len = min(len(true_seq), len(pred_seq))
        aligned_true.append(true_seq[:min_len])
        aligned_pred.append(pred_seq[:min_len])
    
    # 展平序列以便按标签统计
    flat_true = [tag for seq in aligned_true for tag in seq]
    flat_pred = [tag for seq in aligned_pred for tag in seq]
    
    # 获取所有唯一标签
    all_labels = sorted(set(flat_true + flat_pred))
    
    # 计算每个标签的TP, FP, FN
    stats = {}
    for label in all_labels:
        tp = sum(1 for t, p in zip(flat_true, flat_pred) if t == label and p == label)
        fp = sum(1 for t, p in zip(flat_true, flat_pred) if t != label and p == label)
        fn = sum(1 for t, p in zip(flat_true, flat_pred) if t == label and p != label)
        
        # 计算精确率、召回率和F1
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        support = sum(1 for t in flat_true if t == label)
        
        stats[label] = {
            'precision': precision,
            'recall': recall,
            'f1-score': f1,
            'support': support
        }
    
    # 计算总体指标
    total_true = len(flat_true)
    
    # 微平均（所有样本同等权重）
    total_tp = sum(1 for t, p in zip(flat_true, flat_pred) if t == p)
    micro_precision = micro_recall = total_tp / total_true
    micro_f1 = micro_precision  # 精确率=召回率时，F1 = 精确率 = 召回率
    
    # 宏平均（所有类别同等权重）
    macro_precision = sum(s['precision'] for s in stats.values()) / len(stats)
    macro_recall = sum(s['recall'] for s in stats.values()) / len(stats)
    macro_f1 = 2 * macro_precision * macro_recall / (macro_precision + macro_recall) if (macro_precision + macro_recall) > 0 else 0
    
    # 加权平均（按类别样本数加权）
    weighted_precision = sum(s['precision'] * s['support'] for s in stats.values()) / total_true
    weighted_recall = sum(s['recall'] * s['support'] for s in stats.values()) / total_true
    weighted_f1 = sum(s['f1-score'] * s['support'] for s in stats.values()) / total_true
    
    # 生成报告
    report = "                   精确率    召回率    F1值     样本数\n"
    report += "-" * 60 + "\n"
    
    for label in all_labels:
        s = stats[label]
        report += f"{label:18s} {s['precision']:.4f}    {s['recall']:.4f}    {s['f1-score']:.4f}    {s['support']}\n"
    
    report += "-" * 60 + "\n"
    report += f"{'micro avg':18s} {micro_precision:.4f}    {micro_recall:.4f}    {micro_f1:.4f}    {total_true}\n"
    report += f"{'macro avg':18s} {macro_precision:.4f}    {macro_recall:.4f}    {macro_f1:.4f}    {total_true}\n"
    report += f"{'weighted avg':18s} {weighted_precision:.4f}    {weighted_recall:.4f}    {weighted_f1:.4f}    {total_true}\n"
    
    return report

# 实现实体级别的评估（连续相同实体视为一个整体）
def entity_level_report(true_tags_sequences, pred_tags_sequences):
    """
    实体级别的评估报告，将连续的相同类型标签视为一个实体
    
    Args:
        true_tags_sequences: 真实标签序列列表
        pred_tags_sequences: 预测标签序列列表
    
    Returns:
        详细的实体级评估报告字符串
    """
    # 提取实体及其位置
    def extract_entities(tag_seq):
        entities = []
        current_entity = None
        current_type = None
        
        for i, tag in enumerate(tag_seq):
            if tag == 'O':
                if current_entity:
                    entities.append((current_type, tuple(current_entity)))
                    current_entity = None
                    current_type = None
            elif tag.startswith('B-'):
                if current_entity:
                    entities.append((current_type, tuple(current_entity)))
                current_type = tag[2:]  # 去掉 "B-" 前缀
                current_entity = [i]
            elif tag.startswith('I-'):
                type_name = tag[2:]  # 去掉 "I-" 前缀
                if current_entity and type_name == current_type:
                    current_entity.append(i)
                # 如果开始是I-，或者类型不匹配，忽略
        
        # 添加最后可能的实体
        if current_entity:
            entities.append((current_type, tuple(current_entity)))
            
        return entities
    
    # 提取所有序列中的实体
    true_entities = []
    pred_entities = []
    
    for true_seq, pred_seq in zip(true_tags_sequences, pred_tags_sequences):
        min_len = min(len(true_seq), len(pred_seq))
        true_entities.extend([(e[0], e[1], i) for i, e in enumerate(extract_entities(true_seq[:min_len]))])
        pred_entities.extend([(e[0], e[1], i) for i, e in enumerate(extract_entities(pred_seq[:min_len]))])
    
    # 获取所有实体类型
    all_types = sorted(set([e[0] for e in true_entities + pred_entities]))
    
    # 计算每种实体类型的TP, FP, FN
    stats = {}
    for entity_type in all_types:
        true_of_type = set((e[0], e[1], e[2]) for e in true_entities if e[0] == entity_type)
        pred_of_type = set((e[0], e[1], e[2]) for e in pred_entities if e[0] == entity_type)
        
        tp = len(true_of_type & pred_of_type)
        fp = len(pred_of_type - true_of_type)
        fn = len(true_of_type - pred_of_type)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        stats[entity_type] = {
            'precision': precision,
            'recall': recall,
            'f1-score': f1,
            'support': len(true_of_type)
        }
    
    # 添加"O"类型的统计（尽管在实体级评估中通常不关注它）
    o_count_true = sum(1 for seq in true_tags_sequences for tag in seq if tag == 'O')
    stats['O'] = {
        'precision': 1.0,  # 为O类型分配标准指标
        'recall': 1.0,
        'f1-score': 1.0,
        'support': o_count_true
    }
    all_types = ['O'] + all_types  # 将O加入类型列表首位
    
    # 计算总体指标
    total_support = sum(s['support'] for s in stats.values())
    
    # 宏平均（所有类别同等权重）
    macro_precision = sum(s['precision'] for s in stats.values()) / len(stats)
    macro_recall = sum(s['recall'] for s in stats.values()) / len(stats)
    macro_f1 = 2 * macro_precision * macro_recall / (macro_precision + macro_recall) if (macro_precision + macro_recall) > 0 else 0
    
    # 微平均（基于所有实体的TP, FP, FN总和）
    true_entities_set = set((e[0], e[1], e[2]) for e in true_entities)
    pred_entities_set = set((e[0], e[1], e[2]) for e in pred_entities)
    
    total_tp = len(true_entities_set & pred_entities_set)
    total_fp = len(pred_entities_set - true_entities_set)
    total_fn = len(true_entities_set - pred_entities_set)
    
    micro_precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
    micro_recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
    micro_f1 = 2 * micro_precision * micro_recall / (micro_precision + micro_recall) if (micro_precision + micro_recall) > 0 else 0
    
    # 加权平均
    weighted_precision = sum(s['precision'] * s['support'] for s in stats.values()) / total_support if total_support > 0 else 0
    weighted_recall = sum(s['recall'] * s['support'] for s in stats.values()) / total_support if total_support > 0 else 0
    weighted_f1 = sum(s['f1-score'] * s['support'] for s in stats.values()) / total_support if total_support > 0 else 0
    
    # 生成报告
    report = "==== 实体级评估报告 ====\n"
    report += "                   精确率    召回率    F1值     样本数\n"
    report += "-" * 60 + "\n"
    
    for entity_type in all_types:
        s = stats[entity_type]
        report += f"{entity_type:18s} {s['precision']:.4f}    {s['recall']:.4f}    {s['f1-score']:.4f}    {s['support']}\n"
    
    report += "-" * 60 + "\n"
    report += f"{'micro avg':18s} {micro_precision:.4f}    {micro_recall:.4f}    {micro_f1:.4f}    {total_support}\n"
    report += f"{'macro avg':18s} {macro_precision:.4f}    {macro_recall:.4f}    {macro_f1:.4f}    {total_support}\n"
    report += f"{'weighted avg':18s} {weighted_precision:.4f}    {weighted_recall:.4f}    {weighted_f1:.4f}    {total_support}\n"
    
    return report