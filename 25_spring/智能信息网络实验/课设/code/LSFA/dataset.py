import os
import numpy as np
import torch.utils.data as data_utils
import torch
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
from tqdm import tqdm
import logging
from scipy.sparse import csr_matrix

logging.basicConfig(format='%(asctime)s - %(levelname)s - %(name)s -   %(message)s',
                    datefmt='%m/%d/%Y %H:%M:%S',
                    level=logging.INFO)
logger = logging.getLogger(__name__)

def get_data(args, sample_level_da=None):
    # 加载数据
    train_texts = np.load(os.path.join(args.data_dir, args.train_texts), allow_pickle=True)
    train_labels = np.load(os.path.join(args.data_dir, args.train_labels), allow_pickle=True)
    test_texts = np.load(os.path.join(args.data_dir, args.test_texts), allow_pickle=True)
    emb_init = get_word_emb(os.path.join(args.data_dir, args.emb_init))
    
    logger.info(f'Original training data shape: texts={train_texts.shape}, labels={train_labels.shape}')
    logger.info(f'Test data shape: {test_texts.shape}')
    
    # 数据验证和修复
    if len(train_texts) != len(train_labels):
        logger.warning(f'Mismatch between texts ({len(train_texts)}) and labels ({len(train_labels)})')
        min_len = min(len(train_texts), len(train_labels))
        train_texts = train_texts[:min_len]
        train_labels = train_labels[:min_len]
        logger.info(f'Trimmed to {min_len} samples')
    
    # 分割训练集和验证集
    logger.info(f'Splitting data with validation size: {args.valid_size}')
    X_train, X_valid, train_y, valid_y = train_test_split(
        train_texts, train_labels,
        test_size=args.valid_size,
        random_state=args.seed,
        stratify=None  # 如果是多标签分类，可能需要特殊处理
    )
    
    logger.info(f'After split: train={len(X_train)}, valid={len(X_valid)}')
    logger.info(f'Train labels shape: {train_y.shape}, Valid labels shape: {valid_y.shape}')
    
    # 处理多标签二值化器
    # 将所有标签合并到一个列表中，而不是使用hstack
    all_labels = []
    
    # 处理训练标签
    for labels in train_y:
        if isinstance(labels, np.ndarray):
            all_labels.extend(labels.tolist())
        elif isinstance(labels, (list, tuple)):
            all_labels.extend(labels)
        else:
            # 如果是单个标签，转换为列表
            all_labels.append([labels])
    
    # 处理验证标签
    for labels in valid_y:
        if isinstance(labels, np.ndarray):
            all_labels.extend(labels.tolist())
        elif isinstance(labels, (list, tuple)):
            all_labels.extend(labels)
        else:
            all_labels.append([labels])
    
    # 创建MultiLabelBinarizer
    mlb = get_mlb(os.path.join(args.data_dir, args.labels_binarizer), all_labels)
    
    # 转换标签
    logger.info('Converting labels to binary format...')
    y_train = mlb.transform(train_y)
    y_valid = mlb.transform(valid_y)
    
    args.label_size = len(mlb.classes_)
    logger.info(f'Number of unique labels: {args.label_size}')
    
    # 样本级数据增强
    if hasattr(args, 'sample_level_da') and args.sample_level_da:
        logger.info('Applying sample-level data augmentation...')
        X_train, y_train = slda(X_train, y_train)
        logger.info(f'After augmentation: train samples = {len(X_train)}')

    logger.info(f'Final sizes - Training Set: {len(X_train)}, Validation Set: {len(X_valid)}')

    # 创建数据加载器
    train_data = data_utils.TensorDataset(
        torch.from_numpy(X_train).type(torch.LongTensor),
        torch.from_numpy(y_train.A if hasattr(y_train, 'A') else y_train).type(torch.FloatTensor)
    )
    
    val_data = data_utils.TensorDataset(
        torch.from_numpy(X_valid).type(torch.LongTensor),
        torch.from_numpy(y_valid.A if hasattr(y_valid, 'A') else y_valid).type(torch.FloatTensor)
    )
    
    test_data = data_utils.TensorDataset(torch.from_numpy(test_texts).type(torch.LongTensor))

    # 创建数据加载器
    train_loader = data_utils.DataLoader(
        train_data, 
        args.batch_size, 
        shuffle=True, 
        drop_last=True, 
        num_workers=min(4, os.cpu_count() or 1)
    )
    
    val_loader = data_utils.DataLoader(
        val_data, 
        args.batch_size, 
        shuffle=False,  # 验证集不需要shuffle
        drop_last=False,  # 验证集不要丢弃最后一批
        num_workers=min(4, os.cpu_count() or 1)
    )
    
    test_loader = data_utils.DataLoader(
        test_data, 
        args.batch_size, 
        shuffle=False,
        drop_last=False,
        num_workers=min(4, os.cpu_count() or 1)
    )

    return train_loader, val_loader, test_loader, emb_init, mlb, args

def get_word_emb(vec_path, vocab_path=None):
    """加载词嵌入"""
    if vocab_path is not None:
        with open(vocab_path) as fp:
            vocab = {word: idx for idx, word in enumerate(fp)}
        return np.load(vec_path, allow_pickle=True), vocab
    else:
        return np.load(vec_path, allow_pickle=True)

def get_mlb(mlb_path, labels=None) -> MultiLabelBinarizer:
    """获取或创建MultiLabelBinarizer"""
    if os.path.exists(mlb_path):
        logger.info(f'Loading existing MultiLabelBinarizer from {mlb_path}')
        return joblib.load(mlb_path)
    
    if labels is None:
        raise ValueError("Labels must be provided when creating new MultiLabelBinarizer")
    
    logger.info('Creating new MultiLabelBinarizer...')
    mlb = MultiLabelBinarizer(sparse_output=True)
    
    # 确保labels是正确的格式
    processed_labels = []
    for label_set in labels:
        if isinstance(label_set, (str, int, float)):
            # 单个标签
            processed_labels.append([str(label_set)])
        elif isinstance(label_set, (list, tuple, np.ndarray)):
            # 多个标签
            processed_labels.append([str(l) for l in label_set])
        else:
            logger.warning(f'Unknown label format: {type(label_set)}, treating as single label')
            processed_labels.append([str(label_set)])
    
    mlb.fit(processed_labels)
    
    logger.info(f'MultiLabelBinarizer created with {len(mlb.classes_)} classes')
    logger.info(f'Saving to {mlb_path}')
    joblib.dump(mlb, mlb_path)
    return mlb

def slda(X_train, y_train):
    """样本级数据增强"""
    logger.info('Applying sample-level data augmentation (10x replication)...')
    
    # 如果y_train是稀疏矩阵，转换为密集矩阵
    if hasattr(y_train, 'A'):
        y_train_dense = y_train.A
    else:
        y_train_dense = y_train
    
    # 复制数据10次
    x_list = []
    y_list = []
    
    for i in range(10):
        x_list.append(X_train)
        y_list.append(y_train_dense)
    
    # 合并数据
    x_augmented = np.vstack(x_list)
    y_augmented = np.vstack(y_list)
    
    # 转换回稀疏矩阵
    y_augmented = csr_matrix(y_augmented)
    
    logger.info(f'Data augmentation complete: {X_train.shape[0]} -> {x_augmented.shape[0]} samples')
    
    return x_augmented, y_augmented