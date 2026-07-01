import os
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import AutoTokenizer, AutoModelForSequenceClassification, get_cosine_schedule_with_warmup
from sklearn.metrics import accuracy_score
from tqdm import tqdm

def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True

class NewsDataset(Dataset):
    def __init__(self, texts, labels=None, tokenizer=None, max_length=48):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = self.texts[idx]
        
        encoding = self.tokenizer(
            text, 
            max_length=self.max_length, 
            padding='max_length', 
            truncation=True, 
            return_tensors='pt'
        )
        
        item = {
            'input_ids': encoding['input_ids'].squeeze(),
            'attention_mask': encoding['attention_mask'].squeeze(),
            'token_type_ids': encoding['token_type_ids'].squeeze(),
        }
        
        if self.labels is not None:
            item['labels'] = torch.tensor(self.labels[idx], dtype=torch.long)
            
        return item

def load_data(train_file, dev_file, test_file=None):
    train_df = pd.read_table(train_file, sep='\t', header=None, names=["text_a", "label"])
    dev_df = pd.read_table(dev_file, sep='\t', header=None, names=["text_a", "label"])
    
    total_df = pd.concat([train_df, dev_df], axis=0)
    label_list = total_df.label.unique().tolist()
    label_map = {label: idx for idx, label in enumerate(label_list)}
    
    train_df['label_id'] = train_df['label'].map(label_map)
    dev_df['label_id'] = dev_df['label'].map(label_map)
    
    if test_file:
        test_df = pd.read_table(test_file, sep='\t', header=None, names=["text_a"])
        return train_df, dev_df, test_df, label_list, label_map
    
    return train_df, dev_df, label_list, label_map

def train(model, train_dataloader, eval_dataloader, optimizer, scheduler, device, num_epochs, save_dir="checkpoint"):
    best_accuracy = 0.0
    
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        
        progress_bar = tqdm(train_dataloader, desc=f"Epoch {epoch+1}/{num_epochs}")
        for step, batch in enumerate(progress_bar):
            batch = {k: v.to(device) for k, v in batch.items()}
            
            outputs = model(**batch)
            loss = outputs.loss
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            scheduler.step()
            
            total_loss += loss.item()
            
            progress_bar.set_postfix({"loss": loss.item()})
        
        avg_loss = total_loss / len(train_dataloader)
        print(f"Epoch {epoch+1}/{num_epochs} - 平均训练损失: {avg_loss:.4f}")
        
        accuracy, eval_loss = evaluate(model, eval_dataloader, device)
        print(f"Epoch {epoch+1}/{num_epochs} - 验证集准确率: {accuracy:.4f}, 验证集损失: {eval_loss:.4f}")
        
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            save_model(model, os.path.join(save_dir, "best_model"))
            print(f"保存新的最佳模型，准确率: {best_accuracy:.4f}")
    
    return best_accuracy

def evaluate(model, dataloader, device):
    model.eval()
    predictions = []
    true_labels = []
    total_loss = 0
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="评估中"):
            batch = {k: v.to(device) for k, v in batch.items()}
            
            labels = batch['labels'].cpu().numpy()
            true_labels.extend(labels)
            
            outputs = model(**batch)
            loss = outputs.loss
            total_loss += loss.item()
            logits = outputs.logits
            
            preds = torch.argmax(logits, dim=1).cpu().numpy()
            predictions.extend(preds)
    
    accuracy = accuracy_score(true_labels, predictions)
    avg_loss = total_loss / len(dataloader)
    
    return accuracy, avg_loss

def save_model(model, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    model.save_pretrained(output_dir)
    print(f"模型已保存至 {output_dir}")

def predict(model, dataloader, device, label_map=None):
    model.eval()
    all_predictions = []
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="预测中"):
            batch = {k: v.to(device) for k, v in batch.items()}
            
            outputs = model(**batch)
            logits = outputs.logits
            
            predictions = torch.argmax(logits, dim=1).cpu().numpy()
            all_predictions.extend(predictions)
    
    if label_map:
        id_to_label = {v: k for k, v in label_map.items()}
        all_predictions = [id_to_label[pred_id] for pred_id in all_predictions]
    
    return all_predictions

def create_pseudo_labels(model, dataloader, test_df, tokenizer, device, label_map, threshold=0.9):
    model.eval()
    all_predictions = []
    all_probs = []
    
    with torch.no_grad():
        for batch in tqdm(dataloader, desc="生成伪标签"):
            batch = {k: v.to(device) for k, v in batch.items()}
            
            outputs = model(**batch)
            logits = outputs.logits
            
            probs = torch.nn.functional.softmax(logits, dim=1)
            
            max_probs, predictions = torch.max(probs, dim=1)
            
            all_predictions.extend(predictions.cpu().numpy())
            all_probs.extend(max_probs.cpu().numpy())
    
    pseudo_df = test_df.copy()
    pseudo_df['prediction_id'] = all_predictions
    pseudo_df['confidence'] = all_probs
    
    id_to_label = {v: k for k, v in label_map.items()}
    pseudo_df['label'] = pseudo_df['prediction_id'].map(id_to_label)
    
    high_conf_df = pseudo_df[pseudo_df['confidence'] >= threshold]
    count_by_label = high_conf_df['label'].value_counts()
    
    print(f"生成了 {len(high_conf_df)} 个置信度 >= {threshold} 的伪标签")
    print(f"伪标签类别分布:\n{count_by_label}")
    
    return high_conf_df[['text_a', 'label']]

