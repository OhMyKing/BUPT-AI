import json
import anthropic
import os
import time
import re
import argparse
from tqdm import tqdm
from datetime import datetime

# Configuration
CONFIG = {
    "api_key": "REDACTED_API_KEY",
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 4000,
    "max_retries": 3,
    "retry_delay": 5,  # seconds
    "rate_limit": 3,    # seconds between API calls
    "min_rounds": 5,    # minimum number of rounds for a valid thought chain
    "max_rounds": 8,    # maximum number of rounds for a valid thought chain
}

# Initialize Anthropic client
def get_client():
    # Use API key from config or environment variable
    api_key = CONFIG["api_key"] or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("API key is not set in config or ANTHROPIC_API_KEY environment variable")
    return anthropic.Anthropic(api_key=api_key)

# System prompt template for structured response
SYSTEM_PROMPT = """
你将扮演一个正在解谜"海龟汤"游戏的玩家，展示完整的思考链（Chain of Thought）过程。海龟汤是一种推理游戏，玩家只知道故事开头（汤面），需要通过提问和逻辑推理来解开完整的故事（汤底）。

汤面（玩家知道的信息）
```
{surface}
```

汤底（玩家不知道但需要推理出的完整故事）
```
{bottom}
```

你的任务
作为一个优秀的海龟汤解谜者，你需要：
1. **从完全不知情的状态开始**：虽然你已知道汤底，但你需要模拟一个只知道汤面、通过提问逐步接近真相的玩家。
2. **展示完整思考过程**：呈现一个多轮的问答过程，每轮包含：
   * 你当前的思考和假设
   * 基于当前信息提出的问题
   * 假设的回答（"是"、"不是"或"这与解谜无关"）
   * 对这个回答的分析和推理
   * 更新后的理解和新的假设
3. **保持逻辑连贯性**：每个新问题都应基于之前获得的信息，展示渐进式的推理过程。
4. **结构化呈现**：清晰地标注每个思考阶段，使读者能够轻松跟随你的推理链路。
5. **最终解谜**：在经过5-8轮提问后，展示如何成功推理出完整的汤底。

请按照以下结构输出你的回答：

初始分析：
[在这里写出你对汤面的初步分析和可能的方向]

第1轮
当前理解：[写出你目前对谜题的理解]
问题：[提出一个问题]
回答：[是/不是/无关]
分析：[分析这个回答的含义]
更新理解：[更新你对谜题的理解]

第2轮
当前理解：[写出你目前对谜题的理解]
问题：[提出一个问题]
回答：[是/不是/无关]
分析：[分析这个回答的含义]
更新理解：[更新你对谜题的理解]

[继续5-8轮同样格式的推理]

最终推理：
综合分析：[综合所有已知信息进行分析]
验证性问题：[提出最终的验证性问题]
回答：是
结论：[写出完整的结论，解释整个谜底]

记住，你需要展示一个真实的、渐进式的推理过程，仿佛你真的在一步步解谜，而不是一开始就知道答案。每个问题都应该有明确的目的，帮助缩小可能性范围或验证特定假设。
"""

