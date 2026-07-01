import torch
import torchvision
from torch import nn
from torch.utils import data
from torchvision import transforms

# 切换识别任务只需更改num_classes和载入的数据集即可

# 定义超参数
n_epochs = 10
batch_size = 256  # train_bsz = eval_bsz = batch_size
num_classes = 27  # 手写数字:10  手写英文字母:26
num_inputs, num_hiddens, num_outputs = 784, 256, 27
learning_rate = 0.1

# n个变量的累加器
class Accumulator:
    def __init__(self, n):
        self.data = [0.0] * n

    def add(self, *args):
        if len(args) == 1 and isinstance(args[0], tuple):
            args = args[0]
        self.data = [a + float(b) for a, b in zip(self.data, args)]

    def reset(self):
        self.data = [0.0] * len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]


# 定义加载MNIST手写数据集函数
def load_mnist(batch_size):
    transform = torchvision.transforms.Compose([
        # 通过ToTensor将图像数据从PIL类型变换成32位浮点数格式，并除以255使得所有像素的数值均在0～1之间
        torchvision.transforms.ToTensor(),
        # 通过Normalize对每个通道，将均值 (0.1307,) 和标准差 (0.3081,) 用于标准化图像数据
        torchvision.transforms.Normalize((0.1307,), (0.3081,))
    ])

    mnist_train = torchvision.datasets.MNIST('./MNIST/data/', train=True, download=True, transform=transform)
    mnist_test = torchvision.datasets.MNIST('./MNIST/data/', train=False, download=True, transform=transform)

    return (data.DataLoader(mnist_train, batch_size=batch_size, shuffle=True),
        data.DataLoader(mnist_test, batch_size=batch_size, shuffle=False))


# 定义加载EMNIST数据集子集，含英文字母
def load_emnist(batch_size):
    transform = transforms.Compose([
        torchvision.transforms.ToTensor(),
        # 对 EMNIST 数据集进行标准化处理
        torchvision.transforms.Normalize((0.1307,), (0.3081,))
    ])

    emnist_train = torchvision.datasets.EMNIST('./EMNIST/data/', split='letters', train=True, download=True, transform=transform)
    emnist_test = torchvision.datasets.EMNIST('./EMNIST/data/', split='letters', train=False, download=True, transform=transform)

    train_loader = data.DataLoader(emnist_train, batch_size=batch_size, shuffle=True)
    test_loader = data.DataLoader(emnist_test, batch_size=batch_size, shuffle=False)

    return train_loader, test_loader


class MLP(nn.Module):
    def __init__(self, num_inputs, num_hiddens, num_outputs):
        super(MLP, self).__init__()
        self.hidden = nn.Linear(num_inputs, num_hiddens)
        self.output = nn.Linear(num_hiddens, num_outputs)

    def forward(self, X):
        X = X.reshape((-1, num_inputs))
        H = torch.sigmoid(self.hidden(X))
        return self.output(H)


# 计算混淆矩阵，每一行之和表示该类别的真实样本数量，每一列之和表示被预测为该类别的样本数量
def confusion_matrix(y_hat, y, num_classes = num_classes):
    # 确定是否为多分类任务
    if len(y_hat.shape) > 1 and y_hat.shape[1] > 1:
        y_hat = y_hat.argmax(axis=1)

    matrix = torch.zeros((num_classes, num_classes), dtype=torch.int64)
    for true, pred in zip(y, y_hat):
        matrix[true.long(), pred.long()] += 1

    return matrix


# 计算某一类的准确率、查准率、查全率和F1-score
def evaluation_indicator(conf_matrix, Class):

    TP = float(conf_matrix[Class, Class].item())
    TN = float(conf_matrix.diag().sum().item() - TP)
    FP = float(conf_matrix[:, Class].sum().item() - TP)
    FN = float(conf_matrix[Class, :].sum().item() - TP)
    
    if (TP + FN) != 0:
      accuracy = (TP + TN) / (TP + TN + FP + FN)
      precision = TP / (TP + FP)
      recall = TP / (TP + FN)
      f1 = 2 * (precision * recall) / (precision + recall)
    else:
      accuracy = 0
      precision = 0
      recall = 0
      f1 = 0

    return accuracy, precision, recall, f1


# 计算宏平均
def macro_average(conf_matrix, num_classes = num_classes):
    # print(conf_matrix)
    macro_sum = Accumulator(4)
    for Class in range(num_classes):
        indicators = evaluation_indicator(conf_matrix, Class)
        macro_sum.add(indicators)

    macro_accuracy = macro_sum[0] / num_classes
    macro_precision = macro_sum[1] / num_classes
    macro_recall = macro_sum[2] / num_classes
    macro_f1 = macro_sum[3] / num_classes

    return macro_accuracy, macro_precision, macro_recall, macro_f1