def main():
    set_seed(1024)
    
    model_name = "hfl/chinese-roberta-wwm-ext-large"
    max_length = 48
    batch_size = 64
    learning_rate = 2e-5
    epochs = 4
    warmup_proportion = 0.1
    weight_decay = 0.0
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {device}")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    train_df, dev_df, test_df, label_list, label_map = load_data(
        './datas/train.txt', 
        './datas/dev.txt', 
        './datas/test.txt'
    )
    
    print(f"类别标签: {label_list}")
    print(f"训练集大小: {len(train_df)}, 验证集大小: {len(dev_df)}, 测试集大小: {len(test_df)}")
    
    train_dataset = NewsDataset(
        texts=train_df['text_a'].tolist(),
        labels=train_df['label_id'].tolist(),
        tokenizer=tokenizer,
        max_length=max_length
    )
    
    eval_dataset = NewsDataset(
        texts=dev_df['text_a'].tolist(),
        labels=dev_df['label_id'].tolist(),
        tokenizer=tokenizer,
        max_length=max_length
    )
    
    test_dataset = NewsDataset(
        texts=test_df['text_a'].tolist(),
        labels=None,
        tokenizer=tokenizer,
        max_length=max_length
    )
    
    train_dataloader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True
    )
    
    eval_dataloader = DataLoader(
        eval_dataset,
        batch_size=batch_size
    )
    
    test_dataloader = DataLoader(
        test_dataset,
        batch_size=batch_size
    )
    
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(label_list)
    ).to(device)
    
    num_training_steps = len(train_dataloader) * epochs
    num_warmup_steps = int(warmup_proportion * num_training_steps)
    
    optimizer = AdamW(
        model.parameters(),
        lr=learning_rate,
        weight_decay=weight_decay
    )
    
    scheduler = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=num_warmup_steps,
        num_training_steps=num_training_steps
    )
    
    print("开始第一阶段训练...")
    best_accuracy = train(
        model,
        train_dataloader,
        eval_dataloader,
        optimizer,
        scheduler,
        device,
        epochs,
        save_dir="checkpoint"
    )
    print(f"第一阶段训练完成! 最佳验证准确率: {best_accuracy:.4f}")
    
    model = AutoModelForSequenceClassification.from_pretrained("checkpoint/best_model").to(device)
    
    print("从测试集生成伪标签...")
    pseudo_df = create_pseudo_labels(
        model,
        test_dataloader,
        test_df,
        tokenizer,
        device,
        label_map,
        threshold=0.9
    )
    
    print("创建包含伪标签的增强训练数据集...")
    augmented_train_df = pd.concat([train_df[['text_a', 'label']], pseudo_df], axis=0)
    augmented_train_df['label_id'] = augmented_train_df['label'].map(label_map)
    
    augmented_train_dataset = NewsDataset(
        texts=augmented_train_df['text_a'].tolist(),
        labels=augmented_train_df['label_id'].tolist(),
        tokenizer=tokenizer,
        max_length=max_length
    )
    
    augmented_train_dataloader = DataLoader(
        augmented_train_dataset,
        batch_size=batch_size,
        shuffle=True
    )
    
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(label_list)
    ).to(device)
    
    num_training_steps = len(augmented_train_dataloader) * epochs
    num_warmup_steps = int(warmup_proportion * num_training_steps)
    
    optimizer = AdamW(
        model.parameters(),
        lr=learning_rate,
        weight_decay=weight_decay
    )
    
    scheduler = get_cosine_schedule_with_warmup(
        optimizer,
        num_warmup_steps=num_warmup_steps,
        num_training_steps=num_training_steps
    )
    
    print("使用增强数据集（包括伪标签）进行第二阶段训练...")
    best_accuracy = train(
        model,
        augmented_train_dataloader,
        eval_dataloader,
        optimizer,
        scheduler,
        device,
        epochs,
        save_dir="checkpoint_final"
    )
    print(f"增强训练完成! 最佳验证准确率: {best_accuracy:.4f}")
    
    model = AutoModelForSequenceClassification.from_pretrained("checkpoint_final/best_model").to(device)
    test_predictions = predict(model, test_dataloader, device, label_map)
    
    with open("./outputs/result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(test_predictions))
    
    print("预测结果已保存至 ./outputs/result.txt")
    
    os.system("zip './outputs/submission.zip' './outputs/result.txt'")
    print("已生成提交文件 submission.zip")

if __name__ == "__main__":
    main()