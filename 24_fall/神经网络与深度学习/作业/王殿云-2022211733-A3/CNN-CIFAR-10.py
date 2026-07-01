import os
import math
import time
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
import numpy as np
from tqdm import tqdm
from sklearn.metrics import confusion_matrix
import seaborn as sns

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

torch.manual_seed(42)
np.random.seed(42)

batch_size = 64

# 数据转换
transform_train = transforms.Compose([
    transforms.RandomCrop(32, padding=4),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
])

transform_test = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
])

# 加载CIFAR-10数据集
trainset = torchvision.datasets.CIFAR10(root='./data', train=True, download=True, transform=transform_train)
trainloader = DataLoader(trainset, batch_size=batch_size, shuffle=True, num_workers=2)

testset = torchvision.datasets.CIFAR10(root='./data', train=False, download=True, transform=transform_test)
testloader = DataLoader(testset, batch_size=batch_size, shuffle=False, num_workers=2)

classes = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

class Bottleneck(nn.Module):
    def __init__(self, in_channels, growth_rate, dropout_rate=0, norm_type='batchnorm'):
        super().__init__()
        inner_channels = 4 * growth_rate
        self.norm1 = self._get_norm_layer(norm_type, in_channels)
        self.conv1 = nn.Conv2d(in_channels, inner_channels, kernel_size=1, bias=False)
        self.norm2 = self._get_norm_layer(norm_type, inner_channels)
        self.conv2 = nn.Conv2d(inner_channels, growth_rate, kernel_size=3, padding=1, bias=False)
        self.dropout = nn.Dropout(dropout_rate)

    def _get_norm_layer(self, norm_type, channels):
        if norm_type == 'batchnorm':
            return nn.BatchNorm2d(channels)
        elif norm_type == 'instancenorm':
            return nn.InstanceNorm2d(channels)
        else:
            raise ValueError(f"Unsupported normalization type: {norm_type}")

    def forward(self, x):
        out = self.conv1(F.relu(self.norm1(x)))
        out = self.conv2(F.relu(self.norm2(out)))
        out = self.dropout(out)
        out = torch.cat([out, x], 1)
        return out

class Transition(nn.Module):
    def __init__(self, in_channels, out_channels, norm_type='batchnorm'):
        super().__init__()
        self.norm = self._get_norm_layer(norm_type, in_channels)
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)

    def _get_norm_layer(self, norm_type, channels):
        if norm_type == 'batchnorm':
            return nn.BatchNorm2d(channels)
        elif norm_type == 'instancenorm':
            return nn.InstanceNorm2d(channels)
        elif norm_type == 'groupnorm':
            return nn.GroupNorm(32, channels)
        else:
            raise ValueError(f"Unsupported normalization type: {norm_type}")

    def forward(self, x):
        out = self.conv(F.relu(self.norm(x)))
        out = F.avg_pool2d(out, 2)
        return out

class DenseNet(nn.Module):
    def __init__(self, growth_rate=12, depth=100, reduction=0.5, num_classes=10, bottleneck=True, dropout_rate=0, norm_type='batchnorm'):
        super().__init__()
        n_dense_blocks = (depth - 4) // 3
        if bottleneck:
            n_dense_blocks //= 2

        num_channels = 2 * growth_rate
        self.conv1 = nn.Conv2d(3, num_channels, kernel_size=3, padding=1, bias=False)
        self.dense1 = self._make_dense(num_channels, growth_rate, n_dense_blocks, bottleneck, dropout_rate, norm_type)
        num_channels += n_dense_blocks * growth_rate
        out_channels = int(math.floor(num_channels * reduction))
        self.trans1 = Transition(num_channels, out_channels, norm_type)

        num_channels = out_channels
        self.dense2 = self._make_dense(num_channels, growth_rate, n_dense_blocks, bottleneck, dropout_rate, norm_type)
        num_channels += n_dense_blocks * growth_rate
        out_channels = int(math.floor(num_channels * reduction))
        self.trans2 = Transition(num_channels, out_channels, norm_type)

        num_channels = out_channels
        self.dense3 = self._make_dense(num_channels, growth_rate, n_dense_blocks, bottleneck, dropout_rate, norm_type)
        num_channels += n_dense_blocks * growth_rate

        self.norm = self._get_norm_layer(norm_type, num_channels)
        self.fc = nn.Linear(num_channels, num_classes)

        self._initialize_weights()

    def _make_dense(self, in_channels, growth_rate, n_dense_blocks, bottleneck, dropout_rate, norm_type):
        layers = []
        for i in range(int(n_dense_blocks)):
            if bottleneck:
                layers.append(Bottleneck(in_channels, growth_rate, dropout_rate, norm_type))
            else:
                layers.append(nn.Conv2d(in_channels, growth_rate, kernel_size=3, padding=1, bias=False))
            in_channels += growth_rate
        return nn.Sequential(*layers)

    def _get_norm_layer(self, norm_type, channels):
        if norm_type == 'batchnorm':
            return nn.BatchNorm2d(channels)
        elif norm_type == 'instancenorm':
            return nn.InstanceNorm2d(channels, affine=True)
        elif norm_type == 'groupnorm':
            num_groups = 32
            while channels % num_groups != 0:
                num_groups //= 2
            if num_groups == 0:
                num_groups = 1
            return nn.GroupNorm(num_groups, channels)
        else:
            raise ValueError(f"Unsupported normalization type: {norm_type}")

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight)
            elif isinstance(m, (nn.BatchNorm2d, nn.GroupNorm)):
                if m.weight is not None:
                    nn.init.constant_(m.weight, 1)
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.InstanceNorm2d):
                if m.weight is not None:
                    nn.init.constant_(m.weight, 1)
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        out = self.conv1(x)
        out = self.trans1(self.dense1(out))
        out = self.trans2(self.dense2(out))
        out = self.dense3(out)
        out = F.relu(self.norm(out))
        out = F.adaptive_avg_pool2d(out, (1, 1))
        out = out.view(out.size(0), -1)
        return self.fc(out)
    
