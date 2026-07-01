import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.transforms as transforms
from Recognizer.imgRecognizer.split import SplitPhoto

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
                            nn.AdaptiveAvgPool2d((1, 1)),
                            nn.Flatten(), nn.Linear(64, 10))
    return net


class cnnRecognizer:
    def __init__(self, model_path='Recognizer/imgRecognizer/model/ckpt_aug.pth'):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = build_model()
        self.model_path = model_path
        self.set_model()
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((28, 28)),  # 确保图像大小为28x28
            transforms.ToTensor(),  # 将图像转换为PyTorch张量
        ])
        self.split = SplitPhoto()
        self.img_path = None
        self.labels = []

    def set_model(self):
        state_dict = torch.load(self.model_path)
        self.model.load_state_dict(state_dict['net'])
        self.model.to(self.device)
        self.model.eval()

    def process_image(self):
        imgs, processed_img = self.split.opencvdeal(self.img_path)

        return imgs, processed_img

    def predict_label(self, img =None):
        if img:
            self.img_path = img
        self.labels = []
        processed_imgs, processed_img = self.process_image()

        for i, img in enumerate(processed_imgs):
            image = self.transform(img)
            image = image.unsqueeze(0).to(self.device)  # 增加批次维度
            with torch.no_grad():  # 不计算梯度
                output = self.model(image)
                # 获取最大概率的预测结果
                _, predicted = torch.max(output, 1)
            self.labels.append(predicted.item())

        return self.labels, processed_img

