from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5 import QtCore
from src.app.app import Ui_MainWindow
import sys


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.app = Ui_MainWindow()
        # 调用 self.app 实例的 setupUi 方法，并将当前窗口实例 self 作为参数传递给它。
        # 将 Ui_MainWindow 类中定义的所有 UI 元素和布局应用到当前窗口实例 self 中。
        self.app.setupUi(self)

        # 设置窗口无边框
        self.setWindowFlags(QtCore.Qt.FramelessWindowHint)
        # 设置窗口背景透明
        self.setAttribute(QtCore.Qt.WA_TranslucentBackground)

        self.show()


if __name__ == "__main__":
    app = QApplication(sys.argv)

    MainWindow = MainWindow()
    # ui = Ui_MainWindow()

    sys.exit(app.exec_())  # 运行应用等待退出
    # 进入应用程序的主事件循环，开始处理用户输入事件。
    # 这个方法会一直运行，直到调用 app.quit() 或 app.exit() 退出应用程序。
    # sys.exit() 确保程序能干净地退出，并返回应用程序的退出状态码。

