from PIL import Image
from PyQt5.QtCore import Qt, QRect, QPropertyAnimation, pyqtSignal
from PyQt5.QtGui import QPixmap, QPainter
from PyQt5.QtWidgets import QWidget

from config.timeout import timeout
from src.widget.PuzzlePiece import PuzzlePiece
from solver.driver import solver


def split_image(img, end_state):
    image = Image.open(img)
    width, height = image.size
    new_size = max(width, height)

    image = image.resize((new_size, new_size), Image.Resampling.LANCZOS)

    grid_size = new_size / 3

    grid_images = []
    for i in range(3):
        for j in range(3):
            # 使用四舍五入来计算每个小格的坐标
            left = round(j * grid_size)
            top = round(i * grid_size)
            right = round(left + grid_size)
            bottom = round(top + grid_size)
            grid_image = image.crop((left, top, right, bottom))
            grid_images.append(grid_image)

    grid_images[end_state.index(0)] = Image.new('RGBA', (int(grid_size), int(grid_size)), (0, 0, 0, 0))

    for i, img in enumerate(grid_images):
        img.save(f'src/img/temp/{end_state[i]}.png')


class PuzzleBoard(QWidget):
    solutionFound = pyqtSignal(list)
    moveCompleted = pyqtSignal()
    countChanged = pyqtSignal(int)
    gameEnd = pyqtSignal()

    def __init__(self, x, y, parent=None, width=231, mode='manual', config=None):
        super().__init__(parent)

        surplus = width % 3
        if surplus != 0:
            width = width - surplus
        self.step_width = int(width / 3)

        self.img = None
        self.end_state = None
        self.start_state = None
        self.isAnimating = False
        self.difficulty = None
        self.mode = mode
        self.animation1 = None

        self.config = config
        self.update_config()

        self._count = None
        self.count = 0
        self.state = list()  # 8数码的状态

        self.setStyleSheet("QWidget#Form{\n"
                           "    image: url(:/img/bupt.jpg);\n"
                           "}")
        self.x = x
        self.y = y
        self.setGeometry(x, y, width, width)
        self.pieces = {}

        index = 0
        for row in range(1, 4):
            for col in range(1, 4):
                piece = PuzzlePiece(index, parent)
                pos_x = x + (col - 1) * self.step_width
                pos_y = y + (row - 1) * self.step_width
                piece.setGeometry(QRect(pos_x, pos_y, self.step_width, self.step_width))
                piece.setObjectName(str(index))
                piece.setVisible(False)
                self.pieces[index] = piece

                index = index + 1

        self.moveCompleted.connect(self.nextMove)  # 将信号连接到nextMove槽
        self.moveQueue = []  # 移动队列初始化

        self.pieces[0].clicked.connect(lambda: (self.move_by_push(0)))
        self.pieces[1].clicked.connect(lambda: (self.move_by_push(1)))
        self.pieces[2].clicked.connect(lambda: (self.move_by_push(2)))
        self.pieces[3].clicked.connect(lambda: (self.move_by_push(3)))
        self.pieces[4].clicked.connect(lambda: (self.move_by_push(4)))
        self.pieces[5].clicked.connect(lambda: (self.move_by_push(5)))
        self.pieces[6].clicked.connect(lambda: (self.move_by_push(6)))
        self.pieces[7].clicked.connect(lambda: (self.move_by_push(7)))
        self.pieces[8].clicked.connect(lambda: (self.move_by_push(8)))

        self.solutionFound.connect(self.solvePuzzle)

    def start(self):
        self.update_config()
        if self.animation1:
            self.animation1.pause()
        self.isAnimating = False
        self._count = None
        self.count = 0
        self.state = list()  # 8数码的状态
        self.moveQueue = list()  # 移动队列初始化
        if self.img is None:
            return
        self._init_pieces()
        for index in self.pieces:
            self.pieces[index].setVisible(True)
        self._shuffle_pieces(self.start_state)
        if self.mode == 'auto':
            moveQueue = solver(self.start_state, self.end_state, self.config['agent'])
            self.solvePuzzle(moveQueue)

    def end(self):
        self.update()

    def restart(self):
        if self.animation1:
            self.animation1.pause()
        self.isAnimating = False
        self._count = None
        self.count = 0
        self.state = list()  # 8数码的状态
        self.moveQueue = list()  # 移动队列初始化
        self.update_config()
        self.start()

    def pause(self):
        if self.animation1:
            self.animation1.pause()
        self.isAnimating = False

    def update_config(self):
        if self.mode == 'auto':
            self.difficulty = self.config['difficulty']
        else:
            self.difficulty = 'manual'

        if self.config is None:
            self.start_state = [0, 8, 7, 6, 5, 4, 3, 2, 1]
            self.end_state = [0, 1, 2, 3, 4, 5, 6, 7, 8]
            self.img = 'src/img/bupt.jpg'  # 背景图片
        else:
            self.start_state = list(self.config['start_state'])
            self.end_state = list(self.config['end_state'])
            self.img = self.config['background_img']

    def move_by_push(self, index):
        if self.mode == 'manual':
            self._move(index)

    def move_by_direction(self, direction):
        # 确定空白块（0）的位置
        zero_index = self.state.index(0)
        row, col = zero_index // 3, zero_index % 3

        if direction == 'Up':
            row -= 1
        elif direction == 'Down':
            row += 1
        elif direction == 'Left':
            col -= 1
        elif direction == 'Right':
            col += 1

        if 0 <= row <= 2 and 0 <= col <= 2:
            index = row * 3 + col
            self._move(self.state[index])
        else:
            return None

    def solvePuzzle(self, moveQueue=None):
        if not moveQueue:
            return
        self.moveQueue = moveQueue
        self.nextMove()

    def nextMove(self):
        if self.moveQueue:
            direction = self.moveQueue.pop(0)
            self.move_by_direction(direction)

    def _init_pieces(self):
        split_image(self.img, self.end_state)
        for index in range(0, 9):
            button = self.pieces[index]
            button.p_img = f'src/img/temp/{index}.png'
            button.update()

    def _shuffle_pieces(self, state):
        for pos_index, button_index in enumerate(state):
            if pos_index == 8:
                x, y = self._get_position(0)
            else:
                x, y = self._get_position(pos_index + 1)
            self.pieces[button_index].move(x, y)
        self.state = list(state)

    def _get_position(self, index):
        row, col = position_to_number[index][1], position_to_number[index][0]
        p_x = self.x + (row - 1) * self.step_width
        p_y = self.y + (col - 1) * self.step_width
        return p_x, p_y

    def _swap_pieces(self, index):
        if self.isAnimating:  # 检查是否有动画正在进行
            return  # 如果有，直接返回，不启动新的动画
        self.swapIndex = index  # 保存index以便在动画完成后使用
        button1 = self.pieces[index]
        button2 = self.pieces[0]
        button2.stackUnder(button1)

        button1_geometry = button1.geometry()
        button2_geometry = button2.geometry()

        self.animation1 = QPropertyAnimation(button1, b"geometry")
        self.animation1.setDuration(timeout[self.difficulty])
        self.animation1.setEndValue(button2_geometry)

        self.animation1.finished.connect(self._animation_finished)  # 连接动画完成的信号

        self.isAnimating = True  # 标记当前正在进行动画
        self.animation1.start()
        # 直接交换位置
        button2.setGeometry(button1_geometry)

    def _animation_finished(self):
        # 动画完成后更新self.state
        index = self.swapIndex  # 获取之前保存的index
        # 在self.state中交换0和index的位置
        zero_index = self.state.index(0)
        now_index = self.state.index(index)
        self.state[zero_index], self.state[now_index] = self.state[now_index], self.state[zero_index]
        self.isAnimating = False  # 重置动画状态
        self.moveCompleted.emit()
        self.count = self.count + 1
        if self.state == self.end_state:
            self.gameEnd.emit()

    def _move(self, index):
        if self._can_move(index):
            self._swap_pieces(index)

    def _can_move(self, index):
        # 确定空白块（0）的位置
        zero_index = self.state.index(0)
        now_index = self.state.index(index)

        # 计算给定索引和空白块的行和列
        row, col = divmod(now_index, 3)
        zero_row, zero_col = divmod(zero_index, 3)

        # 检查是否相邻（行相同且列相邻，或者列相同且行相邻）
        return (row == zero_row and abs(col - zero_col) == 1) or (col == zero_col and abs(row - zero_row) == 1)

    def _check_win(self):
        if self.state == self.end_state:
            return True


    def paintEvent(self, event):
        if self.img is None:
            super().paintEvent(event)
            return

        painter = QPainter(self)
        pixmap = QPixmap(self.img)
        # 将图片缩放到QWidget的大小
        bg_pixmap = pixmap.scaled(self.size(), Qt.KeepAspectRatioByExpanding, Qt.SmoothTransformation)

        # 设置透明度
        painter.setOpacity(0.5)  # 透明度设置为0.5，可以根据需要调整

        # 绘制背景图片
        painter.drawPixmap(0, 0, bg_pixmap)

    @property
    def count(self):
        return self._count

    @count.setter
    def count(self, value):
        if self._count != value:
            self._count = value
            self.countChanged.emit(self._count)  # 当 count 值改变时，发出信号


position_to_number = {
    1: (1, 1),
    2: (1, 2),
    3: (1, 3),
    4: (2, 1),
    5: (2, 2),
    6: (2, 3),
    7: (3, 1),
    8: (3, 2),
    0: (3, 3)
}
