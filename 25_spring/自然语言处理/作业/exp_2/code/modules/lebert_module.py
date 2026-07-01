import torch
import torch.nn as nn
import torch.optim as optim
from models.lexicon.lebert import LEBERT
from eval.evaluate import ner_evaluate_batch


class LEBERTModule:
    """用于NER任务的LEBERT模块"""

    def __init__(self, config, word_embedding, device, lr=1e-4, betas=(0.9, 0.98), eps=1e-9):
        """
        初始化LEBERT模块

        Args:
            config: 模型配置
            word_embedding: 预训练词嵌入
            device: 训练设备
            lr: 学习率
            betas: Adam优化器的beta参数
            eps: Adam优化器的epsilon参数
        """
        self.config = config
        self.device = device

        # 初始化LEBERT模型
        self.model = LEBERT(config, word_embedding).to(device)

        # 优化器
        # 为词嵌入和BERT参数使用不同的学习率
        bert_params = []
        lexicon_params = []

        # 将参数分为BERT参数和词汇适配器参数
        for name, param in self.model.named_parameters():
            if 'lexicon_adapter' in name or 'word_embedding' in name:
                lexicon_params.append(param)
            else:
                bert_params.append(param)

        # 创建优化器
        self.optimizer = optim.Adam([
            {'params': bert_params, 'lr': lr},
            {'params': lexicon_params, 'lr': lr * 10}  # 词汇相关参数使用更大的学习率
        ], betas=betas, eps=eps)

        # 损失函数
        self.criterion = nn.CrossEntropyLoss(ignore_index=-100)

    def train_step(self, batch):
        """
        执行一步训练

        Args:
            batch: 包含输入数据的批次

        Returns:
            损失值
        """
        self.model.train()
        self.optimizer.zero_grad()

        # 准备输入数据
        input_ids = batch['input_ids'].to(self.device)
        attention_mask = batch['attention_mask'].to(self.device) if 'attention_mask' in batch else None
        word_ids = batch['word_ids'].to(self.device) if 'word_ids' in batch else None
        word_mask = batch['word_mask'].to(self.device) if 'word_mask' in batch else None
        labels = batch['labels'].to(self.device)

        # 前向传播
        logits = self.model(input_ids, attention_mask, word_ids, word_mask)

        # 计算损失
        active_loss = attention_mask.view(-1) == 1
        active_logits = logits.view(-1, self.config.num_tags)[active_loss]
        active_labels = labels.view(-1)[active_loss]

        loss = self.criterion(active_logits, active_labels)

        # 反向传播和优化
        loss.backward()
        self.optimizer.step()

        return loss.item()

    def evaluate(self, dataloader, id_to_tag=None):
        """
        评估模型

        Args:
            dataloader: 数据加载器
            id_to_tag: ID到标签的映射字典

        Returns:
            评估结果字典
        """
        self.model.eval()

        # 使用通用评估函数评估
        return ner_evaluate_batch(self.model, dataloader, self.device, id_to_tag)

    def save_model(self, path):
        """
        保存模型到指定路径

        Args:
            path: 保存路径
        """
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'config': self.config
        }
        torch.save(checkpoint, path)

    def load_model(self, path, weights_only=False):
        """
        从指定路径加载模型

        Args:
            path: 加载路径
            weights_only: 是否只加载权重
        """
        # 显式添加TransformerConfig到安全全局对象列表
        try:
            from torch.serialization import add_safe_globals
            from models.config import TransformerConfig
            add_safe_globals([TransformerConfig])
        except (ImportError, AttributeError):
            pass  # 如果是较旧版本的PyTorch，这个函数可能不存在

        # 使用明确的weights_only=False来加载完整的模型（包括代码）
        checkpoint = torch.load(path, map_location=self.device, weights_only=False)

        self.model.load_state_dict(checkpoint['model_state_dict'])

        if not weights_only:
            try:
                self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
                self.config = checkpoint['config']
            except:
                print("Warning: Could not load optimizer state or config. Only model weights loaded.")