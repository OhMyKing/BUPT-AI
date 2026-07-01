#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
古文-现代文翻译对数据集划分脚本
将dataset.src和dataset.tgt按5%、75%、20%的比例划分为dev、train、test集
"""

import os
import random
from typing import List, Tuple

def read_file_lines(filepath: str) -> List[str]:
    """读取文件的所有行"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines()]
    return lines

def write_file_lines(filepath: str, lines: List[str]):
    """将行列表写入文件"""
    with open(filepath, 'w', encoding='utf-8') as f:
        for line in lines:
            f.write(line + '\n')

def split_data(src_lines: List[str], tgt_lines: List[str], 
               dev_ratio: float = 0.005, 
               train_ratio: float = 0.795, 
               test_ratio: float = 0.20) -> Tuple[List[Tuple[str, str]], List[Tuple[str, str]], List[Tuple[str, str]]]:
    """
    将数据按比例划分为dev、train、test集
    
    Args:
        src_lines: 源语言（古文）行列表
        tgt_lines: 目标语言（现代文）行列表
        dev_ratio: 开发集比例
        train_ratio: 训练集比例
        test_ratio: 测试集比例
    
    Returns:
        (dev_pairs, train_pairs, test_pairs): 三个数据集的句对列表
    """
    # 确保比例和为1
    assert abs(dev_ratio + train_ratio + test_ratio - 1.0) < 1e-6, "比例之和必须为1"
    
    # 确保两个文件行数相同
    assert len(src_lines) == len(tgt_lines), f"源文件和目标文件行数不匹配: {len(src_lines)} vs {len(tgt_lines)}"
    
    # 创建句对列表
    pairs = list(zip(src_lines, tgt_lines))
    
    # 随机打乱
    random.shuffle(pairs)
    
    # 计算各部分的大小
    total_size = len(pairs)
    dev_size = int(total_size * dev_ratio)
    train_size = int(total_size * train_ratio)
    
    # 划分数据
    dev_pairs = pairs[:dev_size]
    train_pairs = pairs[dev_size:dev_size + train_size]
    test_pairs = pairs[dev_size + train_size:]
    
    return dev_pairs, train_pairs, test_pairs

def save_split_data(base_dir: str, dev_pairs: List[Tuple[str, str]], 
                    train_pairs: List[Tuple[str, str]], 
                    test_pairs: List[Tuple[str, str]]):
    """
    保存划分后的数据集
    
    Args:
        base_dir: 基础目录
        dev_pairs: 开发集句对
        train_pairs: 训练集句对
        test_pairs: 测试集句对
    """
    # 创建输出目录（如果不存在）
    os.makedirs(base_dir, exist_ok=True)
    
    # 保存各个数据集
    for split_name, pairs in [('dev', dev_pairs), ('train', train_pairs), ('test', test_pairs)]:
        src_lines = [pair[0] for pair in pairs]
        tgt_lines = [pair[1] for pair in pairs]
        
        src_filepath = os.path.join(base_dir, f'{split_name}.src')
        tgt_filepath = os.path.join(base_dir, f'{split_name}.tgt')
        
        write_file_lines(src_filepath, src_lines)
        write_file_lines(tgt_filepath, tgt_lines)
        
        print(f"{split_name}集: {len(pairs)}个句对")
        print(f"  源文件: {src_filepath}")
        print(f"  目标文件: {tgt_filepath}")

def main():
    # 设置随机种子以保证可重复性
    random.seed(42)
    
    # 设置基础目录
    base_dir = "/root/BGE_finetuning/datas/dataset"
    
    # 输入文件路径
    src_filepath = os.path.join(base_dir, "dataset.src")
    tgt_filepath = os.path.join(base_dir, "dataset.tgt")
    
    print("正在读取数据文件...")
    print(f"源文件: {src_filepath}")
    print(f"目标文件: {tgt_filepath}")
    
    try:
        # 读取文件
        src_lines = read_file_lines(src_filepath)
        tgt_lines = read_file_lines(tgt_filepath)
        
        print(f"\n总共读取了 {len(src_lines)} 个句对")
        
        # 划分数据
        print("\n正在划分数据集...")
        dev_pairs, train_pairs, test_pairs = split_data(
            src_lines, tgt_lines,
            dev_ratio=0.005,
            train_ratio=0.795,
            test_ratio=0.20
        )
        
        # 保存划分后的数据
        print("\n正在保存数据集...")
        save_split_data(base_dir, dev_pairs, train_pairs, test_pairs)
        
        print("\n数据集划分完成！")
        print(f"\n统计信息:")
        print(f"开发集 : {len(dev_pairs)} 个句对")
        print(f"训练集 : {len(train_pairs)} 个句对")
        print(f"测试集 : {len(test_pairs)} 个句对")
        print(f"总计: {len(dev_pairs) + len(train_pairs) + len(test_pairs)} 个句对")
        
    except FileNotFoundError as e:
        print(f"\n错误：找不到输入文件 - {e}")
        print(f"请确保以下文件存在：")
        print(f"  - {src_filepath}")
        print(f"  - {tgt_filepath}")
    except AssertionError as e:
        print(f"\n错误：{e}")
    except Exception as e:
        print(f"\n发生错误：{e}")

if __name__ == "__main__":
    main()