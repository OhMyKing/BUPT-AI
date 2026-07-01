# 导入必要的库
import random
import copy
import re
import os
import json
import numpy as np
import wandb
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pad_sequence
from transformers import AutoModelForCausalLM, AutoTokenizer
from tqdm import tqdm
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

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

def prepare_dataset(dataset):
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
    print("\n" + "="*50)
    print("EVALUATION ON", total, "EXAMPLES")
    print("="*50)

    for example in tqdm(eval_examples):
        # 获取提示和预期答案
        full_prompt = example["prompt"]
        expected = example["answer"]

        # 编码并生成响应
        inputs = tokenizer.encode(full_prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model.generate(
                inputs,
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

    # 恢复模型到训练模式
    model.train()
    return accuracy

# 定义奖励函数
def snli_reward(prompts, completions, answer, **kwargs):
    """SNLI任务的奖励函数，根据模型输出与标准答案的匹配程度分配奖励"""
    responses = [completion[0]['content'] for completion in completions]
    extracted = [extract_answer_from_model_output(r) for r in responses]
    rewards = []
    
    for r, a in zip(extracted, answer):
        if r is None:
            rewards.append(0.0)  # 如果无法提取判断，给予0奖励
        elif r == a:
            rewards.append(1.0)  # 如果判断正确，给予1.0的奖励
        else:
            rewards.append(0.0)  # 如果判断错误，给予0奖励
            
    return rewards

def format_reward(completions, **kwargs):
    """分配指定格式的奖励 - 奖励使用指定XML格式的回答"""
    responses = [completion[0]['content'] for completion in completions]
    rewards = []
    
    for response in responses:
        reward = 0.0
        
        # 检查是否包含<reasoning>和<answer>标签
        has_reasoning_tag = "<reasoning>" in response.lower() and "</reasoning>" in response.lower()
        has_answer_tag = "<answer>" in response.lower() and "</answer>" in response.lower()
        
        # 如果同时包含两个标签，给予基础奖励
        if has_reasoning_tag and has_answer_tag:
            reward = 0.2
            
            # 提取answer标签内容，检查格式是否正确
            try:
                answer_content = re.search(r'<answer>(.*?)</answer>', response, re.DOTALL | re.IGNORECASE)
                if answer_content:
                    answer_text = answer_content.group(1).strip().lower()
                    if answer_text in ["entailment", "contradiction", "neutral"]:
                        reward += 0.1  # 额外奖励正确格式的答案
            except:
                pass  # 如果提取失败，不给额外奖励
        
        rewards.append(reward)
    
    return rewards
    
def combined_reward(prompts, completions, answer):
    """结合准确性和格式奖励"""
    # 获取单独的奖励
    accuracy_scores = snli_reward(prompts=prompts, completions=completions, answer=answer)
    format_scores = format_reward(completions=completions)

    # 组合奖励
    combined_rewards = []
    for a_score, f_score in zip(accuracy_scores, format_scores):
        combined_rewards.append(a_score + f_score)

    return combined_rewards

# 核心GRPO函数
def selective_log_softmax(logits, input_ids):
    """计算特定词汇表中令牌的对数概率"""
    log_probs = nn.functional.log_softmax(logits, dim=-1)
    return log_probs.gather(dim=-1, index=input_ids.unsqueeze(-1)).squeeze(-1)

def compute_log_probs(model, input_ids, attention_mask, logits_to_keep):
    """计算一批令牌的对数概率"""
    logits = model(input_ids=input_ids, attention_mask=attention_mask).logits[:, :-1, :]
    input_ids = input_ids[:, 1:]  # 移除第一个令牌
    input_ids = input_ids[:, -logits_to_keep:]
    logits = logits[:, -logits_to_keep:, :]
    return selective_log_softmax(logits, input_ids)

def create_completion_mask(completion_ids, eos_token_id):
    """创建完成令牌的掩码，排除EOS令牌后的令牌"""
    is_eos = completion_ids == eos_token_id
    eos_idx = torch.full((is_eos.size(0),), is_eos.size(1), dtype=torch.long, device=completion_ids.device)
    mask_exists = is_eos.any(dim=1)
    eos_idx[mask_exists] = is_eos.int().argmax(dim=1)[mask_exists]
    sequence_indices = torch.arange(is_eos.size(1), device=completion_ids.device).expand(is_eos.size(0), -1)
    return (sequence_indices <= eos_idx.unsqueeze(1)).int()

def generate_completions(model, tokenizer, prompts, num_generations=4, max_completion_length=32):
    """为每个提示生成多个完成"""
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    inputs = tokenizer(prompts, return_tensors="pt", padding=True, padding_side="left")
    prompt_ids = inputs["input_ids"].to(device)
    prompt_mask = inputs["attention_mask"].to(device)
    
    prompt_length = prompt_ids.size(1)
    prompt_ids = prompt_ids.repeat_interleave(num_generations, dim=0)
    prompt_mask = prompt_mask.repeat_interleave(num_generations, dim=0)
    
    outputs = model.generate(
        prompt_ids,
        attention_mask=prompt_mask,
        max_new_tokens=max_completion_length,
        do_sample=True,
        temperature=1.0,
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id,
    )
    
    completion_ids = outputs[:, prompt_length:]
    completion_mask = create_completion_mask(completion_ids, tokenizer.eos_token_id)
    
    return prompt_ids, prompt_mask, completion_ids, completion_mask

def generate_rollout_data(model, ref_model, tokenizer, batch_samples, num_generations, max_completion_length):
    """生成GRPO展开数据，包括完成和对数概率"""
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    prompts = [sample["prompt"] if isinstance(sample, dict) else sample[0] for sample in batch_samples]
    answers = [sample["answer"] if isinstance(sample, dict) else sample[1] for sample in batch_samples]
    
    with torch.no_grad():
        prompt_ids, prompt_mask, completion_ids, completion_mask = generate_completions(
            model, tokenizer, prompts, num_generations, max_completion_length
        )
        input_ids = torch.cat([prompt_ids, completion_ids], dim=1)
        attention_mask = torch.cat([prompt_mask, completion_mask], dim=1)
        logits_to_keep = completion_ids.size(1)
        
        old_log_probs = compute_log_probs(model, input_ids, attention_mask, logits_to_keep)
        ref_log_probs = compute_log_probs(ref_model, input_ids, attention_mask, logits_to_keep)
    
    formatted_completions = [[{'content': tokenizer.decode(ids, skip_special_tokens=True)}] for ids in completion_ids]
    repeated_prompts = [p for p in prompts for _ in range(num_generations)]
    repeated_answers = [a for a in answers for _ in range(num_generations)]
    
    return {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
        "completion_mask": completion_mask,
        "old_log_probs": old_log_probs,
        "ref_log_probs": ref_log_probs,
        "formatted_completions": formatted_completions,
        "repeated_prompts": repeated_prompts,
        "repeated_answers": repeated_answers,
        "logits_to_keep": logits_to_keep,
        "batch_size": len(prompts),
        "num_generations": num_generations
    }

def grpo_loss(model, ref_model, rollout_data, tokenizer, reward_function, beta=0.01, epsilon=0.2):
    """计算用于更新策略模型的GRPO损失"""
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    input_ids = rollout_data["input_ids"]
    attention_mask = rollout_data["attention_mask"]
    completion_mask = rollout_data["completion_mask"]
    logits_to_keep = rollout_data["logits_to_keep"]
    old_log_probs = rollout_data["old_log_probs"]
    ref_log_probs = rollout_data["ref_log_probs"]
    
    token_log_probs = compute_log_probs(model, input_ids, attention_mask, logits_to_keep)
    ratio = torch.exp(token_log_probs - old_log_probs)
    
    rewards = torch.tensor(
        reward_function(prompts=rollout_data["repeated_prompts"], completions=rollout_data["formatted_completions"], answer=rollout_data["repeated_answers"]),
        dtype=torch.float32,
        device=device
    )
    
    batch_size = rollout_data["batch_size"]
    num_generations = rollout_data["num_generations"]
    rewards = rewards.view(batch_size, num_generations)
    avg_reward = rewards.mean().item()
    
    mean_rewards = rewards.mean(dim=1).repeat_interleave(num_generations)
    std_rewards = rewards.std(dim=1).repeat_interleave(num_generations)
    advantages = ((rewards.view(-1) - mean_rewards) / (std_rewards + 1e-4)).unsqueeze(1)
    
    surr1 = ratio * advantages
    surr2 = torch.clamp(ratio, 1 - epsilon, 1 + epsilon) * advantages
    surrogate_loss = torch.min(surr1, surr2)
    
    kl = torch.exp(ref_log_probs - token_log_probs) - (ref_log_probs - token_log_probs) - 1
    per_token_loss = surrogate_loss - beta * kl
    
    loss = -((per_token_loss * completion_mask).sum(dim=1) / (completion_mask.sum(dim=1) + 1e-8)).mean()
    
    return loss, avg_reward

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

def train_with_grpo(model, tokenizer, train_data, num_iterations=1, num_steps=500, batch_size=4,
                             num_generations=4, max_completion_length=32, beta=0.1,
                             learning_rate=5e-6, mu=3, epsilon=0.2, reward_function=None, device_ids=None):
    """使用GRPO算法的主要训练函数"""
    assert device_ids is not None and len(device_ids) > 1, "This code needs at least 2 GPU cores to run!"

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    # 使用DataParallel包装模型
    model = nn.DataParallel(model, device_ids=device_ids)
    print(f"Model wrapped with DataParallel across GPUs: {device_ids}")

    # 外循环: 迭代GRPO更新
    for iteration in range(num_iterations):
        print(f"\n迭代 {iteration+1}/{num_iterations}")

        # 创建参考模型(深拷贝)并设置为评估模式
        ref_model = copy.deepcopy(model.module)
        ref_model.eval()
        for param in ref_model.parameters():
            param.requires_grad = False
        print("参考模型已创建")

        # 为本次迭代重新初始化优化器
        optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)
        model.train()

        # 内循环: 训练步骤
        for step in range(num_steps):
            batch_samples = random.sample(train_data, batch_size)
            with torch.no_grad():
                rollout_data = generate_rollout_data(
                    model.module,
                    ref_model,
                    tokenizer,
                    batch_samples,
                    num_generations,
                    max_completion_length
                )
            for grpo_iter in range(mu):
                loss, avg_reward = grpo_loss(
                    model.module,
                    ref_model,
                    rollout_data,
                    tokenizer,
                    reward_function,
                    beta=beta,
                    epsilon=epsilon
                )
                optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.1)
                optimizer.step()
                
                # 记录到wandb
                wandb.log({
                    "loss": loss.item(),
                    "average_reward": avg_reward,
                    "iteration": iteration + 1,
                    "step": step + 1,
                    "grpo_iter": grpo_iter + 1
                })
                
                print(f"迭代 {iteration+1}/{num_iterations}, 步骤 {step+1}/{num_steps}, "
                      f"GRPO 迭代 {grpo_iter+1}/{mu}, 损失: {loss.item():.4f}, 奖励: {avg_reward:.4f}")
    
    return model.module

