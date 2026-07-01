import sys

from PyQt5.QtWidgets import QApplication

from sampling.sampling import DigitDrawer

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = DigitDrawer()
    ex.show()
    sys.exit(app.exec_())