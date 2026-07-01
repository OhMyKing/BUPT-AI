import os

from PyQt5.QtWidgets import QLabel
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import QTimer, Qt
import cv2

class CameraLabel(QLabel):
    def __init__(self, img_recognize, parent=None):
        super().__init__(parent)
        self.on = False
        self.img_recognizer = img_recognize

    def start(self):
        # 设置定时器，定时刷新摄像头画面
        self.cap = cv2.VideoCapture(0)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.updateFrame)
        self.timer.start(20)
        self.frame = None
        self.on = True

    def done(self):
        if self.on:
            self.timer.stop()
            self.cap.release()
            self.clear()


    def updateFrame(self):
        ret, self.frame = self.cap.read()
        if ret:
            # 将捕获的帧转换为QImage格式
            self.frame = cv2.cvtColor(self.frame, cv2.COLOR_BGR2RGB)
            h, w, ch = self.frame.shape
            bytes_per_line = ch * w

            # 保持原始的宽高比
            widget_ratio = self.width() / self.height()  # QLabel的宽高比
            frame_ratio = w / h  # 视频帧的宽高比
            if frame_ratio > widget_ratio:
                # 如果视频帧比较宽，则按QLabel的宽度来缩放帧，同时保持宽高比
                scale_width = self.width()
                scale_height = int(scale_width / frame_ratio)
            else:
                # 如果视频帧比较高，则按QLabel的高度来缩放帧，同时保持宽高比
                scale_height = self.height()
                scale_width = int(scale_height * frame_ratio)

            convert_to_Qt_format = QImage(self.frame.data, w, h, bytes_per_line, QImage.Format_RGB888)
            p = convert_to_Qt_format.scaled(scale_width, scale_height, Qt.KeepAspectRatio)

            # 为了让图像居中显示，可以计算起始点
            x = (self.width() - p.width()) // 2
            y = (self.height() - p.height()) // 2
            pixmap = QPixmap.fromImage(p)
            # 使用QPainter在QLabel上绘制图像
            self.setPixmap(pixmap)
            self.setAlignment(Qt.AlignCenter)  # 确保QLabel中的Pixmap居中显示

    def recognizeFrame(self):
        if self.frame is not None:
            cv2.imwrite('pictures/temp_image.jpg', self.frame)
        labels, img = self.img_recognizer.predict_label('pictures/temp_image.jpg')
        result = str()
        for label in labels:
            result = result + " " +str(label)
        return result
