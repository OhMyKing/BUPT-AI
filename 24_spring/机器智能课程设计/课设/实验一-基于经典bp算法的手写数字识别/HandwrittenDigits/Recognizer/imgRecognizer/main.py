from engine import cnnRecognizer

if __name__ == "__main__":
    img_path = '../../pictures/MultiNumbers/te05.jpg'

    recognizer = cnnRecognizer(img_path)
    labels = recognizer.predict_label()
    print(labels)