def parse_structured_response(text):
    """Parse the structured response using a more flexible pattern matching approach"""
    result = {}

    # Extract initial analysis
    initial_analysis_match = re.search(r'初始分析[:：]?\s*([\s\S]*?)(?=第1轮|第一轮|轮次1)', text)
    if initial_analysis_match:
        result['initial_analysis'] = initial_analysis_match.group(1).strip()
    else:
        # Fallback: try to find any content before the first round
        first_round_match = re.search(r'第1轮|第一轮|轮次1', text)
        if first_round_match:
            initial_content = text[:first_round_match.start()].strip()
            if initial_content:
                result['initial_analysis'] = initial_content

    # Extract rounds
    rounds = []

    # Try to identify all rounds by looking for patterns like "第X轮" or "轮次X"
    round_starts = []
    for i in range(1, 10):  # Look for up to 9 rounds
        patterns = [
            rf'第{i}轮\s*',
            rf'第{chinese_number(i)}轮\s*',
            rf'轮次{i}\s*'
        ]

        for pattern in patterns:
            matches = list(re.finditer(pattern, text))
            round_starts.extend([(i, match.start()) for match in matches])

    # Sort by position in text
    round_starts.sort(key=lambda x: x[1])

    # Process each round
    for i in range(len(round_starts)):
        round_num, start_pos = round_starts[i]

        # Determine end position (start of next round or final reasoning)
        if i < len(round_starts) - 1:
            end_pos = round_starts[i+1][1]
        else:
            final_reasoning_match = re.search(r'最终推理[:：]?|综合分析[:：]?', text)
            if final_reasoning_match:
                end_pos = final_reasoning_match.start()
            else:
                end_pos = len(text)

        round_text = text[start_pos:end_pos].strip()

        # Extract components of this round
        round_data = {}

        # Current understanding
        understanding_match = re.search(r'当前理解[:：]?\s*([\s\S]*?)(?=问题[:：]?|$)', round_text)
        if understanding_match:
            round_data['current_understanding'] = understanding_match.group(1).strip()

        # Question
        question_match = re.search(r'问题[:：]?\s*([\s\S]*?)(?=回答[:：]?|$)', round_text)
        if question_match:
            round_data['question'] = question_match.group(1).strip()

        # Answer
        answer_match = re.search(r'回答[:：]?\s*([\s\S]*?)(?=分析[:：]?|$)', round_text)
        if answer_match:
            round_data['answer'] = answer_match.group(1).strip()

        # Analysis
        analysis_match = re.search(r'分析[:：]?\s*([\s\S]*?)(?=更新理解[:：]?|$)', round_text)
        if analysis_match:
            round_data['analysis'] = analysis_match.group(1).strip()

        # Updated understanding
        updated_match = re.search(r'更新理解[:：]?\s*([\s\S]*)', round_text)
        if updated_match:
            round_data['updated_understanding'] = updated_match.group(1).strip()

        rounds.append(round_data)

    result['rounds'] = rounds

    # Extract final reasoning
    final_reasoning = {}
    final_reasoning_match = re.search(r'最终推理[:：]?\s*([\s\S]*)', text)

    if final_reasoning_match:
        final_text = final_reasoning_match.group(1).strip()

        # Extract components
        comprehensive_match = re.search(r'综合分析[:：]?\s*([\s\S]*?)(?=验证性问题[:：]?|$)', final_text)
        if comprehensive_match:
            final_reasoning['comprehensive_analysis'] = comprehensive_match.group(1).strip()

        verification_match = re.search(r'验证性问题[:：]?\s*([\s\S]*?)(?=回答[:：]?|$)', final_text)
        if verification_match:
            final_reasoning['verification_question'] = verification_match.group(1).strip()

        answer_match = re.search(r'回答[:：]?\s*([\s\S]*?)(?=结论[:：]?|$)', final_text)
        if answer_match:
            final_reasoning['answer'] = answer_match.group(1).strip()

        conclusion_match = re.search(r'结论[:：]?\s*([\s\S]*)', final_text)
        if conclusion_match:
            final_reasoning['conclusion'] = conclusion_match.group(1).strip()

    result['final_reasoning'] = final_reasoning

    return result

def chinese_number(n):
    """Convert Arabic number to Chinese number"""
    numbers = {
        1: "一", 2: "二", 3: "三", 4: "四", 5: "五",
        6: "六", 7: "七", 8: "八", 9: "九", 10: "十"
    }
    return numbers.get(n, str(n))

def validate_thought_chain(thought_chain):
    """Validate the thought chain structure and content with more lenient requirements"""
    if not thought_chain:
        return False, "Thought chain is empty"

    # Check for initial analysis - not critical but preferred
    if not thought_chain.get('initial_analysis'):
        print("Warning: Missing initial analysis")

    # Check for rounds
    rounds = thought_chain.get('rounds', [])
    if not rounds:
        return False, "No rounds found"

    if len(rounds) < CONFIG["min_rounds"]:
        print(f"Warning: Found {len(rounds)} rounds, fewer than the ideal minimum of {CONFIG['min_rounds']}")
        # Only fail validation if we have less than 3 rounds
        if len(rounds) < 3:
            return False, f"Too few rounds (found {len(rounds)}, absolute minimum is 3)"

    # Check each round for critical fields (question and answer at minimum)
    for i, round_data in enumerate(rounds):
        critical_fields = ['question', 'answer']
        for field in critical_fields:
            if not round_data.get(field):
                print(f"Warning: Missing {field} in round {i+1}")
                # If we're missing too many fields, the round might be invalid
                if len([f for f in round_data.keys() if round_data[f]]) < 2:
                    return False, f"Round {i+1} has insufficient content"

    # Check for final reasoning - some components are required
    final_reasoning = thought_chain.get('final_reasoning', {})
    if not final_reasoning:
        return False, "Missing final reasoning"

    # At minimum, we need a conclusion
    if not final_reasoning.get('conclusion'):
        print("Warning: Missing conclusion in final reasoning")
        # Check if any substantive content exists in final_reasoning
        if not any(final_reasoning.get(field) for field in ['comprehensive_analysis', 'verification_question']):
            return False, "Final reasoning lacks substantive content"

    return True, "Thought chain is valid"

