from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5 import QtCore
from src.app.app import Ui_MainWindow
import sys


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.ui = Ui_MainWindow()
        self.ui.setupUi(self)

        # 设置窗口无边框
        self.setWindowFlags(QtCore.Qt.FramelessWindowHint)
        # 设置窗口背景透明
        self.setAttribute(QtCore.Qt.WA_TranslucentBackground)

        self.show()


if __name__ == "__main__":
    app = QApplication(sys.argv)

    MainWindow = MainWindow()
    ui = Ui_MainWindow()

    sys.exit(app.exec_())