def TP_FN_TN_FP(conf_matrix, Class):

    if (float(conf_matrix[Class, Class].item()) + float(conf_matrix[Class, :].sum().item() - float(conf_matrix[Class, Class].item()))) != 0:
      TP = float(conf_matrix[Class, Class].item())
      TN = float(conf_matrix.diag().sum().item() - TP)
      FP = float(conf_matrix[:, Class].sum().item() - TP)
      FN = float(conf_matrix[Class, :].sum().item() - TP)
    else:
      TP = 0
      TN = 0
      FP = 0
      FN = 0
    

    return TP, FN, TN, FP


# 计算微平均
def micro_average(conf_matrix, num_classes = num_classes):
    TP_FN_TN_FP_sum = Accumulator(4)
    for Class in range(num_classes):
        TP_FN_TN_FP_sum.add(TP_FN_TN_FP(conf_matrix, Class))

    TP = TP_FN_TN_FP_sum[0] / num_classes
    FN = TP_FN_TN_FP_sum[1] / num_classes
    TN = TP_FN_TN_FP_sum[2] / num_classes
    FP = TP_FN_TN_FP_sum[3] / num_classes

    micro_accuracy = (TP + TN) / (TP + TN + FP + FN)
    micro_precision = TP / (TP + FP)
    micro_recall = TP / (TP + FN)
    micro_f1 = 2 * (micro_precision * micro_recall) / (micro_precision + micro_recall)

    return micro_accuracy, micro_precision, micro_recall, micro_f1


# 训练一个epoch
def train_epoch(net, train_iter, loss, updater):
    # 将模型设置为训练模式
    if isinstance(net, torch.nn.Module):
        net.train()

    for X, y in train_iter:
        y_hat = net(X)
        l = loss(y_hat, y)

        # 计算梯度并更新参数
        if isinstance(updater, torch.optim.Optimizer):
            # 使用PyTorch内置的优化器和损失函数
            updater.zero_grad()
            l.mean().backward()
            updater.step()
        else:
            # 使用定制的优化器和损失函数
            l.sum().backward()
            updater(X.shape[0])


# 评估每训练完一个epoch的模型效果，评估指标为宏平均和微平均的准确率、查准率、查全率以及F1值
def evaluate_epoch(net, data_iter):
    # 将模型设置为评估模式
    if isinstance(net, torch.nn.Module):
        net.eval()
        with torch.no_grad():
            conf_matrix = torch.zeros((num_classes, num_classes), dtype=torch.int64)
            for X, y in data_iter:
                y_hat = net(X)
                conf_matrix += confusion_matrix(y_hat, y, num_classes)
            
            macro_accuracy, macro_precision, macro_recall, macro_f1 = macro_average(conf_matrix)
            micro_accuracy, micro_precision, micro_recall, micro_f1 = micro_average(conf_matrix)

    return macro_accuracy, macro_precision, macro_recall, macro_f1, micro_accuracy, micro_precision, micro_recall, micro_f1, conf_matrix


# 训练模型，并且每训练完一个epoch测试一次效果
def train(net, train_iter, test_iter, loss, num_epochs, optimizer):
    for epoch in range(num_epochs):
        train_epoch(net, train_iter, loss, optimizer)
        evaluate_result = evaluate_epoch(net, test_iter)

        # 规范化混淆矩阵输出
        # conf_matrix = evaluate_result[8].numpy()
        # conf_matrix_str = '\n'.join([' '.join([f'{item:6}' for item in row]) for row in conf_matrix])

        if epoch < num_epochs - 1 :
          print(f"""
          第{epoch + 1}轮训练：

          宏平均：
          准确率为{evaluate_result[0]}
          查准率为{evaluate_result[1]}
          查全率为{evaluate_result[2]}
          F1值为{evaluate_result[3]}

          微平均：
          准确率为{evaluate_result[4]}
          查准率为{evaluate_result[5]}
          查全率为{evaluate_result[6]}
          F1值为{evaluate_result[7]}""")
        else:
          print(f"""
          第{epoch + 1}轮训练：

          混淆矩阵：
          {evaluate_result[8]}

          宏平均：
          准确率为{evaluate_result[0]}
          查准率为{evaluate_result[1]}
          查全率为{evaluate_result[2]}
          F1值为{evaluate_result[3]}

          微平均：
          准确率为{evaluate_result[4]}
          查准率为{evaluate_result[5]}
          查全率为{evaluate_result[6]}
          F1值为{evaluate_result[7]}""")

# 载入手写数字数据集
# train_iter, test_iter = load_mnist(batch_size)
# 载入手写英文字母数据集
train_iter, test_iter = load_emnist(batch_size)

# 定义损失函数，采用交叉熵损失函数
loss = nn.CrossEntropyLoss(reduction = 'none')

# 初始化模型
# net_numbers = MLP(num_inputs, num_hiddens, num_outputs)
net_letters = MLP(num_inputs, num_hiddens, num_outputs)

# 定义优化器，采用随机梯度下降法
optimizer = torch.optim.SGD(net_letters.parameters(), lr = learning_rate)

train(net_letters, train_iter, test_iter, loss, n_epochs, optimizer)