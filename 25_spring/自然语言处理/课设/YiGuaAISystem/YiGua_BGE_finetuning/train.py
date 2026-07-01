"""
BAAI/bge-large-zh-v1.5 微调脚本
支持从JSONL格式数据加载正负例，使用对比学习进行微调
集成wandb记录训练过程，每个epoch进行评估
"""

import json
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    AutoModel, 
    AutoTokenizer, 
    get_linear_schedule_with_warmup,
    set_seed
)
from pathlib import Path
import numpy as np
from tqdm import tqdm
import argparse
import logging
import wandb
from typing import List, Dict, Tuple, Optional
import random
from datetime import datetime

# 导入评估相关的类和函数
from evaluate import C3BenchmarkEvaluator, BenchmarkResult

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ContrastiveDataset(Dataset):
    """对比学习数据集"""
    
    def __init__(self, data_path: str, tokenizer, max_length: int = 512):
        """
        初始化数据集
        
        Args:
            data_path: JSONL数据文件路径
            tokenizer: 分词器
            max_length: 最大序列长度
        """
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = self._load_data(data_path)
        
    def _load_data(self, data_path: str) -> List[Dict]:
        """加载JSONL格式的数据"""
        data = []
        with open(data_path, 'r', encoding='utf-8') as f:
            for line in f:
                item = json.loads(line.strip())
                # 验证数据格式
                if 'query' in item and 'pos' in item:
                    data.append(item)
                else:
                    logger.warning(f"跳过格式错误的数据: {item}")
        logger.info(f"从 {data_path} 加载了 {len(data)} 条数据")
        return data
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        query = item['query']
        
        # 随机选择一个正例
        pos_text = random.choice(item['pos'])
        
        # 如果有负例，随机选择一个；否则返回None
        neg_text = None
        if 'neg' in item and item['neg']:
            neg_text = random.choice(item['neg'])
            
        return query, pos_text, neg_text


class BGEModel(nn.Module):
    """BGE模型封装，支持对比学习"""
    
    def __init__(self, model_name: str, pooling_method: str = 'cls'):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(model_name)
        self.pooling_method = pooling_method
        
    def forward(self, input_ids, attention_mask):
        """前向传播"""
        outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        
        # 池化策略
        if self.pooling_method == 'cls':
            embeddings = outputs.last_hidden_state[:, 0]
        elif self.pooling_method == 'mean':
            embeddings = self._mean_pooling(outputs.last_hidden_state, attention_mask)
        else:
            raise ValueError(f"不支持的池化方法: {self.pooling_method}")
            
        # L2归一化
        embeddings = F.normalize(embeddings, p=2, dim=1)
        return embeddings
    
    def _mean_pooling(self, token_embeddings, attention_mask):
        """平均池化"""
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
        sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        return sum_embeddings / sum_mask


