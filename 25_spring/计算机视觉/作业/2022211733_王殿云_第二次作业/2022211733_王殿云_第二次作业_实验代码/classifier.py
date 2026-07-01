import numpy as np
from sklearn.svm import SVC
from sklearn.ensemble import BaggingClassifier
from sklearn.preprocessing import StandardScaler

def train_svm_classifier(X_train, y_train, C=10, kernel='rbf'):
    """
    训练SVM分类器
    
    Args:
        X_train (numpy.ndarray): 训练特征
        y_train (list): 训练标签
        C (float): SVM的惩罚参数
        kernel (str): 核函数类型
        
    Returns:
        tuple: (分类器, 特征缩放器)
    """
    # 特征缩放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # 训练SVM分类器
    clf = SVC(C=C, kernel=kernel, probability=True, random_state=42)
    clf.fit(X_train_scaled, y_train)
    
    return clf, scaler

def predict_svm(model_tuple, X_test):
    """
    使用训练好的SVM模型进行预测
    
    Args:
        model_tuple (tuple): (分类器, 特征缩放器)
        X_test (numpy.ndarray): 测试特征
        
    Returns:
        list: 预测标签
    """
    clf, scaler = model_tuple
    X_test_scaled = scaler.transform(X_test)
    return clf.predict(X_test_scaled)

def train_ensemble_svm(X_train, y_train, C=10, kernel='rbf', n_estimators=5):
    """
    训练集成SVM分类器
    
    Args:
        X_train (numpy.ndarray): 训练特征
        y_train (list): 训练标签
        C (float): SVM的惩罚参数
        kernel (str): 核函数类型
        n_estimators (int): 集成学习中基分类器的数量
        
    Returns:
        tuple: (集成分类器, 特征缩放器)
    """
    # 特征缩放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # 创建基分类器
    base_clf = SVC(C=C, kernel=kernel, probability=True, random_state=42)
    
    # 创建集成分类器
    ensemble_clf = BaggingClassifier(
        estimator=base_clf,
        n_estimators=n_estimators,
        max_samples=0.8,
        max_features=0.8,
        bootstrap=True,
        bootstrap_features=False,
        random_state=42
    )
    
    # 训练集成分类器
    ensemble_clf.fit(X_train_scaled, y_train)
    
    return ensemble_clf, scaler

def predict_ensemble_svm(model_tuple, X_test):
    """
    使用训练好的集成SVM模型进行预测
    
    Args:
        model_tuple (tuple): (集成分类器, 特征缩放器)
        X_test (numpy.ndarray): 测试特征
        
    Returns:
        list: 预测标签
    """
    ensemble_clf, scaler = model_tuple
    X_test_scaled = scaler.transform(X_test)
    return ensemble_clf.predict(X_test_scaled)