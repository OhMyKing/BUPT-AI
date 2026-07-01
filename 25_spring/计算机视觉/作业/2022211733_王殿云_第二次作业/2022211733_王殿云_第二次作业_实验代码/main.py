import os
import time
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

from feature_extraction import extract_sift_features, extract_dense_sift_features, apply_root_sift
from feature_representation import build_codebook, compute_bovw_features, compute_spatial_pyramid_features
from classifier import train_svm_classifier, predict_svm, train_ensemble_svm, predict_ensemble_svm

def load_dataset(data_dir, training_ratio=150):
    """
    加载数据集，将每个类别的前training_ratio个样本作为训练集，其余作为测试集
    
    Args:
        data_dir (str): 数据集目录路径
        training_ratio (int): 每个类别的训练样本数量
        
    Returns:
        tuple: (训练图像路径列表, 训练标签列表, 测试图像路径列表, 测试标签列表, 类别名列表)
    """
    train_paths = []
    train_labels = []
    test_paths = []
    test_labels = []
    
    class_names = sorted([d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))])
    
    for class_idx, class_name in enumerate(class_names):
        class_dir = os.path.join(data_dir, class_name)
        image_files = sorted([f for f in os.listdir(class_dir) if f.endswith(('.jpg', '.jpeg', '.png'))])
        
        # 前training_ratio个样本作为训练集
        for i, img_file in enumerate(image_files):
            img_path = os.path.join(class_dir, img_file)
            if i < training_ratio:
                train_paths.append(img_path)
                train_labels.append(class_idx)
            else:
                test_paths.append(img_path)
                test_labels.append(class_idx)
    
    return train_paths, train_labels, test_paths, test_labels, class_names

def visualize_confusion_matrix(y_true, y_pred, class_names, title):
    """
    可视化混淆矩阵
    
    Args:
        y_true (list): 真实标签
        y_pred (list): 预测标签
        class_names (list): 类别名称
        title (str): 图表标题
    """
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f"confusion_matrix_{title.replace(' ', '_')}.png")
    plt.close()

def experiment(experiment_config, data_dir='15-Scene'):
    """
    执行实验
    
    Args:
        experiment_config (dict): 实验配置字典
        data_dir (str): 数据集目录路径
        
    Returns:
        tuple: (准确率, 分类报告)
    """
    print(f"正在进行实验: {experiment_config['name']}")
    start_time = time.time()
    
    # 加载数据集
    train_paths, train_labels, test_paths, test_labels, class_names = load_dataset(data_dir)
    
    print("提取训练集特征...")
    train_features = []
    for img_path in train_paths:
        if experiment_config['dense_sift']:
            descriptors = extract_dense_sift_features(img_path, step_size=experiment_config['dense_step_size'])
        else:
            descriptors = extract_sift_features(img_path)
        
        if experiment_config['root_sift'] and descriptors is not None and len(descriptors) > 0:
            descriptors = apply_root_sift(descriptors)
            
        if descriptors is not None and len(descriptors) > 0:
            train_features.append(descriptors)
        else:
            train_features.append(np.zeros((1, 128), dtype=np.float32))  # 空特征
    
    print(f"构建词袋模型 (k={experiment_config['codebook_size']})...")
    codebook = build_codebook(train_features, experiment_config['codebook_size'])
    
    # 计算训练集的特征表示
    print("计算训练集特征表示...")
    if experiment_config['spatial_pyramid']:
        train_bovw = compute_spatial_pyramid_features(train_paths, codebook, 
                                                     dense_sift=experiment_config['dense_sift'],
                                                     root_sift=experiment_config['root_sift'],
                                                     levels=experiment_config['pyramid_levels'],
                                                     step_size=experiment_config['dense_step_size'])
    else:
        train_bovw = compute_bovw_features(train_paths, codebook, 
                                          dense_sift=experiment_config['dense_sift'],
                                          root_sift=experiment_config['root_sift'],
                                          step_size=experiment_config['dense_step_size'])
    
    print("训练分类器...")
    if experiment_config['ensemble_svm']:
        classifier = train_ensemble_svm(train_bovw, train_labels, 
                                      C=experiment_config['svm_c'], 
                                      kernel=experiment_config['svm_kernel'],
                                      n_estimators=experiment_config['ensemble_estimators'])
    else:
        classifier = train_svm_classifier(train_bovw, train_labels, 
                                         C=experiment_config['svm_c'], 
                                         kernel=experiment_config['svm_kernel'])
    
    print("提取测试集特征并计算特征表示...")
    if experiment_config['spatial_pyramid']:
        test_bovw = compute_spatial_pyramid_features(test_paths, codebook, 
                                                    dense_sift=experiment_config['dense_sift'],
                                                    root_sift=experiment_config['root_sift'],
                                                    levels=experiment_config['pyramid_levels'],
                                                    step_size=experiment_config['dense_step_size'])
    else:
        test_bovw = compute_bovw_features(test_paths, codebook, 
                                         dense_sift=experiment_config['dense_sift'],
                                         root_sift=experiment_config['root_sift'],
                                         step_size=experiment_config['dense_step_size'])
    
    print("进行预测...")
    if experiment_config['ensemble_svm']:
        y_pred = predict_ensemble_svm(classifier, test_bovw)
    else:
        y_pred = predict_svm(classifier, test_bovw)
    
    accuracy = np.mean(np.array(y_pred) == np.array(test_labels))
    report = classification_report(test_labels, y_pred, target_names=class_names)
    
    # 可视化混淆矩阵
    visualize_confusion_matrix(test_labels, y_pred, class_names, experiment_config['name'])
    
    end_time = time.time()
    print(f"实验耗时: {end_time - start_time:.2f} 秒")
    print(f"准确率: {accuracy:.4f}")
    print("分类报告:")
    print(report)
    
    return accuracy, report

