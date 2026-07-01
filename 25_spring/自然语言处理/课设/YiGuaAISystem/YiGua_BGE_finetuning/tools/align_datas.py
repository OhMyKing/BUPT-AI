import json
import random
import jieba
from typing import List, Tuple, Dict
import os

class WenyanAlignment:
    def __init__(self):
        # 初始化jieba分词器
        jieba.initialize()
        
    def read_files(self, src_path: str, tgt_path: str) -> Tuple[List[str], List[str]]:
        """读取源文件和目标文件"""
        with open(src_path, 'r', encoding='utf-8') as f:
            src_lines = [line.strip() for line in f.readlines()]
        
        with open(tgt_path, 'r', encoding='utf-8') as f:
            tgt_lines = [line.strip() for line in f.readlines()]
        
        assert len(src_lines) == len(tgt_lines), "源文件和目标文件行数不匹配"
        return src_lines, tgt_lines
    
    def segment_target(self, text: str) -> List[str]:
        """对现代文进行分词"""
        return list(jieba.cut(text))
    
    def find_proper_nouns(self, src_text: str, tgt_tokens: List[str]) -> Dict[int, bool]:
        """识别专有名词（在源文中完整出现的目标词）"""
        proper_noun_flags = {}
        for i, token in enumerate(tgt_tokens):
            if len(token) > 1 and token in src_text:
                proper_noun_flags[i] = True
            else:
                proper_noun_flags[i] = False
        return proper_noun_flags
    
    def calculate_similarity(self, char: str, token: str) -> float:
        """计算字符与词的相似度"""
        if char in token:
            return 1.0
        return 0.0
    
    def align_tokens(self, src_chars: List[str], tgt_tokens: List[str], 
                    proper_nouns: Dict[int, bool]) -> List[Tuple[int, int, str, str]]:
        """使用动态规划进行词对齐"""
        alignments = []
        m, n = len(src_chars), len(tgt_tokens)
        
        # 动态规划表
        dp = [[0.0] * (n + 1) for _ in range(m + 1)]
        path = [['' for _ in range(n + 1)] for _ in range(m + 1)]
        
        # 初始化
        for i in range(1, m + 1):
            dp[i][0] = dp[i-1][0] - 1
            path[i][0] = 'up'
        
        for j in range(1, n + 1):
            dp[0][j] = dp[0][j-1] - 1
            path[0][j] = 'left'
        
        # 填充动态规划表
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                # 跳过专有名词
                if proper_nouns.get(j-1, False):
                    dp[i][j] = dp[i][j-1] - 0.5
                    path[i][j] = 'left'
                    continue
                
                # 计算匹配分数
                match_score = 0
                if len(tgt_tokens[j-1]) == 2 and src_chars[i-1] in tgt_tokens[j-1]:
                    # 双音节词包含源字符
                    match_score = 2.0
                    # 位置奖励：如果位置相近，给予额外分数
                    position_diff = abs(i/m - j/n)
                    match_score += (1 - position_diff) * 0.5
                elif len(tgt_tokens[j-1]) == 1 and src_chars[i-1] == tgt_tokens[j-1]:
                    # 单字符完全匹配
                    match_score = 1.5
                
                # 三种选择：匹配、删除源字符、插入目标词
                scores = [
                    dp[i-1][j-1] + match_score,  # 匹配
                    dp[i-1][j] - 1,              # 删除源字符
                    dp[i][j-1] - 1               # 插入目标词
                ]
                
                max_idx = scores.index(max(scores))
                dp[i][j] = scores[max_idx]
                
                if max_idx == 0:
                    path[i][j] = 'diag'
                elif max_idx == 1:
                    path[i][j] = 'up'
                else:
                    path[i][j] = 'left'
        
        # 回溯找到对齐路径
        i, j = m, n
        while i > 0 and j > 0:
            if path[i][j] == 'diag':
                if not proper_nouns.get(j-1, False) and len(tgt_tokens[j-1]) == 2 and src_chars[i-1] in tgt_tokens[j-1]:
                    alignments.append((i-1, j-1, src_chars[i-1], tgt_tokens[j-1]))
                i -= 1
                j -= 1
            elif path[i][j] == 'up':
                i -= 1
            else:
                j -= 1
        
        # 反转对齐结果（因为是从后向前回溯的）
        alignments.reverse()
        return alignments
    
    def process_sentence_pair(self, src_sent: str, tgt_sent: str, replace_prob: float) -> Dict:
        """处理一对句子"""
        # 字符级切分源句子
        src_chars = list(src_sent)
        
        # 分词目标句子
        tgt_tokens = self.segment_target(tgt_sent)
        
        # 识别专有名词
        proper_nouns = self.find_proper_nouns(src_sent, tgt_tokens)
        
        # 进行对齐
        alignments = self.align_tokens(src_chars, tgt_tokens, proper_nouns)
        
        # 根据概率进行替换
        result_chars = src_chars.copy()
        replaced_alignments = []
        
        for src_idx, tgt_idx, src_char, tgt_token in alignments:
            if random.random() < replace_prob:
                result_chars[src_idx] = tgt_token
                replaced_alignments.append({
                    "src_idx": src_idx,
                    "src_char": src_char,
                    "tgt_idx": tgt_idx,
                    "tgt_token": tgt_token
                })
        
        return {
            "original": src_sent,
            "target": tgt_sent,
            "aligned_text": ''.join(result_chars),
            "alignments": alignments,
            "replaced_alignments": replaced_alignments,
            "replace_probability": replace_prob
        }
    
    def process_dataset(self, src_path: str, tgt_path: str, output_path: str):
        """处理整个数据集"""
        src_lines, tgt_lines = self.read_files(src_path, tgt_path)
        
        results = []
        
        for idx, (src_sent, tgt_sent) in enumerate(zip(src_lines, tgt_lines)):
            if not src_sent or not tgt_sent:
                continue
            
            # 创建句子级别的结果结构
            sentence_result = {
                "sentence_id": idx,
                "original": src_sent,
                "target": tgt_sent,
                "replacements": {}
            }
            
            # 为每个概率级别生成结果
            for prob_str, prob_val in [("30%", 0.3), ("50%", 0.5), ("70%", 0.7)]:
                result = self.process_sentence_pair(src_sent, tgt_sent, prob_val)
                sentence_result["replacements"][prob_str] = {
                    "aligned_text": result["aligned_text"],
                    "alignments": result["alignments"],
                    "replaced_alignments": result["replaced_alignments"],
                    "replacement_count": len(result["replaced_alignments"]),
                    "total_alignment_count": len(result["alignments"])
                }
            
            results.append(sentence_result)
        
        # 保存结果
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"处理完成！结果已保存到 {output_path}")
        print(f"总共处理了 {len(results)} 对句子")
        
        # 打印统计信息
        for prob_str in ["30%", "50%", "70%"]:
            total_alignments = sum(s["replacements"][prob_str]["total_alignment_count"] for s in results)
            total_replacements = sum(s["replacements"][prob_str]["replacement_count"] for s in results)
            print(f"\n{prob_str} 替换概率统计:")
            print(f"  总对齐数: {total_alignments}")
            print(f"  实际替换数: {total_replacements}")
            if total_alignments > 0:
                print(f"  实际替换率: {total_replacements/total_alignments:.2%}")


def main():
    # 设置文件路径
    src_path = "../datas/dataset/dev.src"
    tgt_path = "../datas/dataset/dev.tgt"
    output_path = "../datas/dataset/aligen_dev.json"
    
    # 创建对齐器实例并处理数据
    aligner = WenyanAlignment()
    aligner.process_dataset(src_path, tgt_path, output_path)
    
    # 展示一些示例结果
    with open(output_path, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    print("\n=== 示例结果 ===")
    if results:
        example = results[0]  # 取第一个句子作为示例
        print(f"\n句子ID: {example['sentence_id']}")
        print(f"原文: {example['original']}")
        print(f"译文: {example['target']}")
        
        for prob_str in ["30%", "50%", "70%"]:
            repl = example['replacements'][prob_str]
            print(f"\n--- {prob_str} 替换概率 ---")
            print(f"对齐后: {repl['aligned_text']}")
            print(f"替换数: {repl['replacement_count']} / {repl['total_alignment_count']}")
            if repl['replaced_alignments']:
                print(f"替换示例: {repl['replaced_alignments'][:2]}...")  # 只显示前2个


if __name__ == "__main__":
    main()