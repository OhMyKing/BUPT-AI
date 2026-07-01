import os
import argparse
import torchvision
import torchvision.transforms as transforms
from torch.utils import data
import torch.optim as optim
from timm.scheduler import CosineLRScheduler
from torch.utils.data import DataLoader
from torchvision.datasets import MNIST
import torch
import torch.nn as nn
import torch.nn.functional as F
# from torchinfo import summary
import cv2
import numpy as np
from torch.utils.tensorboard import SummaryWriter
from split import SplitPhoto

writer = SummaryWriter("runs/miniRes_2")

import matplotlib.pyplot as plt

parser = argparse.ArgumentParser(description='PyTorch MNIST Training')
parser.add_argument('--lr', default=0.01, type=float, help='learning rate')
parser.add_argument('--resume', '-r', action='store_true',
                    help='resume from checkpoint')
parser.add_argument('--batch_size', default=512)
args = parser.parse_args()
device = "mps"


def loadData(batch_size):
    transform = transforms.Compose([transforms.Resize((28, 28)),
                                    transforms.ToTensor(),
                                    transforms.Normalize((0.1307,), (0.1307,))])
    root = os.path.expanduser("~/.cache")  # /home/niuniu/.cache/MNIST/raw/train-images-idx3-ubyte.gz
    train_dataset = MNIST(root, download=True, train=True, transform=transform)
    val_dataset = MNIST(root, download=True, train=True, transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=True)
    return train_loader, val_loader


class Residual(nn.Module):
    def __init__(self, input_channels, num_channels, use_1x1conv=False, strides=1):
        super().__init__()
        self.conv1 = nn.Conv2d(input_channels, num_channels, kernel_size=1, stride=strides, bias=False)
        self.conv2 = nn.Conv2d(num_channels, num_channels, kernel_size=3, padding=1, bias=False)
        self.conv3 = nn.Conv2d(num_channels, num_channels, kernel_size=1, bias=False)
        if use_1x1conv:
            self.conv4 = nn.Conv2d(input_channels, num_channels, kernel_size=1, stride=strides)
        else:
            self.conv4 = None
        self.bn1 = nn.BatchNorm2d(input_channels)
        self.bn2 = nn.BatchNorm2d(num_channels)
        self.bn3 = nn.BatchNorm2d(num_channels)

    # full pre_activation
    def forward(self, x):
        y = self.conv1(F.relu(self.bn1(x)))
        y = self.conv2(F.relu(self.bn2(y)))
        y = self.conv3(F.relu(self.bn3(y)))
        if self.conv4:
            x = self.conv4(x)
        y += x
        return y


def resnet_block(input_channels, num_channels, num_residuals, first_block=False):
    blk = []
    for i in range(num_residuals):
        if i == 0 and not first_block:
            blk.append(Residual(input_channels, num_channels, use_1x1conv=True, strides=2))
        else:
            blk.append(Residual(num_channels, num_channels))
    return blk


def build_model():
    b1 = nn.Sequential(nn.Conv2d(1, 16, kernel_size=3, stride=1, padding=1),
                       nn.BatchNorm2d(16), nn.ReLU())
    n = 1
    net = nn.Sequential(b1, *resnet_block(16, 16, 2*n, first_block=True),
                            *resnet_block(16, 32, 2*n),
                            *resnet_block(32, 64, 2*n),
                            *resnet_block(64, 64, 2*n),
                            nn.AdaptiveAvgPool2d((1, 1)),
                            nn.Flatten(), nn.Linear(64, 10))
    net.to(device)
    return net


best_acc = 0


def train(epoch, optimizer):
    global best_acc

    print('\nEpoch: %d' % epoch)
    net.train()
    num_batches = len(train_loader)
    for batch_idx, (inputs, targets) in enumerate(train_loader):
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = net(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        if batch_idx % 100 == 0:
            print(
                f'Train Epoch: {epoch} [{batch_idx * len(inputs)}/{len(train_loader.dataset)} ({100. * batch_idx / num_batches:.0f}%)]\tLoss: {loss.item():.6f}')
            writer.add_scalar('training loss', loss.item(),
                              epoch * len(train_loader) + batch_idx)

    test_acc = evaluate_accuracy(net, val_loader, device)
    print(f'Train Epoch: {epoch} Test acc: {test_acc}')
    writer.add_scalar("Acc/top1", test_acc, epoch)

    if test_acc > best_acc:
        print('Saving..')
        state = {
            'net': net.state_dict(),
            'acc': test_acc,
            'epoch': epoch,
        }
        if not os.path.isdir('checkpoint'):
            os.mkdir('checkpoint')
        torch.save(state, './checkpoint/ckpt.pth')
        best_acc = test_acc


def evaluate_accuracy(net, val_loader, device=None):
    """使用GPU计算模型在数据集上的精度"""
    net.eval()
    if not device:
        device = next(iter(net.parameters())).device
    accuracy = []
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            labels = labels.to(device)
            with torch.cuda.amp.autocast():
                outputs = net(images)
            _, predicted = torch.max(outputs, 1)
            accuracy.append((predicted == labels).float().mean().item())

    return torch.tensor(accuracy).mean().item()


def accuracy(output, target, topk=(1,)):
    pred = output.topk(max(topk), -1, True, True)[1].t()
    correct = pred.eq(target.view(1, -1))
    return [float(correct[:k].reshape(-1).float().sum(0, keepdim=True)) for k in topk]


if __name__ == "__main__":
    train_loader, val_loader = loadData(args.batch_size)
    net = build_model()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(net.parameters(), lr=args.lr,
                          momentum=0.9, weight_decay=5e-4)
    scheduler = torch.optim.lr_scheduler.MultiStepLR(optimizer, milestones=[76, 112, 146], gamma=0.1)

    best_acc = 0
    for epoch in range(1, 15):
        train(epoch, optimizer)

    state_dict = torch.load('checkpoint/ckpt.pth')
    net.load_state_dict(state_dict['net'])

    split = SplitPhoto()
    imgs = split.opencvdeal('MyHandWriting-master/photos/ph-te12.jpg')
    number=''
    for img in imgs:
        t = transforms.ToPILImage()

        transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Grayscale(),
            # transforms.Resize((28, 28)),
            transforms.ToTensor()])
        image = transform(img).to(device).unsqueeze(0)
        probabilities = F.softmax(net(image))
        number += str(np.argmax(probabilities.cpu().detach().numpy()))
    print("识别的数字结果:",number)
