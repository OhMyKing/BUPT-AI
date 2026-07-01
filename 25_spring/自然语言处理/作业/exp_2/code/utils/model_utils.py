import torch
import numpy as np
import random

def set_seed(seed):
    """设置随机种子以确保可重复性"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        
def get_transformer_mask(input_ids, padding_idx=0):
    """创建用于Transformer的注意力掩码"""
    # 掩码为1表示注意，0表示忽略
    return (input_ids != padding_idx).float().unsqueeze(1).unsqueeze(2)

def get_subsequent_mask(seq_len):
    """创建用于解码器自注意力的后续掩码"""
    # 下三角矩阵，防止模型看到未来的token
    mask = torch.triu(torch.ones((seq_len, seq_len)), diagonal=1).bool()
    return mask.unsqueeze(0)