# 主函数
def main():
    """主函数"""
    # 设置随机种子
    set_random_seed(42)
    
    # 设置wandb环境变量
    os.environ["WANDB_API_KEY"] = "1b569debdf89741c15949ee272cbafe213125f01"
    os.environ["WANDB_PROJECT"] = "GRPO-Qwen-SNLI"
    
    # 设置设备
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {device}")
    
    # 检测可用GPU数量
    num_gpus = torch.cuda.device_count()
    print(f"检测到{num_gpus}个GPU")
    device_ids = list(range(num_gpus)) if num_gpus > 1 else None
    
    if not device_ids or len(device_ids) < 2:
        print("警告: 此脚本需要至少2个GPU才能运行!")
        return
    
    # 加载模型和tokenizer
    model_name = "Qwen/Qwen2.5-1.5B-Instruct"
    output_dir = "snli_model"
    
    print("正在下载模型...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16,
        device_map="auto"
    )
    print("模型已下载")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name, padding_side="left")
    tokenizer.pad_token = tokenizer.eos_token
    model.config.pad_token_id = tokenizer.eos_token_id
    model.config.eos_token_id = tokenizer.eos_token_id
    
    # 加载SNLI数据集
    print("正在加载SNLI数据集...")
    snli_data = load_snli_dataset("snli_1.0/snli_1.0_train.jsonl")
    
    # 准备数据集
    formatted_data = prepare_dataset(snli_data)
    random.shuffle(formatted_data)
    
    # 分割为训练集和验证集
    eval_size = min(500, int(len(formatted_data) * 0.05))  # 5%或最多500个样本用于评估
    eval_data = formatted_data[:eval_size]
    train_data = formatted_data[eval_size:]
    
    print(f"训练集大小: {len(train_data)}, 验证集大小: {len(eval_data)}")
    
    # 初始评估
    print("\n初始模型评估（微调前）:")
    pre_grpo_accuracy = evaluate_model(model, tokenizer, eval_data[:50], device)  # 仅评估前50个样本以节省时间
    print(f"微调前准确率: {pre_grpo_accuracy:.2f}%")
    
    # 优化模型内存
    model = optimize_model_memory(model)
    
    # 训练配置 - 针对SNLI任务调整
    training_config = {
        'num_iterations': 1,            # 外循环迭代次数
        'num_steps': 1000,              # 每次迭代的批次数
        'batch_size': 4,                # 每个批次的样本数
        'num_generations': 8,           # 每个提示生成的完成数
        'max_completion_length': 64,    # 生成的最大令牌长度
        'beta': 0.05,                   # KL惩罚系数
        'learning_rate': 2e-6,          # 学习率
        'mu': 2,                        # 每批的策略更新次数
        'epsilon': 0.1,                 # PPO截断参数
    }
    
    # 初始化Weights & Biases
    wandb.init(project=os.environ["WANDB_PROJECT"], reinit=True)
    print("Weights & Biases已初始化")
    
    # 开始GRPO训练
    print("\n开始使用GRPO进行强化学习微调...")
    model = train_with_grpo(
        model=model,
        tokenizer=tokenizer,
        train_data=train_data,
        reward_function=combined_reward,
        device_ids=device_ids,
        **training_config
    )
    
    wandb.finish()
    print("训练完成，wandb运行已结束")
    
    # 最终评估
    print("\n微调后的最终模型评估:")
    post_grpo_accuracy = evaluate_model(model, tokenizer, eval_data, device)
    print(f"微调后准确率: {post_grpo_accuracy:.2f}%")
    
    # 保存模型
    print("\n正在保存GRPO微调后的模型...")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"模型已保存至 {output_dir}")

if __name__ == "__main__":
    main()