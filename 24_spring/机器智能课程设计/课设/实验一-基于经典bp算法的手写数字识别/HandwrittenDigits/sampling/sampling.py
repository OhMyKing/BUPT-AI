import sys
import numpy as np
from PyQt5.QtWidgets import QApplication, QMainWindow, QPushButton, QLabel, QInputDialog
from PyQt5.QtGui import QPainter, QPen, QPixmap
from PyQt5.QtCore import Qt, QPoint
from scipy.interpolate import interp1d
import os


# 对手写轨迹点进行重采样，将手写轨迹点均匀地重新分布在一个固定数量的点（T）上，从而标准化不同长度的轨迹。
def resample_trajectory(points, T=8):
    # 如果 points 中的点是 QPoint 对象，将其转换为 [x, y] 的列表
    if points and isinstance(points[0], QPoint):
        points = [[p.x(), p.y()] for p in points if p is not None]
    # 将点列表转换为 NumPy 数组，形状为 (N, 2)，其中 N 是点的数量
    points = np.array(points)
    # 如果点的数量少于 2 个，则返回一个全零的矩阵，形状为 (T, 2)
    if len(points) < 2:
        return np.zeros((T, 2))
    # 计算每个点与前一个点之间的欧几里得距离，并累积求和得到 distance 距离数组
    x, y = points[:, 0], points[:, 1]
    distance = np.cumsum(np.sqrt(np.ediff1d(x, to_begin=0) ** 2 + np.ediff1d(y, to_begin=0) ** 2))
    # 如果累积距离的最后一个值为 0（即所有点重合），则返回一个全为该点的矩阵
    if distance[-1] == 0:
        return np.full((T, 2), points[0])

    # 将距离归一化到 [0, 1] 区间
    distance = distance / distance[-1]
    # 使用线性插值函数 interp1d 对 x 和 y 进行插值
    fx, fy = interp1d(distance, x, fill_value="extrapolate"), interp1d(distance, y, fill_value="extrapolate")
    # 生成一个等间距的序列 alpha，长度为 T
    alpha = np.linspace(0, 1, T)
    # 使用插值函数 fx 和 fy 计算新的 x 和 y 坐标
    x_resampled, y_resampled = fx(alpha), fy(alpha)
    return np.vstack((x_resampled, y_resampled)).T


def normalize_points(points):
    if not points.size:
        return points
    min_val = points.min(axis=0)
    max_val = points.max(axis=0) - min_val
    # 计算每个维度上的取值范围，即最大值减去最小值
    # 得到一个包含两个元素的数组 max_val，分别对应 x 和 y 坐标的取值范围
    if np.any(max_val == 0):
        return np.full(points.shape, 50)
    # 对点坐标进行归一化的操作，使其取值范围为0~100
    normalized_points = (points - min_val) / max_val * 100
    return normalized_points


def saveImage(label, category):
    # 创建基于类别的文件夹路径
    folderPath = os.path.join(os.getcwd(), 'sampling', 'img', str(category))
    if not os.path.exists(folderPath):
        os.makedirs(folderPath)  # 如果不存在则创建类别文件夹

    # 获取文件夹中已有的图片文件数量来决定新图片的编号
    existing_files = [f for f in os.listdir(folderPath) if
                      os.path.isfile(os.path.join(folderPath, f)) and f.endswith('.png')]

    # 确定新图片的序号
    if existing_files:
        existing_numbers = [int(f.split('_')[1].split('.')[0]) for f in existing_files if
                            '_' in f and f.split('_')[1].split('.')[0].isdigit()]
        if existing_numbers:
            next_number = max(existing_numbers) + 1
        else:
            next_number = 1
    else:
        next_number = 1

    # 使用类别和序号来命名图片
    fileName = f'image_{next_number}.png'
    filePath = os.path.join(folderPath, fileName)
    label.pixmap().save(filePath)  # 从 label 中获取 QPixmap 来保存


def processDrawing(points, ok, digit):
    # Resample and normalize the points
    resampled_points = resample_trajectory(points)
    normalized_points = normalize_points(resampled_points)

    if ok:
        data_row = np.hstack((normalized_points.flatten(), [digit]))
        with open('sampling\digit_dataset.csv', 'a') as f:
            np.savetxt(f, [data_row], delimiter=',', fmt='%f')


class DigitDrawer(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Digit Drawer")
        self.setGeometry(100, 100, 900, 700)  # Set the window size

        self.canvas = QPixmap(800, 600)  # Set the canvas size
        self.canvas.fill(Qt.white)
        self.label = QLabel(self)
        self.label.setPixmap(self.canvas)
        self.label.setGeometry(50, 50, 800, 600)  # Set the label position and size to match the canvas

        # Initialize drawing variables
        self.drawing = False
        self.lastPoint = QPoint()
        self.points = []

        # Setup UI components
        self.setupUI()

        self.n = 1

    def setupUI(self):
        # Start/Restart button
        self.startButton = QPushButton("Start", self)
        self.startButton.clicked.connect(self.on_start)
        self.startButton.setGeometry(820, 10, 70, 30)

        # Done button
        self.doneButton = QPushButton("Done", self)
        self.doneButton.clicked.connect(self.on_done)
        self.doneButton.setGeometry(820, 50, 70, 30)

    def on_start(self):
        self.drawing = True
        self.points = []
        self.canvas.fill(Qt.white)
        self.label.setPixmap(self.canvas)
        self.startButton.setText("Restart")

    def paintEvent(self, event):
        if self.drawing:
            painter = QPainter(self.label.pixmap())
            pen = QPen(Qt.black, 2, Qt.SolidLine)
            painter.setPen(pen)
            for i in range(len(self.points) - 1):
                if self.points[i] is None or self.points[i + 1] is None:
                    continue  # Skip if current or next point is None
                painter.drawLine(self.points[i], self.points[i + 1])
            self.label.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton and self.drawing:
            converted_pos = self.label.mapFromParent(event.pos())
            self.points.append(converted_pos)

    def mouseMoveEvent(self, event):
        if event.buttons() & Qt.LeftButton and self.drawing:
            converted_pos = self.label.mapFromParent(event.pos())
            self.points.append(converted_pos)
            # self.update()

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.LeftButton and self.drawing:
            converted_pos = self.label.mapFromParent(event.pos())
            self.points.append(converted_pos)
            self.points.append(None)  # Add None to mark the end of the drawing segment
            # self.update()

    def on_done(self):
        if self.points:
            digit, ok = self.askDigit()
            self.drawing = False
            saveImage(self.label, digit)
            print(digit)
            processDrawing(self.points, digit, ok)
            self.on_start()

    def askDigit(self):
        digit, ok = QInputDialog.getInt(self, "Input", "What digit did you draw? (0-9)", min=0, max=9)
        return digit, ok


if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = DigitDrawer()
    ex.show()
    sys.exit(app.exec_())
