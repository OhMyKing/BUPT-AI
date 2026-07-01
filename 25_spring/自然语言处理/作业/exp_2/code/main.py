import argparse
import os
import numpy as np
from tqdm import tqdm
import torch

# 导入配置和模块
from models.config import TransformerConfig
from modules.ner_module import NERModule
from modules.lebert_module import LEBERTModule

# 导入数据处理模块
from data import load_chinese_ner_data
from data.lexicon_dataloader import create_chinese_ner_lexicon_data_loaders

# 导入评估函数
from eval.evaluate import print_classification_report, custom_ner_report, entity_level_report

# 导入工具函数
from utils.model_utils import set_seed


def load_word_embeddings(embedding_path, max_vocab_size=None):
    """
    加载预训练词嵌入，支持不同格式的词向量文件

    Args:
        embedding_path: 词嵌入文件路径
        max_vocab_size: 最大词汇表大小

    Returns:
        词嵌入矩阵和词汇表
    """
    print(f"Loading word embeddings from {embedding_path}...")

    word_to_id = {'<PAD>': 0, '<UNK>': 1}
    vectors = []
    embedding_dim = None

    # 添加填充和未知词向量
    with open(embedding_path, 'r', encoding='utf-8') as f:
        # 读取第一行，检查是否是元数据行
        first_line = next(f).strip()
        parts = first_line.split(' ')

        # 确定嵌入维度
        # 如果第一行是元数据行（如"词汇量 维度"的格式）
        if len(parts) == 2 and all(p.isdigit() for p in parts):
            _, embedding_dim = map(int, parts)
            start_line = 0  # 从第二行开始读取词向量
        # 否则，假设第一行就是一个词向量，通过计算元素个数来确定维度
        else:
            # 跳过第一个元素（词本身）
            embedding_dim = len(parts) - 1
            # 将文件指针重置到开头
            f.seek(0)
            start_line = 0  # 从第一行开始读取词向量

        print(f"Determined embedding dimension: {embedding_dim}")

        # 初始化填充和未知词向量
        vectors.append(np.zeros(embedding_dim))  # <PAD>
        vectors.append(np.random.normal(0, 0.1, embedding_dim))  # <UNK>

        # 跳过到起始行
        if start_line > 0:
            for _ in range(start_line):
                next(f)

        # 读取预训练向量
        word_count = 0
        for i, line in enumerate(f):
            if max_vocab_size and len(word_to_id) >= max_vocab_size:
                break

            parts = line.strip().split(' ')
            # 确保有足够的部分来表示词和向量
            if len(parts) < embedding_dim + 1:
                continue

            word = parts[0]
            # 只处理中文词（可选，视需求而定）
            if _is_chinese_word(word) and word not in word_to_id:
                try:
                    vector = np.array([float(x) for x in parts[1:embedding_dim + 1]])
                    vectors.append(vector)
                    word_to_id[word] = len(word_to_id)
                    word_count += 1
                    if word_count % 10000 == 0:
                        print(f"Loaded {word_count} words...")
                except ValueError:
                    # 忽略无法转换为浮点数的值
                    continue

    # 转换为numpy数组
    embeddings = np.array(vectors)
    print(f"Loaded {len(word_to_id)} words with dimension {embedding_dim}")

    return embeddings, word_to_id


def _is_chinese_word(word):
    """判断是否为中文词"""
    # 如果只需要中文词，则使用此函数进行过滤
    # 简单判断：如果至少有一个字符是中文，则认为是中文词
    for char in word:
        if '\u4e00' <= char <= '\u9fff':
            return True
    return False


