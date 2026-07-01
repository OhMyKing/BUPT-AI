import torch
import torch.nn as nn
import torch.optim as optim
from models.transformer import Transformer
from eval.evaluate import ner_evaluate_batch

class NERModule:
    def __init__(self, config, device, lr=1e-4, betas=(0.9, 0.98), eps=1e-9):
        self.config = config
        self.device = device
        self.model = Transformer(config).to(device)
        self.optimizer = optim.Adam(
            self.model.parameters(), 
            lr=lr, 
            betas=betas, 
            eps=eps
        )
        self.criterion = nn.CrossEntropyLoss(ignore_index=-100)
        
    def train_step(self, batch):
        self.model.train()
        self.optimizer.zero_grad()
        
        input_ids = batch['input_ids'].to(self.device)
        attention_mask = batch['attention_mask'].to(self.device) if 'attention_mask' in batch else None
        labels = batch['labels'].to(self.device)
        
        logits = self.model(input_ids, attention_mask)
        
        # 调整维度以便计算损失 [batch, seq_len, num_tags] -> [batch * seq_len, num_tags]
        active_loss = attention_mask.view(-1) == 1
        active_logits = logits.view(-1, self.config.num_tags)[active_loss]
        active_labels = labels.view(-1)[active_loss]
        
        loss = self.criterion(active_logits, active_labels)
        loss.backward()
        self.optimizer.step()
        
        return loss.item()
    
    def evaluate(self, dataloader, id_to_tag=None):
        """使用eval模块的评估函数"""
        return ner_evaluate_batch(self.model, dataloader, self.device, id_to_tag)
    
    def save_model(self, path):
        """保存模型到指定路径"""
        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'config': self.config
        }
        torch.save(checkpoint, path)
    
    def load_model(self, path, weights_only=False):
        """从指定路径加载模型"""
        checkpoint = torch.load(path, weights_only=weights_only)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.config = checkpoint['config']