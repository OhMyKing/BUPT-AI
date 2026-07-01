import os
import numpy as np
from TestLLM.utils.enhance_utils import enhanceAnswer
import argparse
import pandas as pd
import json
from tqdm import tqdm


def get_args():
    parser = argparse.ArgumentParser(description="Configs")
    parser.add_argument("--device", type=int, default=0)
    parser.add_argument("--universal", type=int, default=0)
    parser.add_argument("--model", type=str, default="llama2")
    parser.add_argument("--attack", type=str, default="autodan_hga")
    parser.add_argument("--path", type=str, default="./results/autodan_hga/llama2_0_normal.json")

    args = parser.parse_args()
    return args

def test_enhance_answer_by_rule(path):
    # 打开原始的 JSON 文件
    with open(path, 'r') as f:
        data = json.load(f)
    
    # 获取目标文件夹的路径
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(path))))
    target_dir = os.path.join(base_dir, 'enhance_test', 'response')

    # 如果目标文件夹不存在，就创建它
    os.makedirs(target_dir, exist_ok=True)

    # 创建新的文件路径
    filename = os.path.basename(path).replace('.json', '_responses_using_rule.json')
    save_path = os.path.join(target_dir, filename)
    
    total = sum(len(items) for items in data.values())
    
    # 遍历 JSON 文件中的所有条目
    pbar = tqdm(total=total, desc="处理进度")
    for key, items in data.items():
        for item in items:
            question = item['prompt'].replace('[REPLACE]', item['goal'])
            response = item['response']
            
            # 使用 rule 方法改进 response
            enhanced_response = enhanceAnswer(question, response, 'rule')
            # 更新 response
            if 'sorry, i cannot assistant with you.' in enhanced_response:
                print('矫正一条回答')
            item['response'] = enhanced_response

            # 更新进度条
            pbar.update(1)

            # 保存到新的 JSON 文件中
            with open(save_path, 'w') as json_file:
                json.dump(data, json_file, indent=4)

    # 完成进度条
    pbar.close()
    print(f"已保存到: {save_path}")
    return save_path

if __name__ == '__main__':
    args = get_args()
    test_enhance_answer_by_rule(args.path)
    