class BGETrainer:
    """BGE模型训练器"""
    
    def __init__(
        self,
        model: BGEModel,
        tokenizer,
        train_dataset: ContrastiveDataset,
        val_dataset: Optional[ContrastiveDataset] = None,
        eval_data_path: Optional[str] = None,
        batch_size: int = 32,
        learning_rate: float = 1e-5,
        num_epochs: int = 3,
        warmup_ratio: float = 0.1,
        gradient_accumulation_steps: int = 4,
        max_grad_norm: float = 1.0,
        temperature: float = 0.02,
        use_fp16: bool = True,
        device: str = 'cuda',
        save_dir: str = './checkpoints',
        log_steps: int = 10,
        eval_steps: int = None,
        save_steps: int = None,
        use_wandb: bool = True,
        wandb_project: str = 'bge-finetune',
        wandb_run_name: Optional[str] = None,
    ):
        """
        初始化训练器
        
        Args:
            model: BGE模型
            tokenizer: 分词器
            train_dataset: 训练数据集
            val_dataset: 验证数据集
            eval_data_path: 评估数据路径（C3 benchmark）
            batch_size: 批大小
            learning_rate: 学习率
            num_epochs: 训练轮数
            warmup_ratio: 预热比例
            gradient_accumulation_steps: 梯度累积步数
            max_grad_norm: 最大梯度范数
            temperature: 对比学习温度参数
            use_fp16: 是否使用混合精度训练
            device: 训练设备
            save_dir: 模型保存目录
            log_steps: 日志记录间隔
            eval_steps: 评估间隔
            save_steps: 保存间隔
            use_wandb: 是否使用wandb
            wandb_project: wandb项目名
            wandb_run_name: wandb运行名称
        """
        self.model = model.to(device)
        self.tokenizer = tokenizer
        self.train_dataset = train_dataset
        self.val_dataset = val_dataset
        self.eval_data_path = eval_data_path
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.num_epochs = num_epochs
        self.warmup_ratio = warmup_ratio
        self.gradient_accumulation_steps = gradient_accumulation_steps
        self.max_grad_norm = max_grad_norm
        self.temperature = temperature
        self.device = device
        self.save_dir = Path(save_dir)
        self.log_steps = log_steps
        self.eval_steps = eval_steps
        self.save_steps = save_steps
        self.use_wandb = use_wandb
        
        # 创建保存目录
        self.save_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化数据加载器
        self.train_loader = DataLoader(
            train_dataset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=4,
            pin_memory=True,
            collate_fn=self._collate_fn
        )
        
        # 初始化验证数据加载器（如果没有验证集则为None）
        self.val_loader = None
        if val_dataset:
            self.val_loader = DataLoader(
                val_dataset,
                batch_size=batch_size,
                shuffle=False,
                num_workers=4,
                pin_memory=True,
                collate_fn=self._collate_fn
            )
        
        # 初始化优化器和调度器
        self.optimizer = AdamW(model.parameters(), lr=learning_rate)
        
        total_steps = len(self.train_loader) * num_epochs // gradient_accumulation_steps
        warmup_steps = int(total_steps * warmup_ratio)
        
        self.scheduler = get_linear_schedule_with_warmup(
            self.optimizer,
            num_warmup_steps=warmup_steps,
            num_training_steps=total_steps
        )
        
        # 混合精度训练
        self.scaler = torch.cuda.amp.GradScaler() if use_fp16 else None
        
        # 初始化评估器
        self.evaluator = None
        if eval_data_path:
            self.evaluator = C3BenchmarkEvaluator(
                model_name=model.encoder.config._name_or_path,
                device=device
            )
        
        # 初始化wandb
        if use_wandb:
            wandb.init(
                project=wandb_project,
                name=wandb_run_name or f"bge-finetune-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                config={
                    "model_name": model.encoder.config._name_or_path,
                    "batch_size": batch_size,
                    "learning_rate": learning_rate,
                    "num_epochs": num_epochs,
                    "warmup_ratio": warmup_ratio,
                    "gradient_accumulation_steps": gradient_accumulation_steps,
                    "temperature": temperature,
                    "max_length": train_dataset.max_length,
                    "use_fp16": use_fp16,
                }
            )
    
    def _collate_fn(self, batch):
        """数据批处理函数"""
        queries, positives, negatives = zip(*batch)
        
        # 分别编码查询、正例和负例
        texts = list(queries) + list(positives)
        neg_texts = [neg for neg in negatives if neg is not None]
        
        if neg_texts:
            texts.extend(neg_texts)
        
        # 批量编码
        encoded = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=self.train_dataset.max_length,
            return_tensors='pt'
        )
        
        batch_size = len(queries)
        result = {
            'query_ids': encoded['input_ids'][:batch_size],
            'query_mask': encoded['attention_mask'][:batch_size],
            'pos_ids': encoded['input_ids'][batch_size:2*batch_size],
            'pos_mask': encoded['attention_mask'][batch_size:2*batch_size],
        }
        
        if neg_texts:
            neg_start = 2 * batch_size
            result['neg_ids'] = encoded['input_ids'][neg_start:]
            result['neg_mask'] = encoded['attention_mask'][neg_start:]
            result['has_neg'] = [neg is not None for neg in negatives]
        
        return result
    
    def compute_loss(self, query_embeddings, pos_embeddings, neg_embeddings=None, has_neg=None):
        """
        计算对比学习损失
        
        Args:
            query_embeddings: 查询向量
            pos_embeddings: 正例向量
            neg_embeddings: 负例向量（可选）
            has_neg: 标记哪些样本有负例
        """
        batch_size = query_embeddings.size(0)
        
        # 计算查询与正例的相似度
        pos_scores = torch.sum(query_embeddings * pos_embeddings, dim=-1) / self.temperature
        
        # 使用in-batch negatives
        # 查询与批次内所有正例的相似度矩阵
        sim_matrix = torch.matmul(query_embeddings, pos_embeddings.t()) / self.temperature
        
        # 创建标签（对角线为正例）
        labels = torch.arange(batch_size).to(self.device)
        
        # 如果有显式负例，添加到相似度矩阵
        if neg_embeddings is not None and has_neg is not None:
            neg_scores = []
            neg_idx = 0
            for i, has_n in enumerate(has_neg):
                if has_n:
                    neg_score = torch.sum(query_embeddings[i] * neg_embeddings[neg_idx], dim=-1) / self.temperature
                    neg_scores.append(neg_score)
                    neg_idx += 1
                else:
                    neg_scores.append(torch.tensor(float('-inf')).to(self.device))
            
            neg_scores = torch.stack(neg_scores).unsqueeze(1)
            sim_matrix = torch.cat([sim_matrix, neg_scores], dim=1)
        
        # 计算交叉熵损失
        loss = F.cross_entropy(sim_matrix, labels)
        
        return loss
    
    def train_epoch(self, epoch):
        """训练一个epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0
        
        progress_bar = tqdm(self.train_loader, desc=f"Epoch {epoch+1}/{self.num_epochs}")
        
        for batch_idx, batch in enumerate(progress_bar):
            # 将数据移到设备
            batch = {k: v.to(self.device) if isinstance(v, torch.Tensor) else v 
                    for k, v in batch.items()}
            
            # 混合精度训练
            with torch.cuda.amp.autocast(enabled=self.scaler is not None):
                # 编码查询和文档
                query_embeddings = self.model(batch['query_ids'], batch['query_mask'])
                pos_embeddings = self.model(batch['pos_ids'], batch['pos_mask'])
                
                neg_embeddings = None
                has_neg = None
                if 'neg_ids' in batch:
                    neg_embeddings = self.model(batch['neg_ids'], batch['neg_mask'])
                    has_neg = batch['has_neg']
                
                # 计算损失
                loss = self.compute_loss(query_embeddings, pos_embeddings, neg_embeddings, has_neg)
                loss = loss / self.gradient_accumulation_steps
            
            # 反向传播
            if self.scaler:
                self.scaler.scale(loss).backward()
            else:
                loss.backward()
            
            # 梯度累积
            if (batch_idx + 1) % self.gradient_accumulation_steps == 0:
                if self.scaler:
                    self.scaler.unscale_(self.optimizer)
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.max_grad_norm)
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.max_grad_norm)
                    self.optimizer.step()
                
                self.scheduler.step()
                self.optimizer.zero_grad()
            
            # 更新统计
            total_loss += loss.item() * self.gradient_accumulation_steps
            num_batches += 1
            
            # 更新进度条
            avg_loss = total_loss / num_batches
            progress_bar.set_postfix({'loss': f'{avg_loss:.4f}'})
            
            # 记录到wandb
            if self.use_wandb and (batch_idx + 1) % self.log_steps == 0:
                wandb.log({
                    'train/loss': avg_loss,
                    'train/learning_rate': self.scheduler.get_last_lr()[0],
                    'train/epoch': epoch + (batch_idx + 1) / len(self.train_loader),
                })
            
            # 评估
            if self.eval_steps and (batch_idx + 1) % self.eval_steps == 0:
                self.evaluate(epoch, batch_idx)
                self.model.train()
            
            # 保存检查点
            if self.save_steps and (batch_idx + 1) % self.save_steps == 0:
                self.save_checkpoint(epoch, batch_idx)
        
        return total_loss / num_batches
    
    def evaluate(self, epoch: int, step: Optional[int] = None):
        """评估模型"""
        self.model.eval()
        
        # 在验证集上计算损失
        if self.val_loader:
            val_loss = 0
            num_batches = 0
            
            with torch.no_grad():
                for batch in tqdm(self.val_loader, desc="Validating"):
                    batch = {k: v.to(self.device) if isinstance(v, torch.Tensor) else v 
                            for k, v in batch.items()}
                    
                    query_embeddings = self.model(batch['query_ids'], batch['query_mask'])
                    pos_embeddings = self.model(batch['pos_ids'], batch['pos_mask'])
                    
                    neg_embeddings = None
                    has_neg = None
                    if 'neg_ids' in batch:
                        neg_embeddings = self.model(batch['neg_ids'], batch['neg_mask'])
                        has_neg = batch['has_neg']
                    
                    loss = self.compute_loss(query_embeddings, pos_embeddings, neg_embeddings, has_neg)
                    val_loss += loss.item()
                    num_batches += 1
            
            avg_val_loss = val_loss / num_batches
            logger.info(f"Validation Loss: {avg_val_loss:.4f}")
            
            if self.use_wandb:
                wandb.log({
                    'val/loss': avg_val_loss,
                    'val/epoch': epoch + (1 if step is None else (step + 1) / len(self.train_loader)),
                })
        
        # 在C3 Benchmark上评估
        if self.evaluator and self.eval_data_path:
            logger.info("在C3 Benchmark上评估...")
            
            # 临时保存模型以供评估器加载
            temp_save_path = self.save_dir / "temp_eval_model"
            self.model.encoder.save_pretrained(temp_save_path)
            self.tokenizer.save_pretrained(temp_save_path)
            
            # 创建新的评估器实例
            temp_evaluator = C3BenchmarkEvaluator(
                model_name=str(temp_save_path),
                device=self.device
            )
            
            # 执行评估（只计算top-1准确率）
            result = temp_evaluator.evaluate(
                data_path=self.eval_data_path,
                batch_size=self.batch_size,
                top_k=1
            )
            
            logger.info(f"C3 Benchmark - Recall@1: {result.recall_at_1:.4f}")
            
            if self.use_wandb:
                wandb.log({
                    'eval/recall_at_1': result.recall_at_1,
                    'eval/avg_retrieval_time': result.avg_retrieval_time,
                    'eval/epoch': epoch + (1 if step is None else (step + 1) / len(self.train_loader)),
                })
            
            # 清理临时文件
            import shutil
            shutil.rmtree(temp_save_path)
            
            return result.recall_at_1
        
        return None
    
    def save_checkpoint(self, epoch: int, step: Optional[int] = None):
        """保存模型检查点"""
        if step is None:
            save_path = self.save_dir / f"checkpoint-epoch-{epoch+1}"
        else:
            save_path = self.save_dir / f"checkpoint-epoch-{epoch+1}-step-{step+1}"
        
        save_path.mkdir(parents=True, exist_ok=True)
        
        # 保存模型和分词器
        self.model.encoder.save_pretrained(save_path)
        self.tokenizer.save_pretrained(save_path)
        
        # 保存训练状态
        torch.save({
            'epoch': epoch,
            'step': step,
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'scaler_state_dict': self.scaler.state_dict() if self.scaler else None,
        }, save_path / 'training_state.pt')
        
        logger.info(f"模型已保存到: {save_path}")
    
    def train(self):
        """执行完整的训练流程"""
        logger.info("开始训练...")
        logger.info(f"训练样本数: {len(self.train_dataset)}")
        if self.val_dataset:
            logger.info(f"验证样本数: {len(self.val_dataset)}")
        
        best_recall = 0.0
        
        for epoch in range(self.num_epochs):
            # 训练一个epoch
            avg_loss = self.train_epoch(epoch)
            logger.info(f"Epoch {epoch+1}/{self.num_epochs} - Average Loss: {avg_loss:.4f}")
            
            # epoch结束时评估
            recall_at_1 = self.evaluate(epoch)
            
            # 保存最佳模型
            if recall_at_1 and recall_at_1 > best_recall:
                best_recall = recall_at_1
                best_save_path = self.save_dir / "best_model"
                best_save_path.mkdir(parents=True, exist_ok=True)
                self.model.encoder.save_pretrained(best_save_path)
                self.tokenizer.save_pretrained(best_save_path)
                logger.info(f"最佳模型已保存 (Recall@1: {best_recall:.4f})")
            
            # 保存epoch检查点
            self.save_checkpoint(epoch)
        
        # 保存最终模型
        final_save_path = self.save_dir / "final_model"
        final_save_path.mkdir(parents=True, exist_ok=True)
        self.model.encoder.save_pretrained(final_save_path)
        self.tokenizer.save_pretrained(final_save_path)
        
        logger.info("训练完成！")
        logger.info(f"最佳Recall@1: {best_recall:.4f}")
        
        if self.use_wandb:
            wandb.finish()


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='BGE-Large-zh-v1.5 微调脚本')
    
    # 数据相关参数
    parser.add_argument('--train_data', type=str, required=True,
                        help='训练数据路径 (JSONL格式)')
    parser.add_argument('--val_data', type=str, default=None,
                        help='验证数据路径 (JSONL格式)')
    parser.add_argument('--eval_data', type=str, 
                        default='./datas/benchmark/C3_bench/C3_bench.json',
                        help='C3 Benchmark评估数据路径')
    
    # 模型相关参数
    parser.add_argument('--model_name', type=str, 
                        default='BAAI/bge-large-zh-v1.5',
                        help='预训练模型名称')
    parser.add_argument('--pooling_method', type=str, default='cls',
                        choices=['cls', 'mean'],
                        help='池化方法')
    parser.add_argument('--max_length', type=int, default=512,
                        help='最大序列长度')
    
    # 训练相关参数
    parser.add_argument('--batch_size', type=int, default=32,
                        help='批大小（适合RTX 4090）')
    parser.add_argument('--learning_rate', type=float, default=1e-5,
                        help='学习率')
    parser.add_argument('--num_epochs', type=int, default=3,
                        help='训练轮数')
    parser.add_argument('--warmup_ratio', type=float, default=0.1,
                        help='预热比例')
    parser.add_argument('--gradient_accumulation_steps', type=int, default=4,
                        help='梯度累积步数')
    parser.add_argument('--max_grad_norm', type=float, default=1.0,
                        help='最大梯度范数')
    parser.add_argument('--temperature', type=float, default=0.02,
                        help='对比学习温度参数')
    parser.add_argument('--use_fp16', action='store_true', default=True,
                        help='使用混合精度训练')
    
    # 设备相关参数
    parser.add_argument('--device', type=str, default='cuda',
                        help='训练设备')
    parser.add_argument('--seed', type=int, default=42,
                        help='随机种子')
    
    # 保存和日志相关参数
    parser.add_argument('--save_dir', type=str, default='./checkpoints',
                        help='模型保存目录')
    parser.add_argument('--log_steps', type=int, default=10,
                        help='日志记录间隔')
    parser.add_argument('--eval_steps', type=int, default=None,
                        help='评估间隔（默认每个epoch评估一次）')
    parser.add_argument('--save_steps', type=int, default=None,
                        help='保存间隔（默认每个epoch保存一次）')
    
    # Wandb相关参数
    parser.add_argument('--use_wandb', action='store_true', default=True,
                        help='使用wandb记录训练')
    parser.add_argument('--wandb_project', type=str, default='bge-finetune',
                        help='wandb项目名')
    parser.add_argument('--wandb_run_name', type=str, default=None,
                        help='wandb运行名称')
    
    args = parser.parse_args()
    
    # 设置随机种子
    set_seed(args.seed)
    
    # 检查设备
    if args.device == 'cuda' and not torch.cuda.is_available():
        logger.warning("CUDA不可用，切换到CPU")
        args.device = 'cpu'
    
    # 加载分词器
    logger.info(f"加载分词器: {args.model_name}")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    
    # 创建模型
    logger.info(f"加载模型: {args.model_name}")
    model = BGEModel(args.model_name, pooling_method=args.pooling_method)
    
    # 创建数据集
    train_dataset = ContrastiveDataset(args.train_data, tokenizer, args.max_length)
    val_dataset = None
    if args.val_data:
        val_dataset = ContrastiveDataset(args.val_data, tokenizer, args.max_length)
    
    # 创建训练器
    trainer = BGETrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        val_dataset=val_dataset,
        eval_data_path=args.eval_data,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        num_epochs=args.num_epochs,
        warmup_ratio=args.warmup_ratio,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        max_grad_norm=args.max_grad_norm,
        temperature=args.temperature,
        use_fp16=args.use_fp16,
        device=args.device,
        save_dir=args.save_dir,
        log_steps=args.log_steps,
        eval_steps=args.eval_steps,
        save_steps=args.save_steps,
        use_wandb=args.use_wandb,
        wandb_project=args.wandb_project,
        wandb_run_name=args.wandb_run_name,
    )
    
    # 开始训练
    trainer.train()


if __name__ == "__main__":
    main()