def evaluate_model(model, testloader):
    model.eval()
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for data in testloader:
            images, labels = data
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    accuracy = 100 * correct / total
    return accuracy, all_preds, all_labels

def train_model(model, trainloader, testloader, epochs=300, lr=0.1, momentum=0.9, weight_decay=0):
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(model.parameters(), lr=lr, momentum=momentum, weight_decay=weight_decay)

    def lr_scheduler(epoch):
        if epoch < 150:
            return 0.1
        elif epoch < 225:
            return 0.01
        else:
            return 0.001

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=lr_scheduler)

    train_losses, train_accs, test_accs = [], [], []

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        progress_bar = tqdm(enumerate(trainloader), total=len(trainloader), desc=f'Epoch {epoch+1}/{epochs}')

        for i, (inputs, labels) in progress_bar:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            train_loss = running_loss / (i + 1)
            train_acc = 100. * correct / total
            progress_bar.set_postfix({
                'loss': f'{train_loss:.4f}',
                'acc': f'{train_acc:.2f}%'
            })

        train_losses.append(train_loss)
        train_accs.append(train_acc)

        # 评估训练结果
        test_acc, _, _ = evaluate_model(model, testloader)
        test_accs.append(test_acc)

        print(f'Epoch {epoch+1}/{epochs}, Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%, Test Acc: {test_acc:.2f}%')

        scheduler.step()

    return train_losses, train_accs, test_accs

# 实验2： 最终实验设置
final_experiments = {'name': 'DenseNet-128+L2', 'depth': 160, 'norm_type': 'batchnorm', 'dropout_rate': 0.2, 'weight_decay': 1e-4}

print(f"\nRunning experiment: {final_experiments['name']}")
model = DenseNet(growth_rate=24, depth=final_experiments['depth'], reduction=0.5, num_classes=10, bottleneck=True, dropout_rate=final_experiments['dropout_rate'], norm_type=final_experiments['norm_type']).to(device)

train_losses, train_accs, test_accs = train_model(model, trainloader, testloader, epochs=250, lr=0.1, momentum=0.9, weight_decay=final_experiments['weight_decay'])

final_test_acc, all_preds, all_labels = evaluate_model(model, testloader)

final_results = {
    'train_losses': train_losses,
    'train_accs': train_accs,
    'test_accs': test_accs,
    'final_test_acc': final_test_acc,
    'all_preds': all_preds,
    'all_labels': all_labels
}

torch.save(model.state_dict(), f"densenet_{final_experiments['name'].lower().replace(' ', '_')}.pth")

plt.figure(figsize=(20, 15))

# Plot training loss
plt.subplot(2, 2, 1)
plt.plot(final_results['train_losses'], label='Training Loss')
plt.title('Training Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

# Plot training and test accuracy
plt.subplot(2, 2, 2)
plt.plot(final_results['train_accs'], label='Training Accuracy')
plt.plot(final_results['test_accs'], label='Test Accuracy', linestyle='--')
plt.title('Accuracy Comparison')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()

# Plot confusion matrix
plt.subplot(2, 2, 3)
cm = confusion_matrix(final_results['all_labels'], final_results['all_preds'])
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.title(f'{final_experiments["name"]} - Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('True')

# Add text box with experiment details
plt.subplot(2, 2, 4)
plt.axis('off')
experiment_details = (
    f"Experiment: {final_experiments['name']}\n"
    f"Depth: {final_experiments['depth']}\n"
    f"Normalization: {final_experiments['norm_type']}\n"
    f"Dropout Rate: {final_experiments['dropout_rate']}\n"
    f"Weight Decay: {final_experiments['weight_decay']}\n"
    f"Final Test Accuracy: {final_results['final_test_acc']:.4f}"
)
plt.text(0.1, 0.5, experiment_details, fontsize=12, va='center')

plt.tight_layout()
plt.savefig(f"densenet_{final_experiments['name'].lower().replace(' ', '_')}_results.png", dpi=300, bbox_inches='tight')
plt.show()

print("\nFinal Test Accuracies:")
print(f"{final_results['final_test_acc']:.2f}")