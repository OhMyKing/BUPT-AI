import ast
import gc
import os
import numpy as np
import torch
import torch.nn as nn
from TestLLM.utils.opt_utils import load_model_and_tokenizer
from TestLLM.utils.string_utils import load_conversation_template, autodan_SuffixManager
from TestLLM.utils.enhance_utils import enhanceAnswer
from TestLLM.assets.test_prefixes import test_prefixes
import time
import argparse
import pandas as pd
import json
from tqdm import tqdm
import random


def get_args():
    parser = argparse.ArgumentParser(description="Configs")
    parser.add_argument("--device", type=int, default=0)
    parser.add_argument("--universal", type=int, default=0)
    parser.add_argument("--model", type=str, default="llama2")
    parser.add_argument("--attack", type=str, default="autodan_hga")
    parser.add_argument("--path", type=str, default="./results/autodan_hga/llama2_0_normal.json")

    args = parser.parse_args()
    return args

def test_enhance_answer_by_aligner(path):
    # 打开原始的 JSON 文件
    with open(path, 'r') as f:
        data = json.load(f)
    
    # 获取目标文件夹的路径
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(path))))
    target_dir = os.path.join(base_dir, 'enhance_test', 'response')

    # 如果目标文件夹不存在，就创建它
    os.makedirs(target_dir, exist_ok=True)

    # 创建新的文件路径
    filename = os.path.basename(path).replace('.json', '_responses_using_aligner.json')
    save_path = os.path.join(target_dir, filename)
    
    total = sum(len(items) for items in data.values())
    enhanced_count = 0
    
    # 遍历 JSON 文件中的所有条目
    for key, items in data.items():
        for item in items:
            question = item['prompt'].replace('[REPLACE]', item['goal'])
            response = item['response']
            
            # 使用 aligner+ 方法改进 response
            enhanced_response = enhanceAnswer(question, response,'aligner+')
            # 更新 response
            item['response'] = enhanced_response
            enhanced_count += 1

            print(f"已处理 {enhanced_count}/{total} 条数据")
            
            # 将更新后的数据保存到新的 JSON 文件中
            with open(save_path, 'w') as json_file:
                json.dump(data, json_file, indent=4)
    
    
    print(f"已保存到: {save_path}")
    return save_path

if __name__ == '__main__':
    args = get_args()
    test_enhance_answer_by_aligner(args.path)