def parse_args():
    parser = argparse.ArgumentParser(description="训练中文命名实体识别的Transformer模型")

    # 基本参数
    parser.add_argument("--dev", action="store_true", help="启用开发模式，使用小模型和少量数据进行快速验证")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output_dir", type=str, default="./output")

    # 模型参数
    parser.add_argument("--hidden_size", type=int, default=504)
    parser.add_argument("--num_layers", type=int, default=12)
    parser.add_argument("--num_heads", type=int, default=12)
    parser.add_argument("--ff_size", type=int, default=2016)
    parser.add_argument("--dropout", type=float, default=0.1)
    parser.add_argument("--max_seq_len", type=int, default=256)
    parser.add_argument("--position_encoding", type=str, default="sinusoidal")
    parser.add_argument("--attention_type", type=str, default="vanilla")
    parser.add_argument("--norm_position", type=str, default="post")
    parser.add_argument("--use_decoder", action="store_true")

    # 训练参数
    parser.add_argument("--batch_size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=5e-5)
    parser.add_argument("--epochs", type=int, default=10)

    # 数据路径
    parser.add_argument("--train_file", type=str, default='./ner-data/train.txt')
    parser.add_argument("--train_tag_file", type=str, default='./ner-data/train_TAG.txt')
    parser.add_argument("--dev_file", type=str, default='./ner-data/dev.txt')
    parser.add_argument("--dev_tag_file", type=str, default='./ner-data/dev_TAG.txt')
    parser.add_argument("--test_file", type=str, default='./ner-data/test.txt')
    parser.add_argument("--test_tag_file", type=str, default='./ner-data/test_TAG.txt')

    # 词汇增强参数
    parser.add_argument("--use_lexicon", action="store_true", help="是否使用词汇增强")
    parser.add_argument("--lexicon_path", type=str, default='./ner-data/gigaword_chn.all.a2b.uni.ite50.vec')
    parser.add_argument("--lexicon_adapter_layer", type=int, default=1, help="词汇适配器应用的层索引")
    parser.add_argument("--max_words_per_char", type=int, default=5, help="每个字符最多对应的词数量")
    parser.add_argument("--max_vocab_size", type=int, default=100000, help="最大词汇表大小")

    # 记录参数
    parser.add_argument("--use_wandb", action="store_true", help="是否使用wandb记录训练指标")
    parser.add_argument("--wandb_project", type=str, default="LexiconNER")
    parser.add_argument("--wandb_entity", type=str, default=None)
    parser.add_argument("--wandb_name", type=str, default=None)

    return parser.parse_args()


def main():
    args = parse_args()
    set_seed(args.seed)

    # 创建输出目录
    os.makedirs(args.output_dir, exist_ok=True)

    # 开发模式配置
    if args.dev:
        print("启用开发模式，使用小模型配置...")
        args.hidden_size = 16
        args.num_layers = 2
        args.num_heads = 2
        args.ff_size = 64
        args.batch_size = 8
        args.epochs = 1
        args.max_seq_len = 32
        args.max_vocab_size = 1000  # 开发模式下限制词汇表大小

    # 根据是否使用词汇增强选择不同的数据加载方式
    if args.use_lexicon:
        print("使用词汇增强模式...")
        # 加载词嵌入
        word_embeddings, word_to_id = load_word_embeddings(args.lexicon_path, args.max_vocab_size)

        # 创建数据加载器
        dataloaders, (tag_to_id, id_to_tag), vocab_size, word_vocab_size = create_chinese_ner_lexicon_data_loaders(
            train_file=args.train_file,
            train_tag_file=args.train_tag_file,
            dev_file=args.dev_file,
            dev_tag_file=args.dev_tag_file,
            test_file=args.test_file,
            test_tag_file=args.test_tag_file,
            batch_size=args.batch_size,
            max_len=args.max_seq_len,
            word_to_id=word_to_id,
            max_words_per_char=args.max_words_per_char
        )
        print(f"词汇表大小: {vocab_size}")
        print(f"词表大小: {word_vocab_size}")
    else:
        # 创建普通数据加载器
        dataloaders, (tag_to_id, id_to_tag), vocab_size = load_chinese_ner_data(
            train_file=args.train_file,
            train_tag_file=args.train_tag_file,
            dev_file=args.dev_file,
            dev_tag_file=args.dev_tag_file,
            test_file=args.test_file,
            test_tag_file=args.test_tag_file,
            batch_size=args.batch_size,
            max_len=args.max_seq_len
        )
        print(f"词汇表大小: {vocab_size}")

    print(f"标签数量: {len(tag_to_id)}")

    # 创建配置
    config = TransformerConfig(
        hidden_size=args.hidden_size,
        num_layers=args.num_layers,
        num_heads=args.num_heads,
        ff_size=args.ff_size,
        dropout=args.dropout,
        max_seq_len=args.max_seq_len,
        vocab_size=vocab_size,
        position_encoding_type=args.position_encoding,
        attention_type=args.attention_type,
        norm_position=args.norm_position,
        num_tags=len(tag_to_id),
        use_decoder=args.use_decoder,
        use_lexicon=args.use_lexicon,
        lexicon_adapter_layer=args.lexicon_adapter_layer,
        max_words_per_char=args.max_words_per_char
    )

    # 选择设备
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f'使用设备: {device}')

    # 根据是否使用词汇增强选择不同的模块
    if args.use_lexicon:
        # 创建LEBERT模块
        ner_module = LEBERTModule(config, word_embeddings, device, lr=args.lr)
    else:
        # 创建普通NER模块
        ner_module = NERModule(config, device, lr=args.lr)

    # 初始化wandb
    if args.use_wandb:
        import wandb
        wandb_config = {
            "model_type": "LEBERT" if args.use_lexicon else "Transformer",
            "hidden_size": args.hidden_size,
            "num_layers": args.num_layers,
            "num_heads": args.num_heads,
            "ff_size": args.ff_size,
            "dropout": args.dropout,
            "max_seq_len": args.max_seq_len,
            "position_encoding": args.position_encoding,
            "attention_type": args.attention_type,
            "norm_position": args.norm_position,
            "use_decoder": args.use_decoder,
            "batch_size": args.batch_size,
            "learning_rate": args.lr,
            "epochs": args.epochs,
            "vocab_size": vocab_size,
            "num_tags": len(tag_to_id)
        }
        if args.use_lexicon:
            wandb_config.update({
                "lexicon_adapter_layer": args.lexicon_adapter_layer,
                "max_words_per_char": args.max_words_per_char,
                "word_vocab_size": word_vocab_size
            })
        wandb.init(
            project=args.wandb_project,
            entity=args.wandb_entity,
            name=args.wandb_name,
            config=wandb_config
        )

    # 训练
    best_f1 = 0.0
    for epoch in range(args.epochs):
        # 训练阶段
        ner_module.model.train()
        train_loss = 0.0
        train_steps = 0

        train_iterator = tqdm(dataloaders['train'], desc=f"轮次 {epoch + 1}/{args.epochs} [训练]")
        for batch in train_iterator:
            loss = ner_module.train_step(batch)
            train_loss += loss
            train_steps += 1
            train_iterator.set_postfix({'损失': train_loss / train_steps})

            # 记录每步的训练损失
            if args.use_wandb:
                wandb.log({"train/step_loss": loss, "train/step": epoch * len(dataloaders['train']) + train_steps})

        avg_train_loss = train_loss / train_steps

        # 验证阶段
        ner_module.model.eval()
        val_results = ner_module.evaluate(dataloaders['val'], id_to_tag)

        print(f"\n轮次 {epoch + 1}/{args.epochs}")
        print(f"  训练损失: {avg_train_loss:.4f}")
        print(f"  验证损失: {val_results['loss']:.4f}")
        print(f"  验证F1: {val_results['f1']:.4f}")
        print(f"  验证精确率: {val_results['precision']:.4f}")
        print(f"  验证召回率: {val_results['recall']:.4f}")

        # 记录每个epoch的指标
        if args.use_wandb:
            wandb.log({
                "train/epoch_loss": avg_train_loss,
                "val/loss": val_results['loss'],
                "val/f1": val_results['f1'],
                "val/precision": val_results['precision'],
                "val/recall": val_results['recall'],
                "epoch": epoch + 1
            })

        # 打印验证集分类报告
        if 'all_true_tags' in val_results and 'all_pred_tags' in val_results:
            print("\n验证集分类报告:")
            true_tags_flat = [tag for seq in val_results['all_true_tags'] for tag in seq if tag != -100]
            pred_tags_flat = [tag for seq in val_results['all_pred_tags'] for tag in seq if tag != -100]
            print_classification_report(true_tags_flat, pred_tags_flat, labels=list(id_to_tag.values()))

        # 保存最佳模型
        if val_results['f1'] > best_f1:
            best_f1 = val_results['f1']
            ner_module.save_model(os.path.join(args.output_dir, "best_model.pt"))
            print(f"  保存新的最佳模型，F1值: {best_f1:.4f}")

            if args.use_wandb:
                wandb.log({"best_val_f1": best_f1, "epoch": epoch + 1})

    # 最终测试
    print("\n加载最佳模型进行最终测试...")
    ner_module.load_model(os.path.join(args.output_dir, "best_model.pt"), weights_only=False)
    ner_module.model.eval()

    # 对测试集进行预测
    test_results = ner_module.evaluate(dataloaders['test'], id_to_tag)

    # 读取原始测试文本
    test_texts = []
    with open(args.test_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                test_texts.append(line.split())

    # 将预测结果保存到文件
    with open('2022211733.txt', 'w', encoding='utf-8') as f:
        for i, pred_tags in enumerate(test_results['pred_sequences']):
            # 确保预测标签和原始文本长度匹配
            if i < len(test_texts):
                text_len = len(test_texts[i])
                pred_len = len(pred_tags)

                # 调整标签长度以匹配文本长度
                if pred_len > text_len:
                    pred_tags = pred_tags[:text_len]
                elif pred_len < text_len:
                    pred_tags.extend(['O'] * (text_len - pred_len))

                # 写入标签，以空格分隔
                f.write(' '.join(pred_tags) + '\n')

    print("序列标注结果已保存到 2022211733.txt")

    # 如果提供了测试标签文件，继续进行评估
    if args.test_tag_file:
        print("\n测试结果:")
        print(f"  损失: {test_results['loss']:.4f}")
        print(f"  F1: {test_results['f1']:.4f}")
        print(f"  精确率: {test_results['precision']:.4f}")
        print(f"  召回率: {test_results['recall']:.4f}")

        if 'true_sequences' in test_results and 'pred_sequences' in test_results:
            print("\n标记级别评估报告（所有标签）:")
            print(custom_ner_report(test_results['true_sequences'], test_results['pred_sequences']))

            print("\n实体级别评估报告:")
            print(entity_level_report(test_results['true_sequences'], test_results['pred_sequences']))

        print("\n标签映射:")
        for tag, tag_id in sorted(tag_to_id.items(), key=lambda x: x[1]):
            print(f"  {tag}: {tag_id}")
    elif 'test' in dataloaders:
        print("\n测试集标签文件未提供，跳过测试集评估。")

    # 关闭wandb
    if args.use_wandb:
        wandb.finish()


if __name__ == "__main__":
    main()