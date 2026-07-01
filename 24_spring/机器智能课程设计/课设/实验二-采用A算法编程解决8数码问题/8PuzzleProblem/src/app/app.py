import os

from PyQt5 import QtCore, QtWidgets
from PyQt5.QtCore import QTimer
import json

from PyQt5.QtWidgets import QFileDialog, QMessageBox

from src.widget.PuzzleBoard import PuzzleBoard
from solver.judge import is_solvable


class Ui_MainWindow(object):
    def setupUi(self, MainWindow):
        MainWindow.setObjectName("MainWindow")
        MainWindow.resize(800, 600)

        self.centralwidget = QtWidgets.QWidget(MainWindow)
        self.centralwidget.setObjectName("centralwidget")
        self.background = QtWidgets.QLabel(self.centralwidget)
        self.background.setGeometry(QtCore.QRect(30, 130, 691, 391))
        self.background.setStyleSheet("border-image: url(:/img/background.jpg);\n"
                                      "border-radius: 30px;")
        self.background.setText("")
        self.background.setObjectName("background")

        self.mode = None
        self.p1_mode = None
        self.p2_mode = None
        self.config = None
        self.game_started = False
        self.initialConfig()

        self.p1_background = QtWidgets.QWidget(self.centralwidget)
        self.p1_background.setGeometry(QtCore.QRect(100, 230, 231, 231))
        self.p1_background.setStyleSheet("background-color: rgb(103, 137, 163);")
        self.p1_background.setObjectName("p1_background")

        self.p2_background = QtWidgets.QWidget(self.centralwidget)
        self.p2_background.setGeometry(QtCore.QRect(430, 230, 231, 231))
        self.p2_background.setStyleSheet("background-color: rgb(103, 137, 163);")
        self.p2_background.setObjectName("p2_background")

        self.p1_board = PuzzleBoard(100, 230, self.centralwidget, 231, self.p1_mode, self.config)
        self.p1_board.setObjectName("p1_board")
        self.p2_board = PuzzleBoard(430, 230, self.centralwidget, 231, self.p2_mode, self.config)
        self.p2_board.setObjectName("p2_board")

        self.vs = QtWidgets.QLabel(self.centralwidget)
        self.vs.setGeometry(QtCore.QRect(290, 250, 171, 181))
        self.vs.setStyleSheet("image: url(:/img/vs.png);")
        self.vs.setText("")
        self.vs.setObjectName("vs")

        self.ready = QtWidgets.QLabel(self.centralwidget)
        self.ready.setGeometry(QtCore.QRect(330, 290, 91, 91))
        self.ready.setStyleSheet("image: url(:/img/3.PNG);")
        self.ready.setText("")
        self.ready.setObjectName("ready")

        self.close = QtWidgets.QPushButton(self.centralwidget)
        self.close.setGeometry(QtCore.QRect(50, 150, 31, 31))
        self.close.setStyleSheet("QPushButton {\n"
                                 "    border-radius: 20px;\n"
                                 "    image: url(:/img/x.png);\n"
                                 "    border: none; \n"
                                 "}\n"
                                 "\n"
                                 "QPushButton:hover {\n"
                                 "    border-radius: 15px;\n"
                                 "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                 "}\n"
                                 "\n"
                                 "QPushButton:pressed {\n"
                                 "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                 "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                 "}")
        self.close.setText("")
        self.close.setObjectName("close")
        self.set = QtWidgets.QPushButton(self.centralwidget)
        self.set.setGeometry(QtCore.QRect(90, 150, 31, 31))
        self.set.setStyleSheet("QPushButton {\n"
                               "    border-radius: 20px;\n"
                               "    image: url(:/img/set.png);\n"
                               "    border: none; \n"
                               "}\n"
                               "\n"
                               "QPushButton:hover {\n"
                               "    border-radius: 15px;\n"
                               "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                               "}\n"
                               "\n"
                               "QPushButton:pressed {\n"
                               "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                               "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                               "}")
        self.set.setText("")
        self.set.setObjectName("set")
        self.pushButton = QtWidgets.QPushButton(self.centralwidget)
        self.pushButton.setGeometry(QtCore.QRect(330, 310, 101, 51))
        self.pushButton.setStyleSheet("QPushButton {\n"
                                      "    image: url(:/img/箭头.png);\n"
                                      "    border: none; \n"
                                      "}\n"
                                      "\n"
                                      "QPushButton:hover {\n"
                                      "    border-radius: 3px;\n"
                                      "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                      "}\n"
                                      "\n"
                                      "QPushButton:pressed {\n"
                                      "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                      "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                      "}")
        self.pushButton.setText("")
        self.pushButton.setObjectName("pushButton")
        self.p1_count = 0
        self.p2_count = 0
        self.count_1 = QtWidgets.QLabel(self.centralwidget)
        self.count_1.setGeometry(QtCore.QRect(130, 470, 141, 31))
        self.count_1.setStyleSheet("image: url(:/img/步数.png);\n"
                                   "background-color: rgba(255, 255, 255, 0);\n"
                                   "font: 75 30pt \"Berlin Sans FB\";\n"
                                   "")
        self.count_1.setText("")
        self.count_1.setObjectName("count_1")
        self.count_textLabel_1 = QtWidgets.QLabel(self.centralwidget)
        self.count_textLabel_1.setGeometry(QtCore.QRect(210, 466, 141, 31))
        self.count_textLabel_1.setStyleSheet("background-color: rgba(255, 255, 255, 0);\n"
                                             "font: 75 20pt \"Berlin Sans FB\";\n"
                                             "")
        self.count_textLabel_1.setText(str(self.p1_count))
        self.count_textLabel_1.setObjectName("count_textLabel_1")

        self.count_2 = QtWidgets.QLabel(self.centralwidget)
        self.count_2.setGeometry(QtCore.QRect(460, 470, 141, 31))
        self.count_2.setStyleSheet("image: url(:/img/步数.png);\n"
                                   "background-color: rgba(255, 255, 255, 0);\n"
                                   "")
        self.count_2.setText("")
        self.count_2.setObjectName("count_2")
        self.count_textLabel_2 = QtWidgets.QLabel(self.centralwidget)
        self.count_textLabel_2.setGeometry(QtCore.QRect(540, 466, 141, 31))
        self.count_textLabel_2.setStyleSheet("background-color: rgba(255, 255, 255, 0);\n"
                                             "font: 75 20pt \"Berlin Sans FB\";\n"
                                             "")
        self.count_textLabel_2.setText(str(self.p2_count))
        self.count_textLabel_2.setObjectName("count_textLabel_2")

        self.P1 = QtWidgets.QLabel(self.centralwidget)
        self.P1.setGeometry(QtCore.QRect(50, 190, 71, 51))
        self.P1.setStyleSheet("image: url(:/img/P1.png);")
        self.P1.setText("")
        self.P1.setObjectName("P1")
        self.P2 = QtWidgets.QLabel(self.centralwidget)
        self.P2.setGeometry(QtCore.QRect(630, 190, 71, 51))
        self.P2.setStyleSheet("image: url(:/img/P2.png);")
        self.P2.setText("")
        self.P2.setObjectName("P2")
        self.inside_window = QtWidgets.QStackedWidget(self.centralwidget)
        self.inside_window.setGeometry(QtCore.QRect(210, 160, 341, 341))
        self.inside_window.setStyleSheet("background-color: rgba(255, 255, 255, 0);\n"
                                         "")
        self.inside_window.setObjectName("inside_window")
        self.pve_setting = QtWidgets.QWidget()
        self.pve_setting.setStyleSheet("image: url(:/img/设置页-pve.png);\n"
                                       "")
        self.pve_setting.setObjectName("pve_setting")
        self.close_1 = QtWidgets.QPushButton(self.pve_setting)
        self.close_1.setGeometry(QtCore.QRect(10, 10, 31, 31))
        self.close_1.setStyleSheet("QPushButton {\n"
                                   "    border-radius: 20px;\n"
                                   "    image: url(:/img/x_1.png);\n"
                                   "    border: none; \n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:hover {\n"
                                   "    border-radius: 15px;\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:pressed {\n"
                                   "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                   "}")
        self.close_1.setText("")
        self.close_1.setObjectName("close_1")
        self.pvp = QtWidgets.QPushButton(self.pve_setting)
        self.pvp.setGeometry(QtCore.QRect(170, 80, 31, 31))
        self.pvp.setStyleSheet("QPushButton {\n"
                               "    border-radius: 20px;\n"
                               "    image: url(:/img/round.png);\n"
                               "    border: none; \n"
                               "}\n"
                               "\n"
                               "QPushButton:hover {\n"
                               "    image: url(:/img/touch.png);\n"
                               "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                               "}\n"
                               "\n"
                               "QPushButton:pressed {\n"
                               "    image: url(:/img/push.png);\n"
                               "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                               "}")
        self.pvp.setText("")
        self.pvp.setObjectName("pvp")
        self.pve = QtWidgets.QPushButton(self.pve_setting)
        self.pve.setGeometry(QtCore.QRect(260, 80, 31, 31))
        self.pve.setStyleSheet("QPushButton {\n"
                               "    border-radius: 20px;\n"
                               "    image: url(:/img/push.png);\n"
                               "    border: none; \n"
                               "}")
        self.pve.setText("")
        self.pve.setObjectName("pve")

        self.difficult = QtWidgets.QPushButton(self.pve_setting)
        self.difficult.setGeometry(QtCore.QRect(130, 140, 31, 31))
        self.difficult.setStyleSheet("QPushButton {\n"
                                     "    border-radius: 20px;\n"
                                     "    image: url(:/img/round.png);\n"
                                     "    border: none; \n"
                                     "}\n"
                                     "\n"
                                     "QPushButton:hover {\n"
                                     "    image: url(:/img/touch.png);\n"
                                     "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                                     "}\n"
                                     "\n"
                                     "QPushButton:pressed {\n"
                                     "    image: url(:/img/push.png);\n"
                                     "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                                     "}")
        self.difficult.setText("")
        self.difficult.setObjectName("difficult")
        self.normal = QtWidgets.QPushButton(self.pve_setting)
        self.normal.setGeometry(QtCore.QRect(210, 140, 31, 31))
        self.normal.setStyleSheet("QPushButton {\n"
                                  "    border-radius: 20px;\n"
                                  "    image: url(:/img/round.png);\n"
                                  "    border: none; \n"
                                  "}\n"
                                  "\n"
                                  "QPushButton:hover {\n"
                                  "    image: url(:/img/touch.png);\n"
                                  "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                                  "}\n"
                                  "\n"
                                  "QPushButton:pressed {\n"
                                  "    image: url(:/img/push.png);\n"
                                  "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                                  "}")
        self.normal.setText("")
        self.normal.setObjectName("normal")
        self.easy = QtWidgets.QPushButton(self.pve_setting)
        self.easy.setGeometry(QtCore.QRect(280, 140, 31, 31))
        self.easy.setStyleSheet("QPushButton {\n"
                                "    border-radius: 20px;\n"
                                "    image: url(:/img/round.png);\n"
                                "    border: none; \n"
                                "}\n"
                                "\n"
                                "QPushButton:hover {\n"
                                "    image: url(:/img/touch.png);\n"
                                "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                                "}\n"
                                "\n"
                                "QPushButton:pressed {\n"
                                "    image: url(:/img/push.png);\n"
                                "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                                "}")
        self.easy.setText("")
        self.easy.setObjectName("easy")

        self.difficulty_button_group = QtWidgets.QButtonGroup(self.pve_setting)  # 创建按钮组
        self.difficulty_button_group.addButton(self.difficult, 1)  # 添加按钮到组，分配ID
        self.difficulty_button_group.addButton(self.normal, 2)
        self.difficulty_button_group.addButton(self.easy, 3)
        self.difficulty_button_group.buttonClicked[int].connect(self._difficulty_button_clicked)

        self.DFS = QtWidgets.QPushButton(self.pve_setting)
        self.DFS.setGeometry(QtCore.QRect(170, 200, 31, 31))
        self.DFS.setStyleSheet("QPushButton {\n"
                               "    border-radius: 20px;\n"
                               "    image: url(:/img/round.png);\n"
                               "    border: none; \n"
                               "}\n"
                               "\n"
                               "QPushButton:hover {\n"
                               "    image: url(:/img/touch.png);\n"
                               "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                               "}\n"
                               "\n"
                               "QPushButton:pressed {\n"
                               "    image: url(:/img/push.png);\n"
                               "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                               "}")
        self.DFS.setText("")
        self.DFS.setObjectName("DFS")
        self.BFS = QtWidgets.QPushButton(self.pve_setting)
        self.BFS.setGeometry(QtCore.QRect(260, 200, 31, 31))
        self.BFS.setStyleSheet("QPushButton {\n"
                               "    border-radius: 20px;\n"
                               "    image: url(:/img/round.png);\n"
                               "    border: none; \n"
                               "}\n"
                               "\n"
                               "QPushButton:hover {\n"
                               "    image: url(:/img/touch.png);\n"
                               "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                               "}\n"
                               "\n"
                               "QPushButton:pressed {\n"
                               "    image: url(:/img/push.png);\n"
                               "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                               "}")
        self.BFS.setText("")
        self.BFS.setObjectName("BFS")
        self.A_star = QtWidgets.QPushButton(self.pve_setting)
        self.A_star.setGeometry(QtCore.QRect(170, 240, 31, 31))
        self.A_star.setStyleSheet("QPushButton {\n"
                                  "    border-radius: 20px;\n"
                                  "    image: url(:/img/round.png);\n"
                                  "    border: none; \n"
                                  "}\n"
                                  "\n"
                                  "QPushButton:hover {\n"
                                  "    image: url(:/img/touch.png);\n"
                                  "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                                  "}\n"
                                  "\n"
                                  "QPushButton:pressed {\n"
                                  "    image: url(:/img/push.png);\n"
                                  "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                                  "}")
        self.A_star.setText("")
        self.A_star.setObjectName("A_star")
        self.DL = QtWidgets.QPushButton(self.pve_setting)
        self.DL.setGeometry(QtCore.QRect(260, 240, 31, 31))
        self.DL.setStyleSheet("QPushButton {\n"
                              "    border-radius: 20px;\n"
                              "    image: url(:/img/round.png);\n"
                              "    border: none; \n"
                              "}\n"
                              "\n"
                              "QPushButton:hover {\n"
                              "    image: url(:/img/touch.png);\n"
                              "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                              "}\n"
                              "\n"
                              "QPushButton:pressed {\n"
                              "    image: url(:/img/push.png);\n"
                              "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                              "}")
        self.DL.setText("")
        self.DL.setObjectName("DL")

        self.agent_button_group = QtWidgets.QButtonGroup(self.pve_setting)  # 创建按钮组
        self.agent_button_group.addButton(self.DFS, 1)  # 添加按钮到组，分配ID
        self.agent_button_group.addButton(self.BFS, 2)
        self.agent_button_group.addButton(self.A_star, 3)
        self.agent_button_group.addButton(self.DL, 4)
        self.agent_button_group.buttonClicked[int].connect(self._agent_button_clicked)

        self.pushButton_2 = QtWidgets.QPushButton(self.pve_setting)
        self.pushButton_2.setGeometry(QtCore.QRect(40, 270, 101, 41))
        self.pushButton_2.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/start_end_setting.png);\n"
                                        "    border: none; \n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:hover {\n"
                                        "    border-radius: 15px;\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:pressed {\n"
                                        "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                        "}")
        self.pushButton_2.setText("")
        self.pushButton_2.setObjectName("pushButton_2")
        self.pushButton_3 = QtWidgets.QPushButton(self.pve_setting)
        self.pushButton_3.setGeometry(QtCore.QRect(200, 270, 101, 41))
        self.pushButton_3.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/img_setting.png);\n"
                                        "    border: none; \n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:hover {\n"
                                        "    border-radius: 15px;\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:pressed {\n"
                                        "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                        "}")
        self.pushButton_3.setText("")
        self.pushButton_3.setObjectName("pushButton_3")
        self.inside_window.addWidget(self.pve_setting)
        self.pvp_setting = QtWidgets.QWidget()
        self.pvp_setting.setStyleSheet("image: url(:/img/设置页-pvp.png);")
        self.pvp_setting.setObjectName("pvp_setting")
        self.pvp_2 = QtWidgets.QPushButton(self.pvp_setting)
        self.pvp_2.setGeometry(QtCore.QRect(170, 80, 31, 31))
        self.pvp_2.setStyleSheet("QPushButton {\n"
                                 "    border-radius: 20px;\n"
                                 "    image: url(:/img/push.png);\n"
                                 "    border: none; \n"
                                 "}")
        self.pvp_2.setText("")
        self.pvp_2.setObjectName("pvp_2")
        self.pve_2 = QtWidgets.QPushButton(self.pvp_setting)
        self.pve_2.setGeometry(QtCore.QRect(260, 80, 31, 31))
        self.pve_2.setStyleSheet("QPushButton {\n"
                                 "    border-radius: 20px;\n"
                                 "    image: url(:/img/round.png);\n"
                                 "    border: none; \n"
                                 "}\n"
                                 "\n"
                                 "QPushButton:hover {\n"
                                 "    image: url(:/img/touch.png);\n"
                                 "    background-color: rgba(255, 255, 255，000); /* 添加半透明遮罩 */\n"
                                 "}\n"
                                 "\n"
                                 "QPushButton:pressed {\n"
                                 "    image: url(:/img/push.png);\n"
                                 "    background-color: rgba(255, 255, 255，000); /* 保持悬停效果并应用于按下状态 */\n"
                                 "}")
        self.pve_2.setText("")
        self.pve_2.setObjectName("pve_2")
        self.close_2 = QtWidgets.QPushButton(self.pvp_setting)
        self.close_2.setGeometry(QtCore.QRect(10, 10, 31, 31))
        self.close_2.setStyleSheet("QPushButton {\n"
                                   "    border-radius: 20px;\n"
                                   "    image: url(:/img/x_1.png);\n"
                                   "    border: none; \n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:hover {\n"
                                   "    border-radius: 15px;\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:pressed {\n"
                                   "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                   "}")
        self.close_2.setText("")
        self.close_2.setObjectName("close_2")
        self.pushButton_4 = QtWidgets.QPushButton(self.pvp_setting)
        self.pushButton_4.setGeometry(QtCore.QRect(40, 270, 101, 41))
        self.pushButton_4.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/start_end_setting.png);\n"
                                        "    border: none; \n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:hover {\n"
                                        "    border-radius: 15px;\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:pressed {\n"
                                        "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                        "}")
        self.pushButton_4.setText("")
        self.pushButton_4.setObjectName("pushButton_4")
        self.pushButton_5 = QtWidgets.QPushButton(self.pvp_setting)
        self.pushButton_5.setGeometry(QtCore.QRect(200, 270, 101, 41))
        self.pushButton_5.setStyleSheet("QPushButton {\n"
                                        "    border-radius: 20px;\n"
                                        "    image: url(:/img/img_setting.png);\n"
                                        "    border: none; \n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:hover {\n"
                                        "    border-radius: 15px;\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                        "}\n"
                                        "\n"
                                        "QPushButton:pressed {\n"
                                        "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                        "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                        "}")
        self.pushButton_5.setText("")
        self.pushButton_5.setObjectName("pushButton_5")
        self.inside_window.addWidget(self.pvp_setting)
        self.start_end_setting = QtWidgets.QWidget()
        self.start_end_setting.setStyleSheet("QWidget#start_end_setting{\n"
                                             "    image: url(:/img/end_page.png);\n"
                                             "}")
        self.start_end_setting.setObjectName("start_end_setting")

        self.start11 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start11.setGeometry(QtCore.QRect(20, 120, 41, 41))
        self.start11.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start11.setObjectName("start11")
        self.start12 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start12.setGeometry(QtCore.QRect(70, 120, 41, 41))
        self.start12.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start12.setObjectName("start12")
        self.start13 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start13.setGeometry(QtCore.QRect(120, 120, 41, 41))
        self.start13.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start13.setObjectName("start13")
        self.start21 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start21.setGeometry(QtCore.QRect(20, 170, 41, 41))
        self.start21.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start21.setObjectName("start21")
        self.start22 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start22.setGeometry(QtCore.QRect(70, 170, 41, 41))
        self.start22.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start22.setObjectName("start22")
        self.start23 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start23.setGeometry(QtCore.QRect(120, 170, 41, 41))
        self.start23.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start23.setObjectName("start23")
        self.start31 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start31.setGeometry(QtCore.QRect(20, 220, 41, 41))
        self.start31.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start31.setObjectName("start31")
        self.start32 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start32.setGeometry(QtCore.QRect(70, 220, 41, 41))
        self.start32.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start32.setObjectName("start32")
        self.start33 = QtWidgets.QSpinBox(self.start_end_setting)
        self.start33.setGeometry(QtCore.QRect(120, 220, 41, 41))
        self.start33.setStyleSheet("QSpinBox {\n"
                                   "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                   "    color: #333333; /* 设置文字颜色 */\n"
                                   "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                   "    padding: 5px; /* 设置内边距 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox:hover {\n"
                                   "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::up-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                   "}\n"
                                   "\n"
                                   "QSpinBox::down-button {\n"
                                   "    subcontrol-origin: border;\n"
                                   "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                   "}\n"
                                   "")
        self.start33.setObjectName("start33")
        self.end11 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end11.setGeometry(QtCore.QRect(170, 120, 41, 41))
        self.end11.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end11.setObjectName("end11")
        self.end21 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end21.setGeometry(QtCore.QRect(170, 170, 41, 41))
        self.end21.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end21.setObjectName("end21")
        self.end31 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end31.setGeometry(QtCore.QRect(170, 220, 41, 41))
        self.end31.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end31.setObjectName("end31")
        self.end12 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end12.setGeometry(QtCore.QRect(220, 120, 41, 41))
        self.end12.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end12.setObjectName("end12")
        self.end22 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end22.setGeometry(QtCore.QRect(220, 170, 41, 41))
        self.end22.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end22.setObjectName("end22")
        self.end32 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end32.setGeometry(QtCore.QRect(220, 220, 41, 41))
        self.end32.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end32.setObjectName("end32")
        self.end33 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end33.setGeometry(QtCore.QRect(270, 220, 41, 41))
        self.end33.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end33.setObjectName("end33")
        self.end23 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end23.setGeometry(QtCore.QRect(270, 170, 41, 41))
        self.end23.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end23.setObjectName("end23")
        self.end13 = QtWidgets.QSpinBox(self.start_end_setting)
        self.end13.setGeometry(QtCore.QRect(270, 120, 41, 41))
        self.end13.setStyleSheet("QSpinBox {\n"
                                 "    background-color: #9dd7ff; /* 设置背景色为#9dd7ff */\n"
                                 "    color: #333333; /* 设置文字颜色 */\n"
                                 "    border: 2px solid #9dd7ff; /* 设置边框颜色为#9dd7ff和宽度 */\n"
                                 "    padding: 5px; /* 设置内边距 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox:hover {\n"
                                 "    border: 2px solid #4caff2; /* 鼠标悬浮时边框颜色为#9dd7ff */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::up-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: top right; /* 设置上按钮的位置 */\n"
                                 "}\n"
                                 "\n"
                                 "QSpinBox::down-button {\n"
                                 "    subcontrol-origin: border;\n"
                                 "    subcontrol-position: bottom right; /* 设置下按钮的位置 */\n"
                                 "}\n"
                                 "")
        self.end13.setObjectName("end13")
        self.label_5 = QtWidgets.QLabel(self.start_end_setting)
        self.label_5.setGeometry(QtCore.QRect(20, 0, 141, 161))
        self.label_5.setStyleSheet("image: url(:/img/Start.PNG);")
        self.label_5.setText("")
        self.label_5.setObjectName("label_5")
        self.label_6 = QtWidgets.QLabel(self.start_end_setting)
        self.label_6.setGeometry(QtCore.QRect(140, 0, 211, 161))
        self.label_6.setStyleSheet("image: url(:/img/End.PNG);")
        self.label_6.setText("")
        self.label_6.setObjectName("label_6")
        self.close_4 = QtWidgets.QPushButton(self.start_end_setting)
        self.close_4.setGeometry(QtCore.QRect(10, 10, 31, 31))
        self.close_4.setStyleSheet("QPushButton {\n"
                                   "    border-radius: 20px;\n"
                                   "    image: url(:/img/x_1.png);\n"
                                   "    border: none; \n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:hover {\n"
                                   "    border-radius: 15px;\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:pressed {\n"
                                   "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                   "}")
        self.close_4.setText("")
        self.close_4.setObjectName("close_4")
        self.label_6.raise_()
        self.label_5.raise_()
        self.start11.raise_()
        self.start12.raise_()
        self.start13.raise_()
        self.start21.raise_()
        self.start22.raise_()
        self.start23.raise_()
        self.start31.raise_()
        self.start32.raise_()
        self.start33.raise_()
        self.end11.raise_()
        self.end21.raise_()
        self.end31.raise_()
        self.end12.raise_()
        self.end22.raise_()
        self.end32.raise_()
        self.end33.raise_()
        self.end23.raise_()
        self.end13.raise_()
        self.close_4.raise_()
        self.inside_window.addWidget(self.start_end_setting)
        self.end = QtWidgets.QWidget()
        self.end.setStyleSheet("QWidget#end{\n"
                               "    image: url(:/img/end_page.png);\n"
                               "}")
        self.end.setObjectName("end")
        self.close_3 = QtWidgets.QPushButton(self.end)
        self.close_3.setGeometry(QtCore.QRect(10, 10, 31, 31))
        self.close_3.setStyleSheet("QPushButton {\n"
                                   "    border-radius: 20px;\n"
                                   "    image: url(:/img/x_1.png);\n"
                                   "    border: none; \n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:hover {\n"
                                   "    border-radius: 15px;\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 添加半透明遮罩 */\n"
                                   "}\n"
                                   "\n"
                                   "QPushButton:pressed {\n"
                                   "    margin: 2px; /* 调整边距，模拟按钮缩小效果 */\n"
                                   "    background-color: rgba(255, 255, 255, 0.2); /* 保持悬停效果并应用于按下状态 */\n"
                                   "}")
        self.close_3.setText("")
        self.close_3.setObjectName("close_3")
        self.P1_end = QtWidgets.QLabel(self.end)
        self.P1_end.setGeometry(QtCore.QRect(20, 70, 141, 141))
        self.P1_end.setStyleSheet("image: url(:/img/Win.PNG);")
        self.P1_end.setText("")
        self.P1_end.setObjectName("P1_end")
        self.P2_end = QtWidgets.QLabel(self.end)
        self.P2_end.setGeometry(QtCore.QRect(180, 70, 141, 141))
        self.P2_end.setStyleSheet("image: url(:/img/LOSE.PNG);")
        self.P2_end.setText("")
        self.P2_end.setObjectName("P2_end")
        self.label_3 = QtWidgets.QLabel(self.end)
        self.label_3.setGeometry(QtCore.QRect(60, 10, 71, 61))
        self.label_3.setStyleSheet("image: url(:/img/P1 (2).PNG);")
        self.label_3.setText("")
        self.label_3.setObjectName("label_3")
        self.label_4 = QtWidgets.QLabel(self.end)
        self.label_4.setGeometry(QtCore.QRect(210, 10, 71, 61))
        self.label_4.setStyleSheet("image: url(:/img/P2 (2).PNG);")
        self.label_4.setText("")
        self.label_4.setObjectName("label_4")
        self.label = QtWidgets.QLabel(self.end)
        self.label.setGeometry(QtCore.QRect(0, 180, 121, 61))
        self.label.setStyleSheet("image: url(:/img/步数：.PNG);")
        self.label.setText("")
        self.label.setObjectName("label")
        self.label_2 = QtWidgets.QLabel(self.end)
        self.label_2.setGeometry(QtCore.QRect(150, 180, 121, 61))
        self.label_2.setStyleSheet("image: url(:/img/步数：.PNG);")
        self.label_2.setText("")
        self.label_2.setObjectName("label_2")
        self.p1_end_count = QtWidgets.QLabel(self.end)
        self.p1_end_count.setGeometry(QtCore.QRect(50, 240, 91, 61))
        self.p1_end_count.setStyleSheet("QLabel{\n"
                                        "font: 35pt \"Showcard Gothic\";\n"
                                        "color: rgb(157, 215, 255);\n"
                                        "}")
        self.p1_end_count.setObjectName("p1_end_count")
        self.p2_end_count = QtWidgets.QLabel(self.end)
        self.p2_end_count.setGeometry(QtCore.QRect(210, 240, 91, 61))
        self.p2_end_count.setStyleSheet("QLabel{\n"
                                        "font: 35pt \"Showcard Gothic\";\n"
                                        "color: rgb(157, 215, 255);\n"
                                        "}")
        self.p2_end_count.setObjectName("p2_end_count")
        self.inside_window.addWidget(self.end)
        MainWindow.setCentralWidget(self.centralwidget)

        self.retranslateUi(MainWindow)
        self.inside_window.setCurrentIndex(0)
        self.close.clicked.connect(MainWindow.close)
        QtCore.QMetaObject.connectSlotsByName(MainWindow)
        self.setUI()

    def setUI(self):
        self.inside_window.setVisible(False)
        self.ready.setVisible(False)
        self.vs.setVisible(False)
        self.count_1.setVisible(False)
        self.count_textLabel_1.setVisible(False)
        self.count_2.setVisible(False)
        self.count_textLabel_2.setVisible(False)

        self.pushButton.clicked.connect(self.startGame)
        self.set.clicked.connect(self.setting)
        self.close_1.clicked.connect(self.shutSetting)
        self.close_2.clicked.connect(self.shutSetting)
        self.close_3.clicked.connect(self.shutEndPage)
        self.close_4.clicked.connect(self.shutStateSetting)
        self.pvp.clicked.connect(self.setPvP)
        self.pve_2.clicked.connect(self.setPvE)
        self.pushButton_2.clicked.connect(lambda: (self.inside_window.setCurrentIndex(2)))
        self.pushButton_3.clicked.connect(self.setImg)
        self.pushButton_4.clicked.connect(lambda: (self.inside_window.setCurrentIndex(2)))
        self.pushButton_5.clicked.connect(self.setImg)

        self.p1_board.gameEnd.connect(lambda: (self.endGame('p1')))
        self.p2_board.gameEnd.connect(lambda: (self.endGame('p2')))

        self.p1_board.countChanged.connect(lambda: (self._handleCountChanged(1)))
        self.p2_board.countChanged.connect(lambda: (self._handleCountChanged(2)))

        if self.config['difficulty'] == 'difficult':
            self.difficult.setStyleSheet(ButtonStyleSheet['push'])
        elif self.config['difficulty'] == 'normal':
            self.normal.setStyleSheet(ButtonStyleSheet['push'])
        elif self.config['difficulty'] == 'easy':
            self.easy.setStyleSheet(ButtonStyleSheet['push'])

        if self.config['agent'] == 'BFS':
            self.BFS.setStyleSheet(ButtonStyleSheet['push'])
        elif self.config['agent'] == 'DFS':
            self.DFS.setStyleSheet(ButtonStyleSheet['push'])
        elif self.config['agent'] == 'A_star':
            self.A_star.setStyleSheet(ButtonStyleSheet['push'])
        elif self.config['agent'] == 'DL':
            self.DL.setStyleSheet(ButtonStyleSheet['push'])

        if self.mode == 'pve':
            self.inside_window.setCurrentIndex(0)
        else:
            self.inside_window.setCurrentIndex(1)

        self.start_state_group = [self.start11, self.start12, self.start13,
                                  self.start21, self.start22, self.start23,
                                  self.start31, self.start32, self.start33]
        self.end_state_group = [self.end11, self.end12, self.end13,
                                self.end21, self.end22, self.end23,
                                self.end31, self.end32, self.end33]

        for spin_box, initial_value in zip(self.start_state_group, self.config['start_state']):
            spin_box.setRange(0, 8)
            spin_box.setValue(initial_value)

        for spin_box, initial_value in zip(self.end_state_group, self.config['end_state']):
            spin_box.setRange(0, 8)
            spin_box.setValue(initial_value)

        self.vs.stackUnder(self.p1_board)

    def startGame(self):
        self.ready.setStyleSheet("image: url(:/img/3.PNG);")
        self.game_started = True
        self.pushButton.setVisible(False)
        self.ready.setVisible(True)
        QTimer.singleShot(1000, lambda: self.ready.setStyleSheet("image: url(:/img/2.PNG);"))
        QTimer.singleShot(1500, lambda: self.ready.setStyleSheet("image: url(:/img/1.PNG);"))
        QTimer.singleShot(2000, lambda: self.ready.setStyleSheet("image: url(:/img/GO.PNG);"))
        QTimer.singleShot(2500, self._finishAnimation)
        self.count_1.setVisible(True)
        self.count_textLabel_1.setVisible(True)
        self.count_2.setVisible(True)
        self.count_textLabel_2.setVisible(True)
        if self.mode == 'pve':
            self.p1_board.mode = 'manual'
            self.p2_board.mode = 'auto'
        elif self.mode == 'pvp':
            self.p1_board.mode = 'manual'
            self.p2_board.mode = 'manual'
        QTimer.singleShot(2500, self.p1_board.start)
        QTimer.singleShot(2500, self.p2_board.start)

    def restartGame(self):
        self.updateConfig()
        self.inside_window.setVisible(False)
        self.ready.setVisible(False)
        self.vs.setVisible(False)
        self.count_1.setVisible(False)
        self.count_textLabel_1.setVisible(False)
        self.count_2.setVisible(False)
        self.count_textLabel_2.setVisible(False)
        for board in [self.p1_board, self.p2_board]:
            for piece in board.pieces.values():
                piece.setVisible(False)
        self.pushButton.setVisible(True)
        self.p1_board.count, self.p2_board.count = 0, 0

    def pauseGame(self):
        self.p1_board.pause()
        self.p2_board.pause()

    def endGame(self, winner):
        self.pauseGame()
        self.p1_end_count.setText(str(self.p1_count))
        self.p2_end_count.setText(str(self.p2_count))
        if winner == 'p1':
            self.P1_end.setStyleSheet(EndState['win'])
            self.P2_end.setStyleSheet(EndState['lose'])
        else:
            self.P1_end.setStyleSheet(EndState['lose'])
            self.P2_end.setStyleSheet(EndState['win'])
        self.inside_window.setCurrentIndex(3)
        self.inside_window.setVisible(True)

    def setting(self):
        self.pauseGame()
        if self.mode == 'pve':
            self.inside_window.setCurrentIndex(0)
        else:
            self.inside_window.setCurrentIndex(1)
        self.inside_window.setVisible(True)

    def setImg(self):
        fileUrlTuple = QFileDialog.getOpenFileUrl(filter="Image files (*.jpg *.png)")
        if fileUrlTuple:
            fileUrl = fileUrlTuple[0]
            if fileUrl.isValid() and fileUrl.isLocalFile():
                filePath = fileUrl.toLocalFile()
                self.config['background_img'] = filePath
            else:
                return
        else:
            return

    def setPvP(self):
        self.inside_window.setCurrentIndex(1)
        self.config['mode'] = 'pvp'
        return

    def setPvE(self):
        self.inside_window.setCurrentIndex(0)
        self.config['mode'] = 'pve'
        return

    def shutSetting(self):
        self.inside_window.setVisible(False)
        self.restartGame()

    def shutStateSetting(self):
        start_state = self._read_state(self.start_state_group)
        end_state = self._read_state(self.end_state_group)
        if self._no_repetition(start_state) and self._no_repetition(end_state) and self._can_solve(start_state,
                                                                                                   end_state):
            self.inside_window.setVisible(False)
            self.config["start_state"] = start_state
            self.config["end_state"] = end_state
            self.restartGame()
        else:
            return

    def shutEndPage(self):
        self.restartGame()

    def initialConfig(self, config_file_path='config/game_config.json'):
        config = {
            'mode': 'pve',
            'difficulty': 'normal',
            'agent': 'A_star',
            'background_img': 'src/img/bupt.jpg',
            'start_state': [0, 8, 7, 6, 5, 4, 3, 2, 1],
            'end_state': [1, 2, 3, 4, 5, 6, 7, 8, 0],
        }
        # 检查配置文件是否存在
        if not os.path.exists(config_file_path):
            # 配置文件不存在，创建一个新的配置文件
            with open(config_file_path, 'w') as file:
                json.dump(config, file, indent=4)
        else:
            # 配置文件存在，读取配置
            with open(config_file_path, 'r') as file:
                config = json.load(file)

        if config['mode'] == 'pve':
            self.p1_mode = 'manual'
            self.p2_mode = 'auto'
        else:
            self.p1_mode = 'manual'
            self.p2_mode = 'manual'
        self.mode = config['mode']
        self.config = config

    def updateConfig(self, config_file_path='config/game_config.json'):
        self.mode = self.config['mode']
        if self.mode == 'pvp':
            self.p1_mode = 'manual'
            self.p2_mode = 'manual'
        else:
            self.p1_mode = 'manual'
            self.p2_mode = 'auto'
        self.p1_board.mode, self.p1_board.config = self.p1_mode, self.config
        self.p2_board.mode, self.p1_board.config = self.p2_mode, self.config
        self.dumpConfig(config_file_path)

    def dumpConfig(self, config_file_path='config/game_config.json'):
        with open(config_file_path, 'w') as file:
            json.dump(self.config, file, indent=4)

    def _difficulty_button_clicked(self, id):
        # 重置所有按钮的样式
        self.difficult.setStyleSheet(ButtonStyleSheet['round'])
        self.normal.setStyleSheet(ButtonStyleSheet['round'])
        self.easy.setStyleSheet(ButtonStyleSheet['round'])

        # 根据被点击的按钮ID，设置按下的样式
        if id == 1:
            self.difficult.setStyleSheet(ButtonStyleSheet['push'])
            self.config['difficulty'] = 'difficult'
        elif id == 2:
            self.normal.setStyleSheet(ButtonStyleSheet['push'])
            self.config['difficulty'] = 'normal'
        elif id == 3:
            self.easy.setStyleSheet(ButtonStyleSheet['push'])
            self.config['difficulty'] = 'easy'

    def _agent_button_clicked(self, id):
        self.DFS.setStyleSheet(ButtonStyleSheet['round'])
        self.BFS.setStyleSheet(ButtonStyleSheet['round'])
        self.A_star.setStyleSheet(ButtonStyleSheet['round'])
        self.DL.setStyleSheet(ButtonStyleSheet['round'])

        # 根据被点击的按钮ID，设置按下的样式
        if id == 1:
            self.DFS.setStyleSheet(ButtonStyleSheet['push'])
            self.config['agent'] = 'DFS'
        elif id == 2:
            self.BFS.setStyleSheet(ButtonStyleSheet['push'])
            self.config['agent'] = 'BFS'
        elif id == 3:
            self.A_star.setStyleSheet(ButtonStyleSheet['push'])
            self.config['agent'] = 'A_star'
        elif id == 4:
            self.DL.setStyleSheet(ButtonStyleSheet['push'])
            self.config['agent'] = 'DL'

    def _handleCountChanged(self, index):
        if index == 1:
            self.p1_count = self.p1_board.count
            self.count_textLabel_1.setText(str(self.p1_count))
        else:
            self.p2_count = self.p2_board.count
            self.count_textLabel_2.setText(str(self.p2_count))

    def _finishAnimation(self):
        self.ready.setVisible(False)
        self.vs.setVisible(True)
        self.vs.unsetLocale()

    def _no_repetition(self, state):
        if len(state) != len(set(state)):  # 通过将列表转换为集合来检查重复
            QMessageBox.warning(self.centralwidget, "Warning", "存在重复的数字，请重新设置。")
            return False
        return True

    def _can_solve(self, start_state, end_state):
        if start_state == end_state:
            QMessageBox.warning(self.centralwidget, "Warning", "状态重复，请重新设置。")
            return False
        if not is_solvable(start_state, end_state):
            QMessageBox.warning(self.centralwidget, "Warning", "状态不可解，请重新设置。")
            return False
        return True

    def _read_state(self, spin_boxes):
        state = [spin_box.value() for spin_box in spin_boxes]
        return state

    def retranslateUi(self, MainWindow):
        _translate = QtCore.QCoreApplication.translate
        MainWindow.setWindowTitle(_translate("MainWindow", "MainWindow"))
        self.p1_end_count.setText(_translate("MainWindow", "108"))
        self.p2_end_count.setText(_translate("MainWindow", "108"))


EndState = {
    'win': "image: url(:/img/Win.PNG);",
    'lose': "image: url(:/img/LOSE.PNG);"
}

ButtonStyleSheet = {
    'round': "QPushButton {border-radius: 20px; image: url(:/img/round.png); border: none; }",
    'touch': "QPushButton:hover {image: url(:/img/touch.png); background-color: rgba(255, 255, 255, 0);}",
    'push': "QPushButton {border-radius: 20px; image: url(:/img/push.png); border: none; } QPushButton:hover {image: url(:/img/touch.png); background-color: rgba(255, 255, 255, 0);}"
}

import src.app.img_rc
