import sys
import os
import unittest
from unittest.mock import patch, MagicMock
import torch
from typing import Dict, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from eval.evaluate import (
    convert_ids_to_tags, 
    ner_evaluate, 
    ner_evaluate_batch,
    print_classification_report
)

# 示例标签映射
ID_TO_TAG_EXAMPLE: Dict[int, str] = {
    0: 'O', 
    1: 'B-PER', 
    2: 'I-PER', 
    3: 'B-LOC', 
    4: 'I-LOC',
    -100: '[PAD]' # seqeval 通常不关心 -100，但映射中可能存在
}

TAG_TO_ID_EXAMPLE: Dict[str, int] = {v: k for k, v in ID_TO_TAG_EXAMPLE.items() if k != -100}


class TestEvalFunctions(unittest.TestCase):

    def test_convert_ids_to_tags(self):
        id_sequences = [
            [1, 2, 0, 3, -100, -100], # B-PER, I-PER, O, B-LOC, PAD, PAD
            [0, 0, 3, 4, 4, 0]        # O, O, B-LOC, I-LOC, I-LOC, O
        ]
        expected_tags = [
            ['B-PER', 'I-PER', 'O', 'B-LOC'],
            ['O', 'O', 'B-LOC', 'I-LOC', 'I-LOC', 'O']
        ]
        result_tags = convert_ids_to_tags(id_sequences, ID_TO_TAG_EXAMPLE)
        self.assertEqual(result_tags, expected_tags)

        # 测试空输入
        self.assertEqual(convert_ids_to_tags([], ID_TO_TAG_EXAMPLE), [])
        # 测试包含空序列的输入
        self.assertEqual(convert_ids_to_tags([[]], ID_TO_TAG_EXAMPLE), [[]])
        # 测试只有 -100 的序列
        self.assertEqual(convert_ids_to_tags([[-100, -100]], ID_TO_TAG_EXAMPLE), [[]])


    @patch('eval.evaluate.f1_score')
    @patch('eval.evaluate.precision_score')
    @patch('eval.evaluate.recall_score')
    def test_ner_evaluate(self, mock_recall, mock_precision, mock_f1):
        true_sequences = [['B-PER', 'I-PER', 'O'], ['O', 'B-LOC']]
        pred_sequences = [['B-PER', 'O', 'O'], ['O', 'B-LOC']]
        
        # 配置 mock 返回值
        mock_f1.return_value = 0.5
        mock_precision.return_value = 0.6
        mock_recall.return_value = 0.4
        
        expected_metrics = {'f1': 0.5, 'precision': 0.6, 'recall': 0.4}
        result_metrics = ner_evaluate(true_sequences, pred_sequences)
        
        self.assertEqual(result_metrics, expected_metrics)
        # 验证 seqeval 函数被正确调用
        mock_f1.assert_called_once_with(true_sequences, pred_sequences)
        mock_precision.assert_called_once_with(true_sequences, pred_sequences)
        mock_recall.assert_called_once_with(true_sequences, pred_sequences)

    @patch('eval.evaluate.ner_evaluate') # Mock 内部调用的 ner_evaluate
    @patch('eval.evaluate.convert_ids_to_tags') # Mock 内部调用的 convert_ids_to_tags
    def test_ner_evaluate_batch(self, mock_convert, mock_ner_eval):
        # --- 模拟输入 ---
        mock_model = MagicMock()
        mock_dataloader = MagicMock()
        device = 'cpu'

        # 模拟批次数据
        batch1 = {
            'input_ids': torch.tensor([[101, 1, 2, 102, 0, 0], [101, 3, 4, 4, 102, 0]]), # 假设 101=CLS, 102=SEP, 0=PAD
            'attention_mask': torch.tensor([[1, 1, 1, 1, 0, 0], [1, 1, 1, 1, 1, 0]]),
            'labels': torch.tensor([[1, 2, 0, 3, -100, -100], [0, 0, 3, 4, 4, -100]]) # 真实标签ID
        }
        # 模拟模型输出 (logits) - 形状应为 (batch_size, seq_len, num_tags)
        # 这里 num_tags 假设为 5 (O, B-PER, I-PER, B-LOC, I-LOC)
        # 预测 ID: [[1, 0, 0, 3], [0, 3, 4, 0]]
        model_output1 = torch.rand(2, 6, 5) 
        model_output1[0, 0, 1] = 10 # Pred B-PER
        model_output1[0, 1, 0] = 10 # Pred O
        model_output1[0, 2, 0] = 10 # Pred O
        model_output1[0, 3, 3] = 10 # Pred B-LOC
        
        model_output1[1, 0, 0] = 10 # Pred O
        model_output1[1, 1, 3] = 10 # Pred B-LOC
        model_output1[1, 2, 4] = 10 # Pred I-LOC
        model_output1[1, 3, 4] = 10 # Pred I-LOC
        model_output1[1, 4, 0] = 10 # Pred O
        
        # 配置模拟对象的行为
        mock_dataloader.__iter__.return_value = iter([batch1]) # Dataloader 返回一个批次
        mock_dataloader.__len__.return_value = 1 # <--- 添加这一行，模拟 dataloader 的长度
        mock_model.return_value = model_output1 # 模型返回预测 logits
        
        # 模拟 convert_ids_to_tags 的返回值
        mock_true_tags = [['B-PER', 'I-PER', 'O', 'B-LOC'], ['O', 'O', 'B-LOC', 'I-LOC', 'I-LOC']]
        mock_pred_tags = [['B-PER', 'O', 'O', 'B-LOC'], ['O', 'B-LOC', 'I-LOC', 'I-LOC', 'O']]
        mock_convert.side_effect = [mock_true_tags, mock_pred_tags] # 第一次调用返回 true, 第二次返回 pred

        # 模拟 ner_evaluate 的返回值
        mock_metrics = {'f1': 0.7, 'precision': 0.8, 'recall': 0.6}
        mock_ner_eval.return_value = mock_metrics

        # --- 执行函数 ---
        results = ner_evaluate_batch(mock_model, mock_dataloader, device, ID_TO_TAG_EXAMPLE)

        # --- 断言 ---
        # 检查模型是否被调用
        mock_model.assert_called_once()
        call_args, call_kwargs = mock_model.call_args
        torch.testing.assert_close(call_args[0], batch1['input_ids'])
        torch.testing.assert_close(call_args[1], batch1['attention_mask'])

        # 检查 convert_ids_to_tags 是否被正确调用
        self.assertEqual(mock_convert.call_count, 2)
        # 第一次调用 (labels) - 提取有效部分 [[1, 2, 0, 3], [0, 0, 3, 4, 4]]
        expected_true_ids = [[1, 2, 0, 3], [0, 0, 3, 4, 4]]
        self.assertEqual(mock_convert.call_args_list[0][0][0], expected_true_ids)
        self.assertEqual(mock_convert.call_args_list[0][0][1], ID_TO_TAG_EXAMPLE)
        # 第二次调用 (predictions) - 提取有效部分 [[1, 0, 0, 3], [0, 3, 4, 4, 0]]
        expected_pred_ids = [[1, 0, 0, 3], [0, 3, 4, 4, 0]]
        self.assertEqual(mock_convert.call_args_list[1][0][0], expected_pred_ids)
        self.assertEqual(mock_convert.call_args_list[1][0][1], ID_TO_TAG_EXAMPLE)
        
        # 检查 ner_evaluate 是否被正确调用
        mock_ner_eval.assert_called_once_with(mock_true_tags, mock_pred_tags)

        # 检查返回结果结构和内容
        self.assertIn('loss', results)
        self.assertIsInstance(results['loss'], float)
        self.assertEqual(results['pred_sequences'], mock_pred_tags)
        self.assertEqual(results['true_sequences'], mock_true_tags)
        self.assertEqual(results['f1'], mock_metrics['f1'])
        self.assertEqual(results['precision'], mock_metrics['precision'])
        self.assertEqual(results['recall'], mock_metrics['recall'])

    @patch('eval.evaluate.classification_report')
    @patch('builtins.print') # Mock 内建的 print 函数
    def test_print_classification_report(self, mock_print, mock_report):
        true_sequences = [['B-PER', 'I-PER', 'O'], ['O', 'B-LOC']]
        pred_sequences = [['B-PER', 'O', 'O'], ['O', 'B-LOC']]
        
        # 配置 classification_report 的 mock 返回值
        report_string = "              precision    recall  f1-score   support\n\n         PER       0.50      1.00      0.67         1\n         LOC       1.00      1.00      1.00         1\n\n   micro avg       0.67      1.00      0.80         2\n   macro avg       0.75      1.00      0.83         2\nweighted avg       0.75      1.00      0.83         2\n"
        mock_report.return_value = report_string
        
        print_classification_report(true_sequences, pred_sequences)
        
        # 验证 classification_report 被正确调用
        mock_report.assert_called_once_with(true_sequences, pred_sequences)
        
        # 验证 print 被调用以打印报告
        # 我们检查 print 是否至少被调用了一次，并且其中一次调用包含报告字符串
        print_calls = mock_print.call_args_list
        self.assertTrue(any(report_string in call[0] for call in print_calls))
        self.assertTrue(any("\nClassification Report:\n" in call[0] for call in print_calls))


if __name__ == '__main__':
    unittest.main(argv=['first-arg-is-ignored'], exit=False) 