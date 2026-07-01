import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data import load_chinese_ner_data

def test_data_loading():
    """测试中文NER数据加载功能"""
    print("开始测试数据加载...")
    
    # 设置数据路径
    data_dir = "ner-data"
    train_file = os.path.join(data_dir, "train.txt")
    train_tag_file = os.path.join(data_dir, "train_TAG.txt")
    dev_file = os.path.join(data_dir, "dev.txt")
    dev_tag_file = os.path.join(data_dir, "dev_TAG.txt")
    test_file = os.path.join(data_dir, "test.txt")
    test_tag_file = os.path.join(data_dir, "test_TAG.txt")
    
    # 加载数据
    print("\n1. 加载数据集...")
    dataloaders, (tag_to_id, id_to_tag), vocab_size = load_chinese_ner_data(
        train_file=train_file,
        train_tag_file=train_tag_file,
        dev_file=dev_file,
        dev_tag_file=dev_tag_file,
        test_file=test_file,
        batch_size=32,
        max_len=512
    )
    
    # 打印数据集信息
    print("\n2. 数据集信息:")
    print(f"\n标签集大小: {len(tag_to_id)}")
    print(f"\n词表大小:{vocab_size}")
    print("\n标签映射:")
    for tag, idx in sorted(tag_to_id.items(), key=lambda x: x[1]):
        print(f"  {tag}: {idx}")
    
    # 检查数据加载器
    print("\n3. 数据加载器信息:")
    for split, dataloader in dataloaders.items():
        print(f"\n{split}集:")
        print(f"  批次数量: {len(dataloader)}")
        
        # 获取一个批次的数据
        batch = next(iter(dataloader))
        print(f"  批次大小: {batch['input_ids'].size(0)}")
        print(f"  序列长度: {batch['input_ids'].size(1)}")
        print(f"  特征:")
        for key, value in batch.items():
            print(f"    {key}: {value.shape}")
    
    # 验证一个批次的数据
    print("\n4. 验证数据格式:")
    batch = next(iter(dataloaders['train']))
    print("\n训练集一个批次的示例:")
    
    # 获取训练数据集以访问id_to_vocab映射 - 修改点：使用训练数据集的id_to_vocab映射而非chr()函数
    train_dataset = dataloaders['train'].dataset
    
    # 获取第一个样本的字符和标签
    input_ids = batch['input_ids'][0].tolist()
    chars = [train_dataset.id_to_vocab.get(idx, '<UNK>') for idx in input_ids]
    labels = batch['labels'][0].tolist()
    
    print("\n第一个样本:")
    print("字符:")
    print(' '.join([c for c in chars if c != '<PAD>'][:20]), "...")  # 只打印前20个非<PAD>字符
    print("\n标签:")
    print([id_to_tag[label] if label != -100 and label in id_to_tag else '<PAD>' 
           for label in labels if label != -100][:20], "...")  # 只打印前20个非<PAD>标签
    
    print("\n测试完成!")

if __name__ == "__main__":
    test_data_loading()