import json
from typing import List, Dict, Any

from LLM_client import LLMProvider, LLMProviderFactory, ChatGLM4Provider

# 加载数据集
def load_dataset(file_path: str) -> List[Dict[str, Any]]:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

# 创建系统提示
def create_system_prompt(surface: str, bottom: str) -> str:
    return f"""
    你是一个专业的"海龟汤"游戏主持人。海龟汤是一种推理游戏，玩家只知道故事的开头（汤面），而你知道完整的故事（汤底）。玩家需要通过向你提问来推理出完整的故事。
    游戏规则
    1. 你只能回答"是"、"不是"或"这个问题与解谜无关"。
    2. 你不能透露任何未经玩家推理出的线索或信息。
    汤面

    ```
    {surface}
    ```

    汤底（玩家看不到）

    ```
    {bottom}
    ```

    回应指南
    * 保持中立和神秘感，不要通过回答暗示任何信息
    * 当玩家的问题含糊不清时，可以请他们澄清
    记住：你的回答必须简洁，仅限于"是"、"不是"或"这个问题与解谜无关"。
    """

# 分类LLM回答
def classify_response(response_text: str) -> str:
    response_text = response_text.strip().lower()
    
    # 检查"不是"模式
    if any(pattern in response_text for pattern in ["不是", "no", "不对", "错误", "不"]):
        return "不是"
    
    # 检查"是"模式
    elif any(pattern in response_text for pattern in ["是", "yes", "对", "正确", "没错"]):
        return "是"
    
    # 检查"无关"模式
    elif any(pattern in response_text for pattern in ["与解谜无关", "irrelevant", "不相关", "无关"]):
        return "这个问题与解谜无关"
    
    # 默认情况 - 需要更复杂的处理
    else:
        # 分析哪个回答最接近
        return "未分类"

# 清理并标准化期望答案
def normalize_expected_answer(expected_answer: str) -> str:
    """清理和标准化数据集中的期望答案，移除额外格式和标记"""
    # 移除常见的额外标记和格式
    answer = expected_answer.strip()
    answer = answer.replace('**', '').replace('\n', '')
    
    # 提取关键答案部分（例如从"**：是\n\n**"中提取"是"）
    if '：' in answer:
        answer = answer.split('：')[-1].strip()
    
    # 确保答案是标准格式
    if any(x in answer.lower() for x in ["不是", "no", "不对", "错误", "不"]):
        return "不是"
    elif any(x in answer.lower() for x in ["是", "yes", "对", "正确", "没错"]):
        return "是"
    elif any(x in answer.lower() for x in ["与解谜无关", "irrelevant", "不相关", "无关"]):
        return "这个问题与解谜无关"
    else:
        return answer  # 返回原始答案，如果无法分类

# 将数据集中的简短答案转换为更自然的回答
def format_answer_for_history(answer: str) -> str:
    # 首先标准化答案
    normalized_answer = normalize_expected_answer(answer)
    
    if normalized_answer == "是":
        return "是"
    elif normalized_answer == "不是":
        return "不是"
    else:
        return "这个问题与解谜无关"

# 主实验函数
def run_experiment(dataset_path: str, output_path: str, llm_provider: LLMProvider):
    # 确保LLM提供者已初始化
    llm_provider.initialize()
    
    # 加载数据集
    puzzles = load_dataset(dataset_path)
    
    results = []
    
    for puzzle in puzzles:
        puzzle_results = {
            "title": puzzle["title"],
            "surface": puzzle["surface"],
            "bottom": puzzle["bottom"],
            "questions": []
        }
        
        # 创建系统提示
        system_prompt = create_system_prompt(puzzle["surface"], puzzle["bottom"])
        
        # 处理思考链中的每个问题
        for round_idx, round_data in enumerate(puzzle["thought_chain"]["rounds"]):
            question = round_data["question"]
            expected_answer = round_data["answer"]
            
            # 构建前序对话记录
            conversation_history = []
            for prev_idx in range(round_idx):
                prev_question = puzzle["thought_chain"]["rounds"][prev_idx]["question"]
                prev_answer = puzzle["thought_chain"]["rounds"][prev_idx]["answer"]
                
                # 确保对话历史中使用的答案格式正确
                formatted_answer = format_answer_for_history(prev_answer)
                
                # 添加到对话历史
                conversation_history.append({"role": "user", "content": prev_question})
                conversation_history.append({"role": "assistant", "content": formatted_answer})
            
            # 使用LLM提供者发送问题，包含对话历史
            llm_response = llm_provider.ask_question(system_prompt, question, conversation_history)
            
            print(f"回合 {round_idx + 1}，问题：{question}")
            print(f"原始期望答案: {expected_answer}")
            print(f"标准化期望答案: {normalize_expected_answer(expected_answer)}")
            print(f"回答：{llm_response}")
            
            # 分类回答
            classified_response = classify_response(llm_response)
            
            # 标准化期望答案
            normalized_expected_answer = normalize_expected_answer(expected_answer)
            
            # 记录结果
            question_result = {
                "round": round_idx + 1,
                "question": question,
                "expected_answer": expected_answer,
                "normalized_expected_answer": normalized_expected_answer,
                "llm_response": llm_response,
                "classified_response": classified_response,
                "correct": classified_response == normalized_expected_answer,
                "conversation_history": [
                    {"role": m["role"], "content": m["content"]} 
                    for m in conversation_history if m["role"] == "user"
                ]  # 仅保存用户问题用于记录
            }
            
            puzzle_results["questions"].append(question_result)
        
        # 计算此谜题的准确率
        correct_count = sum(1 for q in puzzle_results["questions"] if q["correct"])
        total_questions = len(puzzle_results["questions"])
        puzzle_results["accuracy"] = correct_count / total_questions if total_questions > 0 else 0
        
        results.append(puzzle_results)
    
    # 计算总体准确率
    all_questions = [q for puzzle in results for q in puzzle["questions"]]
    overall_accuracy = sum(1 for q in all_questions if q["correct"]) / len(all_questions) if all_questions else 0
    
    # 保存结果
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "puzzles": results,
            "overall_accuracy": overall_accuracy
        }, f, ensure_ascii=False, indent=2)
    
    return overall_accuracy


# 使用示例
if __name__ == "__main__":
    # 创建Anthropic LLM提供者
    llm_provider = LLMProviderFactory.create_openai_provider(
        api_key="REDACTED_API_KEY",
        model='gpt-4o'
    )
    
    # 运行实验
    accuracy = run_experiment("thought_chains.json", "exp_2_gpt4o_results.json", llm_provider)
    print(f"整体准确率: {accuracy:.2%}")