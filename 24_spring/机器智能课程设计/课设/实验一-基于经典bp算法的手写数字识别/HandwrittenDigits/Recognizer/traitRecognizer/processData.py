import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, OneHotEncoder


def processData(X):

    scaler_loaded = joblib.load('Recognizer/traitRecognizer/model/scaler.joblib')
    X_scaled = scaler_loaded.transform([X])

    # 为CNN添加一个维度
    X_plus = np.expand_dims(X_scaled, axis=2)

    return X_plus


def processDataset(filepath):
    # 加载数据
    data = pd.read_csv(filepath, header=None)
    X = data.iloc[:, :-1].values
    y = data.iloc[:, -1].values

    # 标准化特征
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # One-Hot编码标签
    encoder = OneHotEncoder()
    y_encoded = encoder.fit_transform(y.reshape(-1, 1))

    # 为CNN添加一个维度
    X_plus = np.expand_dims(X_scaled, axis=2)

    return X_plus, y_encoded

def processimg(img):
    return

def scalerLabel(y):
    if y > 9 or y < 0:
        return
    encoder_loaded = joblib.load('Recognizer/traitRecognizer/model/encoder.joblib')
    return encoder_loaded.transform([[y]])


def restoreLabel(y_encoded):
    encoder_loaded = joblib.load('Recognizer/traitRecognizer/model/encoder.joblib')
    return encoder_loaded.inverse_transform(y_encoded)


if __name__ == "__main__":
    y = scalerLabel(0)
    print(y)
    print(restoreLabel(y))
