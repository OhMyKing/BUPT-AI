from PyQt5.QtCore import Qt
from PyQt5.QtGui import QPixmap, QPainter, QPen,QFont
from PyQt5.QtWidgets import QPushButton


class PuzzlePiece(QPushButton):
    def __init__(self, index, parent=None):
        super().__init__(parent)
        self.p_img = None
        self.index = index

    def paintEvent(self, event):
        if self.p_img is None:
            super().paintEvent(event)
            return

        painter = QPainter(self)
        pixmap = QPixmap(self.p_img)
        bg_pixmap = pixmap.scaled(self.size(), Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)

        painter.drawPixmap(0, 0, bg_pixmap)

        # 设置绘制边框的笔
        pen = QPen()
        pen.setColor(Qt.black)  # 边框颜色
        pen.setWidth(2)  # 边框宽度
        painter.setPen(pen)

        # 绘制矩形边框，留出一定的边距以显示边框
        rect = self.rect().adjusted(0, 0, 0, 0)  # 调整矩形大小以适应边框宽度
        painter.drawRect(rect)

        # 设置文本的字体和大小
        font = QFont()
        font.setBold(True)
        font.setPointSize(30)  # 可根据需要调整字体大小
        painter.setFont(font)

        # 设置文本颜色
        painter.setPen(Qt.black)  # 设置为白色或根据背景选择合适的颜色

        # 绘制文本（显示index）
        painter.drawText(rect, Qt.AlignCenter, str(self.index))
