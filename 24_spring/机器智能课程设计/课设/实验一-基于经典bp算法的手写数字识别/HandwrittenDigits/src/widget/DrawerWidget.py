from PyQt5.QtWidgets import QPushButton, QLabel, QWidget
from PyQt5.QtGui import QPainter, QPen, QPixmap
from PyQt5.QtCore import Qt, QPoint, QRect
from sampling.sampling import resample_trajectory, normalize_points
from Recognizer.traitRecognizer.recognize import knnRecognizer
import numpy as np


class DrawerWidget(QWidget):
    def __init__(self ,img_recognizer):
        super().__init__()
        self.label = QLabel(self)
        self.label.setGeometry(QRect(20, 0, 311, 311))
        self.label.setStyleSheet("font: 11pt \"思源黑体 CN Heavy\";\n"
                                 "background-color: rgba(255, 255, 255, 254);\n"
                                 "border-radius: 20px;")
        self.label.setText("请在这里书写")
        self.label.setObjectName("display_5")

        # 创建一个空白的绘图画布（canvas）,填充画布为白色,将 self.canvas 设置为 self.label 的显示内容。
        self.canvas = QPixmap(311, 311)
        self.canvas.fill(Qt.white)
        self.label.setPixmap(self.canvas)

        self.label_6 = QLabel(self)
        self.label_6.setGeometry(QRect(380, -10, 271, 61))
        self.label_6.setStyleSheet("font: 16pt \"黑体\";\n"
                                   "color:white;\n"
                                   "")
        self.label_6.setObjectName("label_6")

        self.digit_2 = QLabel(self)
        self.digit_2.setGeometry(QRect(450, 60, 121, 181))
        self.digit_2.setStyleSheet("font: 80pt \"黑体\";\n"
                                   "color: white;")
        self.digit_2.setObjectName("digit_2")

        # 识别按钮
        self.reconize_Button_3 = QPushButton(self)
        self.reconize_Button_3.setGeometry(QRect(380, 270, 121, 51))
        self.reconize_Button_3.setStyleSheet("QPushButton {\n"
                                             "    border-radius: 10px;\n"
                                             "    image: url(:/img/开始识别.png);\n"
                                             "    border: none; /* 如果不需要边框可以设置为none */\n"
                                             "}\n"
                                             "\n"
                                             "QPushButton:hover {\n"
                                             "    background-color: rgba(255, 255, 255, 1); /* 添加半透明遮罩 */\n"
                                             "}\n"
                                             "\n"
                                             "QPushButton:pressed {\n"
                                             "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                             "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                             "}\n"
                                             "")
        # self.reconize_Button_3.setText("")
        self.reconize_Button_3.setObjectName("reconize_Button_3")

        # 清空按钮
        self.reconize_Button_4 = QPushButton(self)
        self.reconize_Button_4.setGeometry(QRect(520, 270, 121, 51))
        self.reconize_Button_4.setStyleSheet("QPushButton {\n"
                                             "    border-radius: 10px;\n"
                                             "    image: url(:/img/清空.png);\n"
                                             "    border: none; /* 如果不需要边框可以设置为none */\n"
                                             "}\n"
                                             "\n"
                                             "QPushButton:hover {\n"
                                             "    background-color: rgba(255, 255, 255, 1); /* 添加半透明遮罩 */\n"
                                             "}\n"
                                             "\n"
                                             "QPushButton:pressed {\n"
                                             "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                             "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                             "}\n"
                                             "")
        self.reconize_Button_4.setObjectName("reconize_Button_4")

        self.drawing = False
        self.lastPoint = QPoint()
        self.points = []
        self.digit = 0

        self.reconize_Button_4.clicked.connect(self.on_start)
        self.reconize_Button_3.clicked.connect(self.on_done)

        self.digit_2.setVisible(False)
        self.label_6.setVisible(False)

        self.img_recognizer = img_recognizer

    # 初始化绘图环境。具体来说，清空绘图点列表并重置画布为白色
    def on_start(self):
        self.points = []
        self.canvas.fill(Qt.white)
        self.label.setPixmap(self.canvas)

    # 绘图时处理画图事件
    def paintEvent(self, event):
        if self.drawing:
            painter = QPainter(self.label.pixmap())
            # 创建一个黑色、宽度为 15 像素、实线的画笔。
            pen = QPen(Qt.black, 15, Qt.SolidLine)
            painter.setPen(pen)
            # 循环遍历 self.points 列表中的点（除了最后一个点）
            for i in range(len(self.points) - 1):
                if self.points[i] is None or self.points[i + 1] is None:
                    continue
                #  绘制从 self.points[i] 到 self.points[i + 1] 的线条。
                painter.drawLine(self.points[i], self.points[i + 1])
            self.label.update()

    # 当鼠标左键按下时，启用绘图模式并将鼠标位置转换为相对于 QLabel 的坐标，然后将该位置添加到 points 列表中。
    def mousePressEvent(self, event):
        self.drawing = True
        # 当按下左键并且处于绘图模式时
        if event.button() == Qt.LeftButton and self.drawing:
            converted_pos = self.label.mapFromParent(event.pos())
            # 将转换后的坐标 (converted_pos) 添加到 points 列表中。这个列表存储了所有绘图过程中记录的点。
            self.points.append(converted_pos)

    def mouseMoveEvent(self, event):
        # 当鼠标左键按下并移动时，更新绘图状态
        if event.buttons() & Qt.LeftButton and self.drawing:
            # 将当前鼠标位置转换为相对于 QLabel 的局部坐标，并将该位置添加到 points 列表中
            converted_pos = self.label.mapFromParent(event.pos())
            self.points.append(converted_pos)
            self.update()

    def mouseReleaseEvent(self, event):
        # 当鼠标左键释放时，结束绘图状态，将当前位置转换为相对于 QLabel 的局部坐标，
        if event.button() == Qt.LeftButton and self.drawing:
            converted_pos = self.label.mapFromParent(event.pos())
            self.points.append(converted_pos)
            # 并将该位置以及一个 None 值添加到 points 列表中，然后调用 update 方法触发重绘。
            self.points.append(None)  
            self.update()

    # 绘图完成时执行的一系列操作
    # 如果points不为空，则执行识别、显示结果并重置画布以准备下一次绘图。
    def on_done(self):
        if self.points:
            self.recognize()
            self.display()
            self.on_start()

    def recognize(self):
        # 图像识别（cnn）
        self.label.pixmap().save('pictures/temp_image.jpg')
        labels, img = self.img_recognizer.predict_label('pictures/temp_image.jpg')
        label1 = labels[0]
        print(label1)

        # 手写轨迹识别（knn）
        trait_recognizer = knnRecognizer()
        # 数据重新采样
        resampled_points = resample_trajectory(self.points[:-1])
        # 对点坐标进行归一化的操作，使其取值范围为0~100
        normalized_points = normalize_points(resampled_points)
        # 将归一化后的二维点坐标数组展开为一维数组，展开后的数组形状为 (2*N,)
        flattened_points = np.round(normalized_points.flatten()).astype(int)
        label2= trait_recognizer.predict_label(flattened_points)

        # 实验发现9的不同书写方式可以被不同的识别方案解决，故采用简单投票判断
        if label1 == 9 or label2 == 9:
            self.digit = 9
        elif label2 == label1:
            self.digit = label2
        else:
            self.digit = label1

    def display(self):
        self.label_6.setText("您写下的数字是")
        self.digit_2.setText(str(self.digit))
        self.digit_2.setVisible(True)
        self.label_6.setVisible(True)


if __name__ == '__main__':
    recognizer = knnRecognizer()
    X = np.array(
        [100.000000, 0.000000, 90.811547, 14.340277, 84.405029, 28.696709, 69.417544, 43.009136, 58.489892, 57.361072,
         44.794022, 71.682206, 27.676280, 85.909381, 0.000000, 100.000000])
    result = recognizer.predict_label(X)
    print(result)
