# 导入必要的库
import random
import os
import json
import re
import numpy as np
import wandb
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoModelForCausalLM, AutoTokenizer, get_linear_schedule_with_warmup
from tqdm import tqdm

# 设置随机种子以确保实验可重复性
def set_random_seed(seed: int = 42):
    """设置随机种子以确保可重复性"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

# SNLI数据处理函数
def load_snli_dataset(file_path):
    """加载SNLI数据集"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = []
        for line in f:
            try:
                item = json.loads(line)
                # 确保包含关键字段
                if all(k in item for k in ["sentence1", "sentence2", "gold_label"]):
                    # 跳过没有金标签的样本
                    if item["gold_label"] != "-":
                        data.append(item)
            except json.JSONDecodeError:
                print(f"警告: 跳过无效的JSON行")
                continue
    
    print(f"加载了{len(data)}个样本")
    return data

# 定义提示模板
SYSTEM_PROMPT = """
请按照以下格式回答：
<reasoning>
分析前提和假设之间的关系。考虑以下几点:
1. 如果基于前提，假设一定为真，关系为"entailment"
2. 如果基于前提，假设一定为假，关系为"contradiction"
3. 如果基于前提，无法确定假设的真假，关系为"neutral"
</reasoning>
<answer>
entailment or contradiction or neutral
</answer>
"""

def build_prompt(messages):
    """构建提示字符串"""
    return "\n".join([msg["content"].strip() for msg in messages])

def format_snli_prompt(premise, hypothesis):
    """格式化SNLI提示"""
    prompt = build_prompt([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f'前提(Premise): "{premise}"\n假设(Hypothesis): "{hypothesis}"\n\n你的判断 (entailment/contradiction/neutral):'}
    ])
    return prompt

def format_snli_response(label):
    """根据标签生成规范的回答格式"""
    return f"""<reasoning>
让我分析前提和假设之间的关系。

分析过程：
- 前提内容描述的是事实情况
- 假设内容是我们需要判断的陈述
- 我需要确定假设在前提为真的前提下是必然为真、必然为假，还是无法确定

根据前提和假设内容，我认为关系是 {label}
</reasoning>
<answer>
{label}
</answer>"""

def extract_answer_from_model_output(text):
    """从模型输出中提取判断"""
    # 转为小写以便匹配
    response_lower = text.lower().strip()
    
    # 如果回答非常简短，可能就是直接返回了标签
    if response_lower in ["entailment", "contradiction", "neutral"]:
        return response_lower
    
    # 查找最常见的完整匹配模式
    patterns = [
        r"\bjudgment\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\banswer\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\brelation\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\brelationship\s*:?\s*(entailment|contradiction|neutral)\b",
        r"\s(entailment|contradiction|neutral)[.。]?$",
        r"^(entailment|contradiction|neutral)[.。]?\s",
        r"[是为:：]\s*(entailment|contradiction|neutral)",
        r"选择\s*(entailment|contradiction|neutral)",
        r"判断[是为:：]\s*(entailment|contradiction|neutral)",
        r"关系[是为:：]\s*(entailment|contradiction|neutral)",
        r"结论[是为:：]\s*(entailment|contradiction|neutral)",
        r"答案[是为:：]\s*(entailment|contradiction|neutral)",
        r"[:：]\s*(entailment|contradiction|neutral)"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, response_lower)
        if match:
            extracted = match.group(1).lower().strip()
            if extracted in ["entailment", "contradiction", "neutral"]:
                return extracted
    
    # 基于整个回答的内容判断
    if "entailment" in response_lower:
        return "entailment"
    elif "contradiction" in response_lower:
        return "contradiction"
    elif "neutral" in response_lower:
        return "neutral"
    
    # 如果所有提取方法都失败，返回None
    return None

