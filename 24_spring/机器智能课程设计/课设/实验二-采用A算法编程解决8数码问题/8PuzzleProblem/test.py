import sys

from PyQt5.QtWidgets import QApplication, QWidget, QPushButton

from src.widget.PuzzleBoard import PuzzleBoard


class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()

    def initUI(self):
        self.setWindowTitle('Puzzle Piece Test')
        self.setGeometry(100, 100, 500, 500)  # 调整为所需尺寸

        self.Button = QPushButton(self)
        self.Button.setGeometry(400, 400, 80, 50)  # 调整为所需尺寸
        self.Button.setText('PushMe')
        config = {
            'agent':'A_star',
            'mode': 'pve',
            'difficulty': 'difficult',
            'background_img': 'src/img/bupt.jpg',
            'start_state': [0, 8, 6, 7, 5, 3, 2, 1, 4],
            'end_state': [1, 2, 3, 4, 5, 6, 7, 8, 0],
        }

        self.puzzleBoard = PuzzleBoard(0, 0, self, 400, 'auto', config)
        self.puzzleBoard.gameEnd.connect(lambda:(print('game end!')))
        self.Button.clicked.connect(self.puzzleBoard.start)


if __name__ == '__main__':
    app = QApplication(sys.argv)
    mainWindow = MainWindow()
    mainWindow.show()
    sys.exit(app.exec_())