def main():
    # 实验配置
    experiment_configs = [
        {
            'name': '1. SIFT+Kmeans+BoVW+SVM',
            'dense_sift': False,
            'root_sift': False,
            'spatial_pyramid': False,
            'ensemble_svm': False,
            'codebook_size': 200,
            'svm_c': 10,
            'svm_kernel': 'rbf',
            'dense_step_size': 8,
            'pyramid_levels': 2,
            'ensemble_estimators': 5
        },
        {
            'name': '2. Dense SIFT+Kmeans+BoVW+SVM',
            'dense_sift': True,
            'root_sift': False,
            'spatial_pyramid': False,
            'ensemble_svm': False,
            'codebook_size': 200,   
            'svm_c': 10,
            'svm_kernel': 'rbf',
            'dense_step_size': 8,
            'pyramid_levels': 2,
            'ensemble_estimators': 5
        },
        {
            'name': '3. SIFT+Kmeans+BoVW+Spatial Pyramid+SVM',
            'dense_sift': False,
            'root_sift': False,
            'spatial_pyramid': True,
            'ensemble_svm': False,
            'codebook_size': 200,
            'svm_c': 10,
            'svm_kernel': 'rbf',
            'dense_step_size': 8,
            'pyramid_levels': 2,
            'ensemble_estimators': 5
        },
        {
            'name': '4. RootSIFT+Kmeans+BoVW+SVM',
            'dense_sift': False,
            'root_sift': True,
            'spatial_pyramid': False,
            'ensemble_svm': False,
            'codebook_size': 200,
            'svm_c': 10,
            'svm_kernel': 'rbf',
            'dense_step_size': 8,
            'pyramid_levels': 2,
            'ensemble_estimators': 5
        },
        {
            'name': '5. SIFT+Kmeans+BoVW+Ensemble SVM',
            'dense_sift': False,
            'root_sift': False,
            'spatial_pyramid': False,
            'ensemble_svm': True,
            'codebook_size': 200,
            'svm_c': 10,
            'svm_kernel': 'rbf',
            'dense_step_size': 8,
            'pyramid_levels': 2,
            'ensemble_estimators': 5
        },
        {
            'name': '6. Dense SIFT+RootSIFT+Kmeans+BoVW+Spatial Pyramid+Ensemble SVM',
            'dense_sift': True,
            'root_sift': True,
            'spatial_pyramid': True,
            'ensemble_svm': True,
            'codebook_size': 200,
            'svm_c': 10,
            'svm_kernel': 'rbf',
            'dense_step_size': 8,
            'pyramid_levels': 2,
            'ensemble_estimators': 5
        }
    ]
    
    # 运行所有实验并比较结果
    data_dir = '15-Scene'
    results = []
    for config in experiment_configs:
        accuracy, _ = experiment(config, data_dir)
        results.append({
            'name': config['name'], 
            'accuracy': accuracy
        })
    
    print("\n实验结果比较:")
    for result in results:
        print(f"{result['name']}: 准确率 = {result['accuracy']:.4f}")

if __name__ == "__main__":
    main()