# 创建SFT数据集类
class SNLIDataset(Dataset):
    def __init__(self, data, tokenizer, max_length=512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        
        # 创建输入和目标
        input_text = item["prompt"]
        target_text = format_snli_response(item["answer"])
        
        # 拼接输入和输出用于训练
        full_text = f"{input_text}{target_text}"
        
        # 编码
        encodings = self.tokenizer(full_text, max_length=self.max_length, padding="max_length", truncation=True, return_tensors="pt")
        input_ids = encodings["input_ids"].squeeze()
        attention_mask = encodings["attention_mask"].squeeze()
        
        # 创建标签（偏移输入ID）
        labels = input_ids.clone()
        
        # 计算提示部分的长度
        prompt_encodings = self.tokenizer(input_text, return_tensors="pt")
        prompt_length = prompt_encodings["input_ids"].size(1)
        
        # 将提示部分的标签设置为-100（在计算损失时忽略）
        labels[:prompt_length] = -100
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels
        }

def prepare_dataset(dataset, tokenizer):
    """准备SNLI数据集，格式化为训练所需的格式"""
    formatted_data = []
    for item in dataset:
        # 确保数据有效
        if item["gold_label"] != "-":
            premise = item["sentence1"]
            hypothesis = item["sentence2"]
            gold_label = item["gold_label"]
            
            prompt = format_snli_prompt(premise, hypothesis)
            
            formatted_example = {
                "prompt": prompt,
                "answer": gold_label
            }
            formatted_data.append(formatted_example)
    
    return formatted_data

def evaluate_model(model, tokenizer, eval_examples, device):
    """评估模型在SNLI任务上的表现"""
    model.eval()
    correct = 0
    total = len(eval_examples)
    all_predictions = []
    all_labels = []
    
    print("\n" + "="*50)
    print("EVALUATION ON", total, "EXAMPLES")
    print("="*50)

    for example in tqdm(eval_examples):
        # 获取提示和预期答案
        full_prompt = example["prompt"]
        expected = example["answer"]

        # 编码并生成响应
        inputs = tokenizer(full_prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model.generate(
                inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_new_tokens=128,
                temperature=0.7,
                num_return_sequences=1,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
            )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 提取答案并检查正确性
        predicted = extract_answer_from_model_output(response)
        if predicted is None:
            predicted = "neutral"  # 默认值
        
        all_predictions.append(predicted)
        all_labels.append(expected)
        
        is_correct = (predicted == expected)
        if is_correct:
            correct += 1

        # 打印评估详情
        if total <= 20 or correct <= 10:  # 仅打印少量样本或错误样本
            print("\nPrompt:")
            print(full_prompt)
            print("\nExpected Answer:")
            print(expected)
            print("\nModel Response:")
            print(response)
            print("\nExtracted Answer:")
            print(predicted)
            print("\nCorrect:", "✓" if is_correct else "✗")
            print("-"*50)

    # 计算并打印最终准确率
    accuracy = (correct / total) * 100
    print(f"\nAccuracy: {accuracy:.2f}% ({correct}/{total})")
    print("="*50)

    return accuracy

def optimize_model_memory(model):
    """优化模型以在训练期间使用更少的内存"""
    model.train()
    model.config.use_cache = False

    # 确保输入需要梯度
    if hasattr(model, "enable_input_require_grads"):
        model.enable_input_require_grads()
    else:
        def make_inputs_require_grad(module, input, output):
            output.requires_grad_(True)
        model.get_input_embeddings().register_forward_hook(make_inputs_require_grad)

    # 启用梯度检查点
    model.gradient_checkpointing_enable()

    return model

def train_with_sft(model, tokenizer, train_data, val_data, epochs=1, batch_size=4, 
                  learning_rate=5e-6, warmup_steps=100, device=None):
    """使用监督微调（SFT）训练模型"""
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    print(f"训练设备: {device}")
    
    # 准备数据集和数据加载器
    train_dataset = SNLIDataset(train_data, tokenizer)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    # 将模型移至设备
    model = model.to(device)
    
    # 优化器和调度器
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer, 
        num_warmup_steps=warmup_steps, 
        num_training_steps=total_steps
    )
    
    # 训练循环
    global_step = 0
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        
        print(f"\n===== Epoch {epoch+1}/{epochs} =====")
        progress_bar = tqdm(train_loader, desc=f"Training Epoch {epoch+1}")
        
        for batch in progress_bar:
            # 将批次移至设备
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            
            # 前向传播
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            epoch_loss += loss.item()
            
            # 反向传播和优化
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()
            
            # 更新进度条
            progress_bar.set_postfix({"loss": loss.item()})
            
            # 记录到wandb
            wandb.log({
                "train_loss": loss.item(),
                "learning_rate": scheduler.get_last_lr()[0],
                "epoch": epoch + 1,
                "global_step": global_step
            })
            
            global_step += 1
        
        # 在每个epoch结束时评估
        avg_epoch_loss = epoch_loss / len(train_loader)
        print(f"Epoch {epoch+1} - 平均损失: {avg_epoch_loss:.4f}")
        
        # 在验证集上评估
        if val_data:
            val_accuracy = evaluate_model(model, tokenizer, val_data[:100], device)  # 使用部分验证集加速评估
            wandb.log({"val_accuracy": val_accuracy, "epoch": epoch + 1})
    
    # 在完整验证集上进行最终评估
    if val_data:
        final_accuracy = evaluate_model(model, tokenizer, val_data, device)
        print(f"Final validation accuracy: {final_accuracy:.2f}%")
        wandb.log({"final_val_accuracy": final_accuracy})
    
    return model

