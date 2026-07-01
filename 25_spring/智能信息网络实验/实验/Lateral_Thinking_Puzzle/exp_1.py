import json
from typing import List, Dict, Any
from LLM_client import AnthropicProvider, ChatGLM4Provider, LLMProvider, LLMProviderFactory, OpenAIProvider

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

# 规范化答案函数，用于比较前处理字符串
def normalize_answer(answer: str) -> str:
    """规范化答案字符串，移除空白字符和换行符，以便进行准确比较"""
    if isinstance(answer, str):
        return answer.strip().lower()
    return str(answer).strip().lower()

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
            
            # 检查问题格式，跳过不正确格式的问题
            if not isinstance(question, str) or question.strip() == "":
                print(f"跳过空问题或无效问题，轮次: {round_idx + 1}")
                continue
                
            # 分离问题文本和实际问题
            # 有时问题可能包含背景信息或多个问题拼接在一起
            question_lines = question.strip().split('\n')
            actual_question = question_lines[-1] if question_lines else question
            
            # 使用LLM提供者发送问题
            llm_response = llm_provider.ask_question(system_prompt, actual_question)
            print(f"轮次 {round_idx + 1}: 问题: {actual_question}")
            print(f"LLM回应: {llm_response}")
            
            # 分类回答
            classified_response = classify_response(llm_response)
            
            # 规范化预期答案以便准确比较
            normalized_expected = normalize_answer(expected_answer)
            normalized_classified = normalize_answer(classified_response)
            
            # 记录结果
            question_result = {
                "round": round_idx + 1,
                "question": question,
                "expected_answer": expected_answer,
                "llm_response": llm_response,
                "classified_response": classified_response,
                "correct": normalized_classified == normalized_expected
            }
            
            print(f"预期答案: '{normalized_expected}', 分类答案: '{normalized_classified}', 正确: {question_result['correct']}")
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
    # llm_provider = ChatGLM4Provider(
    #     api_key="1448dbc3e83a048e308f9fe5b0cd4c91.MwQNmQVQ85R7yMc6"
    # )
    llm_provider = LLMProviderFactory.create_qwen25_local_provider()
    accuracy = run_experiment("thought_chains.json", "exp_1_gpt4o_results.json", llm_provider)
    print(f"整体准确率: {accuracy:.2%}")