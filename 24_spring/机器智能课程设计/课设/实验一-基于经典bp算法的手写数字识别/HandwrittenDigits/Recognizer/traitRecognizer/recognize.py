from joblib import load

from Recognizer.traitRecognizer.processData import restoreLabel, processimg


class knnRecognizer:
    def __init__(self, model_path='Recognizer/traitRecognizer/model/knn_model.joblib'):
        self.model = load(model_path)

    def predict_label(self, X):
        y = self.model.predict(X.reshape(1, -1))
        return int(y[0])

    def predict(self, X):
        y = self.model.predict_proba(X.reshape(1, -1))
        return y


class cnnRecognizer:
    def __init__(self, model_path='Recognizer/traitRecognizer/model/cnn_model.h5'):
        self.model = load(model_path)

    def predict_label(self, img):
        processed_img = processimg(img)
        prediction = self.model.predict(processed_img)
        label = restoreLabel(prediction)

        return label[0][0]

    def predict(self, img):
        processed_img = processimg(img)
        prediction = self.model.predict(processed_img)

        return prediction