# 主函数
def main():
    """主函数"""
    # 设置随机种子
    set_random_seed(42)
    
    # 设置wandb环境变量
    os.environ["WANDB_API_KEY"] = "1b569debdf89741c15949ee272cbafe213125f01"
    os.environ["WANDB_PROJECT"] = "SFT-Qwen-SNLI"
    
    # 设置设备
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {device}")
    
    # 加载模型和tokenizer
    model_name = "Qwen/Qwen2.5-1.5B-Instruct"
    output_dir = "snli_sft_model"
    
    print("正在下载模型...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16
    )
    print("模型已下载")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name, padding_side="left")
    
    # 确保tokenizer设置正确
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model.config.pad_token_id = tokenizer.pad_token_id
    
    # 加载SNLI数据集
    print("正在加载SNLI数据集...")
    snli_data = load_snli_dataset("snli_1.0/snli_1.0_train.jsonl")
    
    # 准备数据集
    formatted_data = prepare_dataset(snli_data, tokenizer)
    random.shuffle(formatted_data)
    
    # 分割为训练集和验证集
    eval_size = min(500, int(len(formatted_data) * 0.05))  # 5%或最多500个样本用于评估
    eval_data = formatted_data[:eval_size]
    train_data = formatted_data[eval_size:]
    
    print(f"训练集大小: {len(train_data)}, 验证集大小: {len(eval_data)}")
    
    # 初始评估
    print("\n初始模型评估（微调前）:")
    pre_sft_accuracy = evaluate_model(model, tokenizer, eval_data[:50], device)  # 仅评估前50个样本以节省时间
    print(f"微调前准确率: {pre_sft_accuracy:.2f}%")
    
    # 优化模型内存
    model = optimize_model_memory(model)
    
    # 训练配置 - 针对SFT调整
    training_config = {
        'epochs': 3,                # 训练轮数
        'batch_size': 4,            # 批次大小
        'learning_rate': 1e-5,      # 学习率
        'warmup_steps': 100,        # 预热步骤数
        'device': device            # 训练设备
    }
    
    # 初始化Weights & Biases
    wandb.init(project=os.environ["WANDB_PROJECT"], reinit=True)
    print("Weights & Biases已初始化")
    
    # 开始SFT训练
    print("\n开始SFT监督微调...")
    model = train_with_sft(
        model=model,
        tokenizer=tokenizer,
        train_data=train_data,
        val_data=eval_data,
        **training_config
    )
    
    wandb.finish()
    print("训练完成，wandb运行已结束")
    
    # 最终评估
    print("\n微调后的最终模型评估:")
    post_sft_accuracy = evaluate_model(model, tokenizer, eval_data, device)
    print(f"微调后准确率: {post_sft_accuracy:.2f}%")
    
    # 保存模型
    print("\n正在保存SFT微调后的模型...")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"模型已保存至 {output_dir}")

if __name__ == "__main__":
    main()