def generate_thought_chain(client, story):
    """Generate a thought chain for a single story using Claude API with retries"""

    # Format the system prompt with the story details
    formatted_prompt = SYSTEM_PROMPT.format(
        surface=story["surface"],
        bottom=story["bottom"]
    )

    for attempt in range(CONFIG["max_retries"]):
        try:
            # Call Claude API to generate the thought chain
            message = client.messages.create(
                model=CONFIG["model"],
                max_tokens=CONFIG["max_tokens"],
                system=formatted_prompt,
                messages=[
                    {"role": "user", "content": f'为标题为"{story["title"]}"的海龟汤生成思考链。请按照系统提示中的标记格式输出。'}
                ]
            )

            # Get the response content
            response_content = message.content[0].text
            print(response_content)

            # Parse the structured response
            thought_chain = parse_structured_response(response_content)

            # Validate the thought chain
            is_valid, validation_message = validate_thought_chain(thought_chain)

            if is_valid:
                return thought_chain, None
            else:
                # If validation failed but we have more retries, try again
                if attempt < CONFIG["max_retries"] - 1:
                    print(f"Validation failed: {validation_message}, retrying ({attempt+1}/{CONFIG['max_retries']})...")
                    time.sleep(CONFIG["retry_delay"])
                    continue
                else:
                    # Return the invalid thought chain on the last attempt
                    return thought_chain, {"error": f"Validation failed: {validation_message}", "raw_response": response_content}

        except Exception as e:
            if attempt < CONFIG["max_retries"] - 1:
                print(f"API error: {str(e)}, retrying ({attempt+1}/{CONFIG['max_retries']})...")
                time.sleep(CONFIG["retry_delay"] * 2)  # Longer wait on API errors
                continue
            else:
                return None, {"error": str(e)}

    # This should not be reached, but just in case
    return None, {"error": "Maximum retries exceeded"}

def process_stories(input_file, output_file, start_index=0, end_index=None):
    """Process stories from input file and save results to output file"""

    # Initialize the API client
    client = get_client()

    # Load stories from JSON file
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            stories = json.load(f)
    except Exception as e:
        print(f"Error loading stories: {e}")
        return

    # Determine the range of stories to process
    if end_index is None or end_index > len(stories):
        end_index = len(stories)

    stories_to_process = stories[start_index:end_index]

    # Check if output file exists
    results = []
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                results = json.load(f)
                print(f"Loaded {len(results)} existing results from {output_file}")
        except Exception as e:
            print(f"Error loading existing results: {e}")

    # Create a log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"thought_chain_log_{timestamp}.txt"

    # Process stories
    success_count = 0
    error_count = 0

    for i, story in enumerate(tqdm(stories_to_process, desc="Processing stories")):
        story_index = start_index + i
        print(f"Processing story {story_index}/{end_index-1}: {story['title']}")

        # Check if this story has already been processed
        already_processed = False
        for existing_result in results:
            if existing_result.get("title") == story["title"]:
                print(f"Story '{story['title']}' already processed, skipping...")
                already_processed = True
                break

        if already_processed:
            continue

        # Generate thought chain
        thought_chain, error = generate_thought_chain(client, story)

        # Prepare the result
        result = {
            "title": story["title"],
            "surface": story["surface"],
            "bottom": story["bottom"],
            "thought_chain": thought_chain,
            "processed_at": datetime.now().isoformat()
        }

        # Add error information if any
        if error:
            result["error"] = error
            error_count += 1

            # Log error details
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"ERROR processing story '{story['title']}':\n")
                f.write(json.dumps(error, ensure_ascii=False, indent=2))
                f.write("\n\n")
        else:
            success_count += 1

        # Add result to results list
        results.append(result)

        # Save current progress
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        # Wait to avoid hitting API rate limits
        time.sleep(CONFIG["rate_limit"])

    print(f"Complete! Processed {len(stories_to_process)} stories.")
    print(f"Success: {success_count}, Errors: {error_count}")
    print(f"Results saved to {output_file}")
    print(f"Error log saved to {log_file}")

def main():
    process_stories("stories.json", "thought_chains_1.json", 5, None)

if __name__ == "__main__":
    main()