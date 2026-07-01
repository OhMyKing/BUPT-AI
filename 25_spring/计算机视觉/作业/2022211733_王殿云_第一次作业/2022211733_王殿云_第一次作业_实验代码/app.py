from flask import Flask, render_template, request, jsonify, send_from_directory
import cv2
import numpy as np
import os
import time
import json
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}

# 创建必要的目录
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)


# OpenCV实现的硬币检测（从原始代码简化）
class OpenCVCoinDetection:
    def __init__(self, params=None):
        self.params = params or self._default_params()
        self.performance_metrics = {}

    def _default_params(self):
        return {
            'canny': {
                'threshold1': 50,
                'threshold2': 150,
                'aperture_size': 3,
                'L2gradient': False
            },
            'hough': {
                'method': cv2.HOUGH_GRADIENT,
                'dp': 1,
                'minDist': 30,
                'param1': 50,
                'param2': 30,
                'minRadius': 10,
                'maxRadius': 100
            }
        }

    def detect_edges(self, image):
        if len(image.shape) > 2:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        blurred = cv2.GaussianBlur(gray, (31, 31), 0)
        start_time = time.time()
        canny_params = self.params['canny']
        edges = cv2.Canny(
            blurred,
            canny_params['threshold1'],
            canny_params['threshold2'],
            apertureSize=canny_params['aperture_size'],
            L2gradient=canny_params['L2gradient']
        )
        end_time = time.time()
        self.performance_metrics['canny_time'] = (end_time - start_time)
        return edges

    def detect_circles(self, image, edges=None):
        if len(image.shape) > 2:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        blurred = cv2.GaussianBlur(gray, (31, 31), 0)
        start_time = time.time()
        hough_params = self.params['hough']
        circles = cv2.HoughCircles(
            blurred,
            hough_params['method'],
            hough_params['dp'],
            hough_params['minDist'],
            param1=hough_params['param1'],
            param2=hough_params['param2'],
            minRadius=hough_params['minRadius'],
            maxRadius=hough_params['maxRadius']
        )
        end_time = time.time()
        self.performance_metrics['hough_time'] = (end_time - start_time)

        if circles is not None:
            circles = np.uint16(np.around(circles))
            return circles[0]
        else:
            return None

    def get_performance(self):
        return self.performance_metrics


# 主硬币检测器类
class CoinDetector:
    def __init__(self, strategy=None, params=None):
        if strategy is None:
            self.strategy = OpenCVCoinDetection(params)
        else:
            self.strategy = strategy
        self.performance_metrics = {}

    def process_image(self, image_path=None, image=None):
        start_time = time.time()
        if image is None and image_path is not None:
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"无法加载图像: {image_path}")
        elif image is None:
            raise ValueError("必须提供image_path或image参数")

        edges = self.strategy.detect_edges(image)
        circles = self.strategy.detect_circles(image)
        end_time = time.time()

        self.performance_metrics['total_time'] = (end_time - start_time)
        self.performance_metrics.update(self.strategy.get_performance())

        return image, edges, circles

    def get_performance(self):
        return self.performance_metrics


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件部分'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    if file and allowed_file(file.filename):
        # 生成唯一的文件名
        filename = str(uuid.uuid4()) + secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        return jsonify({'filename': filename, 'success': True})

    return jsonify({'error': '无效的文件类型'}), 400


@app.route('/process', methods=['POST'])
def process_image():
    data = request.json

    if 'filename' not in data:
        return jsonify({'error': '没有提供文件名'}), 400

    filename = data['filename']
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if not os.path.exists(filepath):
        return jsonify({'error': '文件未找到'}), 404

    # 从请求中提取参数
    params = {
        'canny': {
            'threshold1': int(data.get('canny_threshold1', 50)),
            'threshold2': int(data.get('canny_threshold2', 150)),
            'aperture_size': int(data.get('canny_aperture_size', 3)),
            'L2gradient': bool(data.get('canny_l2gradient', False))
        },
        'hough': {
            'method': cv2.HOUGH_GRADIENT,
            'dp': float(data.get('hough_dp', 1)),
            'minDist': float(data.get('hough_minDist', 30)),
            'param1': float(data.get('hough_param1', 50)),
            'param2': float(data.get('hough_param2', 30)),
            'minRadius': int(data.get('hough_minRadius', 10)),
            'maxRadius': int(data.get('hough_maxRadius', 100))
        }
    }

    # 处理图像
    detector = CoinDetector(params=params)
    image, edges, circles = detector.process_image(image_path=filepath)

    # 为结果图像生成唯一ID
    result_id = str(uuid.uuid4())
    orig_image_path = os.path.join(app.config['RESULTS_FOLDER'], f"{result_id}_orig.jpg")
    edges_image_path = os.path.join(app.config['RESULTS_FOLDER'], f"{result_id}_edges.jpg")
    circles_image_path = os.path.join(app.config['RESULTS_FOLDER'], f"{result_id}_circles.jpg")

    # 保存原始图像
    cv2.imwrite(orig_image_path, image)

    # 保存边缘图像
    cv2.imwrite(edges_image_path, edges)

    # 保存圆形检测图像
    result_image = image.copy()
    if circles is not None:
        for circle in circles:
            center = (circle[0], circle[1])
            radius = circle[2]
            cv2.circle(result_image, center, radius, (0, 255, 0), 2)
            cv2.circle(result_image, center, 2, (0, 0, 255), 3)
    cv2.imwrite(circles_image_path, result_image)

    performance = detector.get_performance()

    coin_count = len(circles) if circles is not None else 0

    return jsonify({
        'success': True,
        'orig_image': f"{result_id}_orig.jpg",
        'edges_image': f"{result_id}_edges.jpg",
        'circles_image': f"{result_id}_circles.jpg",
        'coin_count': coin_count,
        'performance': performance
    })


@app.route('/results/<filename>')
def get_result(filename):
    return send_from_directory(app.config['RESULTS_FOLDER'], filename)


if __name__ == '__main__':
    app.run(debug=True)