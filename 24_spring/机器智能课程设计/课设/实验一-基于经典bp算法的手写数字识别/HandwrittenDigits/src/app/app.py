import cv2
from PyQt5 import QtCore, QtWidgets
from PyQt5.QtWidgets import QFileDialog
from PyQt5.QtGui import QPixmap

from src.widget.CameraLabel import CameraLabel
from src.widget.DrawerWidget import DrawerWidget
from Recognizer.imgRecognizer.engine import cnnRecognizer

import src.img.source_rc
# 资源文件请勿删除

class Ui_MainWindow(object):
    def __init__(self):
        super().__init__()
        self.img = None
        self.filePath1 = None
        self.filePath2 = None
        self.recognizer = cnnRecognizer()
        # 初始化识别流程，优化交互体验
        img_path = 'pictures/MultiNumbers/te05.jpg'
        self.recognizer.img_path = img_path
        self.recognizer.predict_label()

    def setupUi(self, MainWindow):
        # 主窗口
        MainWindow.setObjectName("MainWindow")
        MainWindow.resize(1505, 922)    #窗口大小
        MainWindow.setStyleSheet("")

        # 中心窗口
        self.centralwidget = QtWidgets.QWidget(MainWindow)
        self.centralwidget.setObjectName("centralwidget")

        # 堆叠窗口  用于管理多个页面。
        self.stackedWidget = QtWidgets.QStackedWidget(self.centralwidget)
        #几何位置和大小
        self.stackedWidget.setGeometry(QtCore.QRect(320, 50, 841, 731))     
        self.stackedWidget.setObjectName("stackedWidget")

        # 菜单页面
        self.menu = QtWidgets.QWidget()
        self.menu.setObjectName("menu")

        # 在 menu 页面中创建一个标签 label。（/img/background.png）
        self.label = QtWidgets.QLabel(self.menu)
        self.label.setEnabled(False)
        self.label.setGeometry(QtCore.QRect(20, 190, 821, 471))
        #设置标签的样式表，使其背景图像为 background.png 并具有圆角。
        self.label.setStyleSheet("border-image: url(:/img/background.png);\n"
                                 "border-radius:30px;\n"
                                  "")    
        self.label.setText("")
        self.label.setObjectName("label")

        # 在 menu 页面中创建一个按钮 page1_Button。并设置它的
        self.page1_Button = QtWidgets.QPushButton(self.menu)
        # 设置按钮的几何位置和大小。按钮位于 (320, 380) 的位置，宽度为 221 像素，高度为 121 像素。
        self.page1_Button.setGeometry(QtCore.QRect(320, 380, 221, 121))
        self.page1_Button.setMinimumSize(QtCore.QSize(0, 121))
        # 设置按钮的样式表，定义了正常状态、悬停状态和按下状态下的样式。
        self.page1_Button.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/单字识别.png);\n"
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
        # 将按钮的文本设置为空字符串。这意味着按钮不会显示任何文本，只是一个图像按钮。
        self.page1_Button.setText("")
        # 设置按钮的自动重复延迟为300毫秒。这意味着当按钮被按住时，每300毫秒会重复发送一次按钮按下事件。这对于某些需要长按功能的按钮可能会很有用。
        self.page1_Button.setAutoRepeatDelay(300)   
        self.page1_Button.setObjectName("page1_Button")

        # 设置按钮 page4_Button
        self.page4_Button = QtWidgets.QPushButton(self.menu)
        self.page4_Button.setGeometry(QtCore.QRect(570, 510, 221, 121))
        self.page4_Button.setMinimumSize(QtCore.QSize(0, 121))
        self.page4_Button.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/相机识别.png);\n"
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
        self.page4_Button.setText("")
        self.page4_Button.setAutoRepeatDelay(300)
        self.page4_Button.setObjectName("page4_Button")

        # 设置按钮 page3_Button
        self.page3_Button = QtWidgets.QPushButton(self.menu)
        self.page3_Button.setGeometry(QtCore.QRect(320, 510, 221, 121))
        self.page3_Button.setMinimumSize(QtCore.QSize(0, 121))
        self.page3_Button.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/手迹识别.png);\n"
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
        self.page3_Button.setText("")
        self.page3_Button.setAutoRepeatDelay(300)
        self.page3_Button.setObjectName("page3_Button")

        # 设置按钮 page2_Button
        self.page2_Button = QtWidgets.QPushButton(self.menu)
        self.page2_Button.setGeometry(QtCore.QRect(570, 380, 221, 121))
        self.page2_Button.setMinimumSize(QtCore.QSize(0, 121))
        self.page2_Button.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/多字识别.png);\n"
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
        self.page2_Button.setText("")
        self.page2_Button.setAutoRepeatDelay(300)
        self.page2_Button.setObjectName("page2_Button")

        # 设置标签 label_2  （/img/digit.png）
        self.label_2 = QtWidgets.QLabel(self.menu)
        self.label_2.setEnabled(True)
        # 标签的左上角位于 (-60, -160)，宽度为 1211 像素，高度为 1141 像素。负值表示标签的左上角在窗口的左上角之外。
        self.label_2.setGeometry(QtCore.QRect(-60, -160, 1211, 1141))
        self.label_2.setStyleSheet("image: url(:/img/digit.png);")
        self.label_2.setText("")
        self.label_2.setObjectName("label_2")

        # 设置关闭界面按钮
        self.closs_Button = QtWidgets.QPushButton(self.menu)
        self.closs_Button.setGeometry(QtCore.QRect(40, 210, 41, 31))
        self.closs_Button.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/x.png);\n"
                                        "    border: none; /* 如果不需要边框可以设置为none */\n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:hover {\n"
                                        "    border-radius: 50px;\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:pressed {\n"
                                        "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                        "}")
        # 将 closs_Button 按钮的文本设置为空字符串。这样一来，按钮将不会显示任何文本。
        self.closs_Button.setText("")
        self.closs_Button.setObjectName("closs_Button")

        # 将以下控件在其父控件（self.menu）的子控件堆叠顺序中提升到顶层
        self.label.raise_()
        self.label_2.raise_()
        self.page3_Button.raise_()
        self.page4_Button.raise_()
        self.page2_Button.raise_()
        self.page1_Button.raise_()
        self.closs_Button.raise_()
        # 将 menu 页面添加到 stackedWidget 中，stackedWidget 是一个堆叠式的容器控件，可以用来显示多个页面，但一次只显示一个页面。
        self.stackedWidget.addWidget(self.menu)


        # 创建 page1 页面
        self.page1 = QtWidgets.QWidget()
        self.page1.setObjectName("page1")

        # 设置标签 label_2  （/img/background1.png）
        self.label_3 = QtWidgets.QLabel(self.page1)
        self.label_3.setEnabled(False)
        self.label_3.setGeometry(QtCore.QRect(20, 190, 821, 471))
        self.label_3.setStyleSheet("border-image: url(:/img/background1.png);\n"
                                   "border-radius:30px;\n"
                                   "")
        self.label_3.setText("")
        self.label_3.setObjectName("label_3")

        # 创建标签 display
        self.display = QtWidgets.QLabel(self.page1)
        self.display.setGeometry(QtCore.QRect(110, 240, 251, 281))
        self.display.setStyleSheet("background-color: rgba(255, 255, 255, 80);")
        self.display.setText("")
        self.display.setObjectName("display")

        # 创建page1页面的按钮 closs
        self.closs = QtWidgets.QPushButton(self.page1)
        self.closs.setGeometry(QtCore.QRect(40, 210, 41, 31))
        self.closs.setStyleSheet("QPushButton {\n"
                                 "    border-radius: 20px;\n"
                                 "    image: url(:/img/x.png);\n"
                                 "    border: none; /* 如果不需要边框可以设置为none */\n"
                                 "}\n"
                                 "\n"
                                 "QPushButton:hover {\n"
                                 "    border-radius: 50px;\n"
                                 "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                 "}\n"
                                 "\n"
                                 "QPushButton:pressed {\n"
                                 "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                 "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                 "}")
        self.closs.setText("")
        self.closs.setObjectName("closs")

        # 创建page1页面的按钮 reup_Button（重新上传）
        self.reup_Button = QtWidgets.QPushButton(self.page1)
        self.reup_Button.setGeometry(QtCore.QRect(150, 550, 171, 61))
        self.reup_Button.setStyleSheet("QPushButton {\n"
                                       "    border-radius: 20px;\n"
                                       "    image: url(:/img/重新上传.png);\n"
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
        self.reup_Button.setText("")
        self.reup_Button.setObjectName("reup_Button")

        # 创建page1页面的按钮 up_Button (上传)
        self.up_Button = QtWidgets.QPushButton(self.page1)
        self.up_Button.setGeometry(QtCore.QRect(150, 550, 171, 61))
        self.up_Button.setStyleSheet("QPushButton {\n"
                                     "    border-radius: 20px;\n"
                                     "    image: url(:/img/上传.png);\n"
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
        self.up_Button.setText("")
        self.up_Button.setObjectName("up_Button")

        # 创建page1页面的识别按钮
        self.reconize_Button_2 = QtWidgets.QPushButton(self.page1)
        self.reconize_Button_2.setGeometry(QtCore.QRect(410, 390, 111, 41))
        self.reconize_Button_2.setStyleSheet("QPushButton {\n"
                                             "    border-radius: 10px;\n"
                                             "    image: url(:/img/箭头.png);\n"
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
        self.reconize_Button_2.setText("")
        self.reconize_Button_2.setObjectName("reconize_Button_2")

        self.label_5 = QtWidgets.QLabel(self.page1)
        self.label_5.setGeometry(QtCore.QRect(560, 280, 231, 61))
        # 设置标签的样式表，包括字体为 15 磅的黑体（"黑体"）字体和白色文本颜色。
        self.label_5.setStyleSheet("font: 15pt \"黑体\";\n"
                                   "color:white;\n"
                                   "")
        self.label_5.setObjectName("label_5")

        self.digit = QtWidgets.QLabel(self.page1)
        self.digit.setGeometry(QtCore.QRect(610, 380, 121, 181))
        self.digit.setStyleSheet("font: 120pt \"黑体\";\n"
                                 "color: white;")
        self.digit.setObjectName("digit")

        self.menu_Button = QtWidgets.QPushButton(self.page1)
        self.menu_Button.setGeometry(QtCore.QRect(40, 250, 41, 31))
        self.menu_Button.setStyleSheet("QPushButton {\n"
                                       "    border-radius: 20px;\n"
                                       "    image: url(:/img/主页.png);\n"
                                       "    border: none; /* 如果不需要边框可以设置为none */\n"
                                       "}\n"
                                       "\n"
                                       "QPushButton:hover {\n"
                                       "    border-radius: 50px;\n"
                                       "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                       "}\n"
                                       "\n"
                                       "QPushButton:pressed {\n"
                                       "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                       "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                       "}")
        self.menu_Button.setText("")
        self.menu_Button.setObjectName("menu_Button")

        self.label_3.raise_()
        self.closs.raise_()
        self.display.raise_()
        self.reup_Button.raise_()
        self.up_Button.raise_()
        self.reconize_Button_2.raise_()
        self.label_5.raise_()
        self.digit.raise_()
        self.menu_Button.raise_()
        self.stackedWidget.addWidget(self.page1)


        # 创建页面page2
        self.page2 = QtWidgets.QWidget()
        self.page2.setObjectName("page2")

        self.label_7 = QtWidgets.QLabel(self.page2)
        self.label_7.setEnabled(False)
        self.label_7.setGeometry(QtCore.QRect(20, 190, 821, 471))
        self.label_7.setStyleSheet("border-image: url(:/img/background1.png);\n"
                                   "border-radius:30px;\n"
                                   "")
        self.label_7.setText("")
        self.label_7.setObjectName("label_7")

        self.reup_Button_2 = QtWidgets.QPushButton(self.page2)
        self.reup_Button_2.setGeometry(QtCore.QRect(40, 210, 41, 31))
        self.reup_Button_2.setStyleSheet("QPushButton {\n"
                                         "    border-radius: 20px;\n"
                                         "    image: url(:/img/x.png);\n"
                                         "    border: none; /* 如果不需要边框可以设置为none */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:hover {\n"
                                         "    border-radius: 50px;\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:pressed {\n"
                                         "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                         "}")
        self.reup_Button_2.setText("")
        self.reup_Button_2.setObjectName("reup_Button_2")

        self.display_2 = QtWidgets.QLabel(self.page2)
        self.display_2.setGeometry(QtCore.QRect(110, 240, 251, 281))
        self.display_2.setStyleSheet("background-color: rgba(255, 255, 255, 80);")
        self.display_2.setText("")
        self.display_2.setObjectName("display_2")

        self.up_Button_1 = QtWidgets.QPushButton(self.page2)
        self.up_Button_1.setGeometry(QtCore.QRect(150, 550, 171, 61))
        self.up_Button_1.setStyleSheet("QPushButton {\n"
                                       "    border-radius: 20px;\n"
                                       "    image: url(:/img/上传.png);\n"
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
        self.up_Button_1.setText("")
        self.up_Button_1.setObjectName("up_Buttton")

        self.reup_Button_1 = QtWidgets.QPushButton(self.page2)
        self.reup_Button_1.setGeometry(QtCore.QRect(150, 550, 171, 61))
        self.reup_Button_1.setStyleSheet("QPushButton {\n"
                                         "    border-radius: 20px;\n"
                                         "    image: url(:/img/重新上传.png);\n"
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
        self.reup_Button_1.setText("")
        self.reup_Button_1.setObjectName("up")

        self.reconize_Button = QtWidgets.QPushButton(self.page2)
        self.reconize_Button.setGeometry(QtCore.QRect(410, 390, 111, 41))
        self.reconize_Button.setStyleSheet("QPushButton {\n"
                                           "    border-radius: 10px;\n"
                                           "    image: url(:/img/箭头.png);\n"
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
        self.reconize_Button.setText("")
        self.reconize_Button.setObjectName("reconize_Button")

        self.label_11 = QtWidgets.QLabel(self.page2)
        self.label_11.setGeometry(QtCore.QRect(560, 280, 231, 61))
        self.label_11.setStyleSheet("font: 15pt \"黑体\";\n"
                                    "color:white;\n"
                                    "")
        self.label_11.setObjectName("label_11")

        self.label_12 = QtWidgets.QLabel(self.page2)
        self.label_12.setGeometry(QtCore.QRect(570, 300, 191, 271))
        self.label_12.setStyleSheet("font: 15pt \"黑体\";\n"
                                    "color: white;")
        self.label_12.setObjectName("label_12")

        self.menu_Button_1 = QtWidgets.QPushButton(self.page2)
        self.menu_Button_1.setGeometry(QtCore.QRect(40, 250, 41, 31))
        self.menu_Button_1.setStyleSheet("QPushButton {\n"
                                         "    border-radius: 20px;\n"
                                         "    image: url(:/img/主页.png);\n"
                                         "    border: none; /* 如果不需要边框可以设置为none */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:hover {\n"
                                         "    border-radius: 50px;\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:pressed {\n"
                                         "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                         "}")
        self.menu_Button_1.setText("")
        self.menu_Button_1.setObjectName("menu_Button_1")

        self.label_7.raise_()
        self.reup_Button_2.raise_()
        self.display_2.raise_()
        self.reup_Button_1.raise_()
        self.reconize_Button.raise_()
        self.label_11.raise_()
        self.up_Button_1.raise_()
        self.label_12.raise_()
        self.menu_Button_1.raise_()
        self.stackedWidget.addWidget(self.page2)


        # 创建页面page3 （手写轨迹识别）
        self.page_3 = QtWidgets.QWidget()
        self.page_3.setObjectName("page_3")

        self.label_8 = QtWidgets.QLabel(self.page_3)
        self.label_8.setEnabled(False)
        self.label_8.setGeometry(QtCore.QRect(20, 190, 821, 471))
        self.label_8.setStyleSheet("border-image: url(:/img/background1.png);\n"
                                   "border-radius:30px;\n"
                                   "")
        self.label_8.setText("")
        self.label_8.setObjectName("label_8")

        self.pushButton_11 = QtWidgets.QPushButton(self.page_3)
        self.pushButton_11.setGeometry(QtCore.QRect(40, 210, 41, 31))
        self.pushButton_11.setStyleSheet("QPushButton {\n"
                                         "    border-radius: 20px;\n"
                                         "    image: url(:/img/x.png);\n"
                                         "    border: none; /* 如果不需要边框可以设置为none */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:hover {\n"
                                         "    border-radius: 50px;\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:pressed {\n"
                                         "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                         "}")
        self.pushButton_11.setText("")
        self.pushButton_11.setObjectName("pushButton_11")

        self.menu_Button_2 = QtWidgets.QPushButton(self.page_3)
        self.menu_Button_2.setGeometry(QtCore.QRect(40, 250, 41, 31))
        self.menu_Button_2.setStyleSheet("QPushButton {\n"
                                         "    border-radius: 20px;\n"
                                         "    image: url(:/img/主页.png);\n"
                                         "    border: none; /* 如果不需要边框可以设置为none */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:hover {\n"
                                         "    border-radius: 50px;\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:pressed {\n"
                                         "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                         "}")
        self.menu_Button_2.setText("")
        self.menu_Button_2.setObjectName("menu_Button_2")
        
        # 创建了一个堆叠式容器控件 page_3_inside，
        # 它可以在 page_3 页面中容纳多个子控件，并且一次只显示一个子控件。
        # 这种设计可以用来实现页面内部的多个视图或内容切换功能
        self.page_3_inside = QtWidgets.QStackedWidget(self.page_3)
        self.page_3_inside.setGeometry(QtCore.QRect(100, 270, 661, 361))
        self.page_3_inside.setStyleSheet("background-color: rgba(255, 255, 255, 0);")
        self.page_3_inside.setObjectName("page_3_inside")
        

        # 创建页面page_3_1 （手写轨迹识别——开始页面）
        self.page_3_1 = QtWidgets.QWidget()
        self.page_3_1.setObjectName("page_3_1")

        self.start_Button = QtWidgets.QPushButton(self.page_3_1)
        self.start_Button.setGeometry(QtCore.QRect(450, 120, 141, 71))
        self.start_Button.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/开始.png);\n"
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
                                        "}")
        self.start_Button.setText("")
        self.start_Button.setObjectName("start_Button")

        self.display_3 = QtWidgets.QLabel(self.page_3_1)
        self.display_3.setGeometry(QtCore.QRect(20, 0, 311, 311))
        self.display_3.setStyleSheet("background-color: rgba(255, 255, 255, 80);\n"
                                     "font: 87 11pt \"思源黑体 CN Heavy\";\n"
                                     "border-radius: 20px;")
        self.display_3.setText("")
        self.display_3.setObjectName("display_3")


        # 向堆叠式容器控件 page_3_inside 添加页面 page_3_1
        self.page_3_inside.addWidget(self.page_3_1)
        # self.page_3_2 = QtWidgets.QWidget()

        # 创建一个新的页面 page_3_2，这个页面是手写数字轨迹识别页面
        # 其中的参数 self.recognizer 传递给了 DrawerWidget 的构造函数
        self.page_3_2 = DrawerWidget(self.recognizer)
        self.page_3_2.setObjectName("page_3_2")
        # self.display_5 = QtWidgets.QLabel(self.page_3_2)
        # self.display_5.setGeometry(QtCore.QRect(20, 0, 311, 311))
        # self.display_5.setStyleSheet("font: 87 11pt \"思源黑体 CN Heavy\";\n"
        #                             "background-color: rgba(255, 255, 255, 254);\n"
        #                             "border-radius: 20px;")
        # self.display_5.setText("")
        # self.display_5.setObjectName("display_5")
        # self.label_6 = QtWidgets.QLabel(self.page_3_2)
        # self.label_6.setGeometry(QtCore.QRect(380, -10, 271, 61))
        # self.label_6.setStyleSheet("font: 22pt \"黑体\";\n"
        #                           "color:white;\n"
        #                           "")
        # self.label_6.setObjectName("label_6")
        # self.digit_2 = QtWidgets.QLabel(self.page_3_2)
        # self.digit_2.setGeometry(QtCore.QRect(450, 60, 121, 181))
        # self.digit_2.setStyleSheet("font: 150pt \"黑体\";\n"
        #                           "color: white;")
        # self.digit_2.setObjectName("digit_2")
        # self.reconize_Button_3 = QtWidgets.QPushButton(self.page_3_2)
        # self.reconize_Button_3.setGeometry(QtCore.QRect(380, 270, 121, 51))
        # self.reconize_Button_3.setStyleSheet("QPushButton {\n"
        #                                     "    border-radius: 10px;\n"
        #                                     "    image: url(:/img/开始识别.png);\n"
        #                                     "    border: none; /* 如果不需要边框可以设置为none */\n"
        #                                     "}\n"
        #                                     "\n"
        #                                     "QPushButton:hover {\n"
        #                                     "    background-color: rgba(255, 255, 255, 1); /* 添加半透明遮罩 */\n"
        #                                     "}\n"
        #                                     "\n"
        #                                     "QPushButton:pressed {\n"
        #                                     "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
        #                                     "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
        #                                     "}\n"
        #                                     "")
        # self.reconize_Button_3.setText("")
        # self.reconize_Button_3.setObjectName("reconize_Button_3")
        # self.reconize_Button_4 = QtWidgets.QPushButton(self.page_3_2)
        # self.reconize_Button_4.setGeometry(QtCore.QRect(520, 270, 121, 51))
        # self.reconize_Button_4.setStyleSheet("QPushButton {\n"
        #                                     "    border-radius: 10px;\n"
        #                                     "    image: url(:/img/清空.png);\n"
        #                                     "    border: none; /* 如果不需要边框可以设置为none */\n"
        #                                     "}\n"
        #                                     "\n"
        #                                     "QPushButton:hover {\n"
        #                                     "    background-color: rgba(255, 255, 255, 1); /* 添加半透明遮罩 */\n"
        #                                     "}\n"
        #                                     "\n"
        #                                     "QPushButton:pressed {\n"
        #                                     "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
        #                                     "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
        #                                     "}\n"
        #                                     "")
        # self.reconize_Button_4.setText("")
        # self.reconize_Button_4.setObjectName("reconize_Button_4")

        # 将 page_3_2 页面添加到 page_3_inside 堆叠式容器控件中，并将 page_3 页面添加到 stackedWidget 堆叠式容器控件中。
        # 这样，通过切换 stackedWidget 中的页面，可以在界面上显示 page_3 页面的内容，
        # 而 page_3 页面中又包含了 page_3_inside 堆叠式容器控件，可以在其中切换显示 page_3_1（开始） 和 page_3_2 （轨迹识别）页面的内容。
        self.page_3_inside.addWidget(self.page_3_2)
        self.stackedWidget.addWidget(self.page_3)


        
        self.page_4 = QtWidgets.QWidget()
        self.page_4.setObjectName("page_4")

        self.label_9 = QtWidgets.QLabel(self.page_4)
        self.label_9.setEnabled(False)
        self.label_9.setGeometry(QtCore.QRect(20, 190, 821, 471))
        self.label_9.setStyleSheet("border-image: url(:/img/background1.png);\n"
                                   "border-radius:30px;\n"
                                   "")
        self.label_9.setText("")
        self.label_9.setObjectName("label_9")

        self.closs_2 = QtWidgets.QPushButton(self.page_4)
        self.closs_2.setGeometry(QtCore.QRect(40, 210, 41, 31))
        self.closs_2.setStyleSheet("QPushButton {\n"
                                   "    border-radius: 20px;\n"
                                   "    image: url(:/img/x.png);\n"
                                   "    border: none; /* 如果不需要边框可以设置为none */\n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:hover {\n"
                                   "    border-radius: 50px;\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:pressed {\n"
                                   "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                   "}")
        self.closs_2.setText("")
        self.closs_2.setObjectName("closs_2")

        self.menu_Button_3 = QtWidgets.QPushButton(self.page_4)
        self.menu_Button_3.setGeometry(QtCore.QRect(40, 250, 41, 31))
        self.menu_Button_3.setStyleSheet("QPushButton {\n"
                                         "    border-radius: 20px;\n"
                                         "    image: url(:/img/主页.png);\n"
                                         "    border: none; /* 如果不需要边框可以设置为none */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:hover {\n"
                                         "    border-radius: 50px;\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                         "}\n"
                                         "\n"
                                         "QPushButton:pressed {\n"
                                         "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                         "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                         "}")
        self.menu_Button_3.setText("")
        self.menu_Button_3.setObjectName("menu_Button_3")

        # 创建了一个堆叠式容器控件 page_4_inside
        self.page_4_inside = QtWidgets.QStackedWidget(self.page_4)
        self.page_4_inside.setGeometry(QtCore.QRect(90, 220, 691, 401))
        self.page_4_inside.setStyleSheet("background-color: rgba(255, 255, 255, 0);")
        self.page_4_inside.setObjectName("page_4_inside")


        # page_4_1（开始页面）
        self.page_4_1 = QtWidgets.QWidget()
        self.page_4_1.setObjectName("page_4_1")

        self.display_4 = QtWidgets.QLabel(self.page_4_1)
        self.display_4.setGeometry(QtCore.QRect(150, 10, 361, 241))
        self.display_4.setStyleSheet("background-color: rgba(255, 255, 255, 80);\n"
                                     "font: 87 11pt \"思源黑体 CN Heavy\";")
        self.display_4.setText("")
        self.display_4.setObjectName("display_4")

        self.start_Button_2 = QtWidgets.QPushButton(self.page_4_1)
        self.start_Button_2.setGeometry(QtCore.QRect(260, 300, 141, 71))
        self.start_Button_2.setStyleSheet("QPushButton {\n"
                                          "    border-radius: 20px;\n"
                                          "    image: url(:/img/开始.png);\n"
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
                                          "}")
        self.start_Button_2.setText("")
        self.start_Button_2.setObjectName("start_Button_2")

        self.page_4_inside.addWidget(self.page_4_1)


        # page_4_2（相机识别页面）
        self.page_4_2 = QtWidgets.QWidget()
        self.page_4_2.setObjectName("page_4_2")
        
        # 创建了一个名为 display_6 的自定义相机标签 CameraLabel
        self.display_6 = CameraLabel(self.recognizer,self.page_4_2)
        self.display_6.setGeometry(QtCore.QRect(150, 10, 361, 241))
        self.display_6.setStyleSheet("background-color: rgba(255, 255, 255, 000);\n"
                                     "font: 87 11pt \"思源黑体 CN Heavy\";")
        self.display_6.setText("")
        self.display_6.setObjectName("display_6")

        # 识别按钮
        self.reconize_Button_5 = QtWidgets.QPushButton(self.page_4_2)
        self.reconize_Button_5.setGeometry(QtCore.QRect(540, 110, 121, 51))
        self.reconize_Button_5.setStyleSheet("QPushButton {\n"
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
        self.reconize_Button_5.setText("")
        self.reconize_Button_5.setObjectName("reconize_Button_5")

        self.label_4 = QtWidgets.QLabel(self.page_4_2)
        self.label_4.setGeometry(QtCore.QRect(240, 260, 221, 31))
        self.label_4.setStyleSheet("font: 87 14pt \"思源黑体 CN Heavy\";")
        self.label_4.setObjectName("label_4")

        self.label_10 = QtWidgets.QLabel(self.page_4_2)
        self.label_10.setGeometry(QtCore.QRect(150, 310, 361, 81))
        self.label_10.setStyleSheet("font: 75 12pt \"思源黑体 CN Bold\";")
        self.label_10.setObjectName("label_10")

        self.page_4_inside.addWidget(self.page_4_2)
        self.stackedWidget.addWidget(self.page_4)

        
        # 设置了主窗口的中央部件和状态栏
        MainWindow.setCentralWidget(self.centralwidget)
        self.statusbar = QtWidgets.QStatusBar(MainWindow)
        self.statusbar.setObjectName("statusbar")
        MainWindow.setStatusBar(self.statusbar)

        self.retranslateUi(MainWindow)

        # 设置堆叠式容器控件的当前显示页面
        self.stackedWidget.setCurrentIndex(4)
        # 设置 page_3_inside 内部堆叠式容器控件的当前索引为 0，即显示第 1 个页面。
        self.page_3_inside.setCurrentIndex(0)
        self.page_4_inside.setCurrentIndex(0)

        # 连接按钮的点击信号与关闭窗口的槽函数
        self.closs_Button.clicked.connect(MainWindow.close)  # type: ignore
        # 当 closs_Button 按钮被点击时，调用 MainWindow.close() 函数关闭窗口。
        self.closs.clicked.connect(MainWindow.close)  # type: ignore
        self.reup_Button_2.clicked.connect(MainWindow.close)  # type: ignore
        self.pushButton_11.clicked.connect(MainWindow.close)  # type: ignore
        self.closs_2.clicked.connect(MainWindow.close)  # type: ignore

        # 根据对象的名称自动连接对象的信号与槽函数。
        # 这可以确保在界面中添加新的元素时，它们的信号与槽函数会自动连接起来，而无需手动编写连接代码。
        QtCore.QMetaObject.connectSlotsByName(MainWindow)

        # 当这些按钮被点击时，会调用 switch_to_page 方法来切换 stackedWidget 显示的页面
        self.page1_Button.clicked.connect(lambda: self.switch_to_page(self.stackedWidget, 1))
        self.page2_Button.clicked.connect(lambda: self.switch_to_page(self.stackedWidget, 2))
        self.page3_Button.clicked.connect(lambda: self.switch_to_page(self.stackedWidget, 3))
        self.page4_Button.clicked.connect(lambda: self.switch_to_page(self.stackedWidget, 4))

        # 返回菜单
        self.menu_Button.clicked.connect(lambda: self.switch_to_page(self.stackedWidget, 0))
        self.menu_Button_1.clicked.connect(lambda: self.switch_to_page(self.stackedWidget, 0))
        self.menu_Button_2.clicked.connect(
            lambda: (self.switch_to_page(self.stackedWidget, 0), self.page_3_inside.setCurrentIndex(0)))
        self.menu_Button_3.clicked.connect(lambda: (
        self.switch_to_page(self.stackedWidget, 0), self.display_6.done(), self.page_4_inside.setCurrentIndex((0))))

        # 在手写轨迹识别和相机识别中的开始按钮
        self.start_Button.clicked.connect(lambda: self.switch_to_page(self.page_3_inside, 1))
        self.start_Button_2.clicked.connect(
            lambda: (self.switch_to_page(self.page_4_inside, 1), self.display_6.start()))

        # 上传图片
        self.up_Button.clicked.connect(lambda: self.uploadImage(1))
        self.up_Button_1.clicked.connect(lambda: self.uploadImage(2))
        self.reup_Button.clicked.connect(lambda: self.uploadImage(1))
        self.reup_Button_1.clicked.connect(lambda: self.uploadImage(2))

        # 识别数字（单字和多字识别）
        self.reconize_Button_2.clicked.connect(lambda: self.recognizeAndDisplay(self.filePath1, 1))
        self.reconize_Button.clicked.connect(lambda: self.recognizeAndDisplay(self.filePath2, 2))
        # self.reconize_Button.clicked.connect(lambda: self.recognizeAndDisplay(self.img))

        # 将下面标签设置为不可见
        self.label_5.setVisible(False)
        self.digit.setVisible(False)
        self.label_11.setVisible(False)
        self.label_12.setVisible(False)
        self.label_4.setVisible(False)
        self.label_10.setVisible(False)

        # 相机识别
        self.stackedWidget.setCurrentIndex(0)
        self.reconize_Button_5.clicked.connect(self.recognizeFrame)

    def switch_to_page(self, wiget, index):
        wiget.setCurrentIndex(index)

    # 从本地文件上传图片
    def uploadImage(self, index):
        fileUrlTuple = QFileDialog.getOpenFileUrl(filter="Image files (*.jpg *.png)")
        fileUrl = fileUrlTuple[0]  # 获取返回的第一个元素，即QUrl对象
        if fileUrl.isLocalFile():  # 确保是本地文件
            filePath = fileUrl.toLocalFile()  # 从URL对象中提取文件路径
            pixmap = QPixmap(filePath)
            if not pixmap.isNull():  # 检查图片是否成功加载
                if index == 1:
                    self.filePath1 = filePath
                    self.display.setPixmap(pixmap.scaled(self.display.size(), QtCore.Qt.KeepAspectRatio))
                    self.up_Button.setVisible(False)
                    self.reup_Button.setVisible(True)
                else:
                    self.filePath2 = filePath
                    self.display_2.setPixmap(pixmap.scaled(self.display.size(), QtCore.Qt.KeepAspectRatio))
                    self.up_Button_1.setVisible(False)
                    self.reup_Button_1.setVisible(True)
            else:
                return

    # 单字和多字的识别
    def recognizeAndDisplay(self, filePath, index):
        if not filePath:
            return
        if index == 1:
            # 单字识别（cnnRecognizer）
            self.recognizer.img_path = filePath
            result, processed_img = self.recognizer.predict_label()

            #  cv2.imwrite是OpenCV 库中的一个函数，用于将图像保存到文件中。
            cv2.imwrite('pictures/temp_image.jpg', processed_img)
            # 创建了一个 QPixmap 对象，并将刚才保存的图像文件 'pictures/temp_image.jpg' 加载到这个对象中。
            pixmap = QPixmap('pictures/temp_image.jpg')
            if not pixmap.isNull():
                # 将加载的图像缩放到适合显示控件的大小，并显示在用户界面上。
                self.display.setPixmap(pixmap.scaled(self.display.size(), QtCore.Qt.KeepAspectRatio))

            self.digit.setText(str(result[0]))
            self.label_5.setVisible(True)
            self.digit.setVisible(True)
            self.recognizer.labels = []
        else:
            # 多字识别
            self.recognizer.img_path = filePath
            result, processed_img = self.recognizer.predict_label()

            cv2.imwrite('pictures/temp_image.jpg', processed_img)
            pixmap = QPixmap('pictures/temp_image.jpg')
            if not pixmap.isNull():
                self.display_2.setPixmap(pixmap.scaled(self.display.size(), QtCore.Qt.KeepAspectRatio))

            digits = str()
            for digit in result:
                digits = digits + " " + str(digit)
            self.label_12.setText(digits)
            self.label_11.setVisible(True)
            self.label_12.setVisible(True)
            self.recognizer.labels = []

    # 相机识别
    def recognizeFrame(self):
        labels = self.display_6.recognizeFrame()
        self.label_10.setText(labels)
        self.label_10.setVisible(True)
        self.label_4.setVisible(True)

    # 在界面中设置文本，用于在界面初始化时或在语言变化时调用。
    def retranslateUi(self, MainWindow):
        _translate = QtCore.QCoreApplication.translate
        MainWindow.setWindowTitle(_translate("MainWindow", "MainWindow"))
        self.label_5.setText(_translate("MainWindow", "您输入的数字是"))
        self.digit.setText(_translate("MainWindow", "5"))
        self.label_11.setText(_translate("MainWindow", "图片中的数字有"))
        self.label_12.setText(_translate("MainWindow", "123456789012345678\n"
                                                       "1234567890"))
        self.page_3_2.label_6.setText(_translate("MainWindow", "您写下的数字是"))
        self.page_3_2.digit_2.setText(_translate("MainWindow", "5"))
        self.label_4.setText(_translate("MainWindow", "识别到的数字有："))
        self.label_10.setText(_translate("MainWindow", "173636434873384989849823953444"))
