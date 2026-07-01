import cv2
import numpy as np
import time
import matplotlib.pyplot as plt
import json
import os
import glob
import argparse
from abc import ABC, abstractmethod
import mycv

# 抽象基类，用于不同的检测策略实现
class CoinDetectionStrategy(ABC):
    @abstractmethod
    def detect_edges(self, image):
        pass

    @abstractmethod
    def detect_circles(self, image, edges=None):
        pass

    @abstractmethod
    def get_performance(self):
        pass

# OpenCV实现的钱币检测策略
class OpenCVCoinDetection(CoinDetectionStrategy):
    def __init__(self, params=None):
        self.params = params or self._default_params()
        self.performance_metrics = {}

    def _default_params(self):
        return {
            'canny': {
                'threshold1': 50,  # 第一阈值
                'threshold2': 150,  # 第二阈值
                'aperture_size': 3,  # Sobel算子大小
                'L2gradient': False  # 是否使用L2范数
            },
            'hough': {
                'method': cv2.HOUGH_GRADIENT,  # 霍夫变换方法
                'dp': 1,  # 累加器分辨率与图像分辨率的反比
                'minDist': 30,  # 检测到的圆的最小距离
                'param1': 50,  # Canny边缘检测的高阈值
                'param2': 30,  # 累加器阈值
                'minRadius': 10,  # 最小圆半径
                'maxRadius': 100  # 最大圆半径
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
        self.performance_metrics['canny_time'] = (end_time - start_time)  # 转换为秒
        return edges

    def detect_circles(self, image, edges=None):
        """使用HoughCircles算法检测圆形"""
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
        self.performance_metrics['hough_time'] = (end_time - start_time)  # 转换为秒

        if circles is not None:
            circles = np.uint16(np.around(circles))
            return circles[0]
        else:
            return None

    def get_performance(self):
        return self.performance_metrics

# python实现的钱币检测策略
class MyCoinDetection(CoinDetectionStrategy):
    def __init__(self, params=None):
        self.params = params or self._default_params()
        self.performance_metrics = {}

    def _default_params(self):
        return {
            'canny': {
                'threshold1': 50,  # 第一阈值
                'threshold2': 150,  # 第二阈值
                'aperture_size': 3,  # Sobel算子大小
                'L2gradient': False  # 是否使用L2范数
            },
            'hough': {
                'method': cv2.HOUGH_GRADIENT,  # 霍夫变换方法
                'dp': 1,  # 累加器分辨率与图像分辨率的反比
                'minDist': 30,  # 检测到的圆的最小距离
                'param1': 50,  # Canny边缘检测的高阈值
                'param2': 30,  # 累加器阈值
                'minRadius': 10,  # 最小圆半径
                'maxRadius': 100  # 最大圆半径
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
        edges = mycv.Canny(
            blurred,
            canny_params['threshold1'],
            canny_params['threshold2'],
            apertureSize=canny_params['aperture_size'],
            L2gradient=canny_params['L2gradient']
        )
        end_time = time.time()
        self.performance_metrics['canny_time'] = (end_time - start_time)  # 转换为秒

        return edges

    def detect_circles(self, image, edges=None):
        if len(image.shape) > 2:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        blurred = cv2.GaussianBlur(gray, (31, 31), 0)

        start_time = time.time()
        hough_params = self.params['hough']
        circles = mycv.HoughCircles(
            blurred,  # 使用模糊处理后的图像进行圆形检测
            hough_params['method'],
            hough_params['dp'],
            hough_params['minDist'],
            param1=hough_params['param1'],
            param2=hough_params['param2'],
            minRadius=hough_params['minRadius'],
            maxRadius=hough_params['maxRadius']
        )
        end_time = time.time()
        self.performance_metrics['hough_time'] = (end_time - start_time)  # 转换为秒

        if circles is not None:
            # 将坐标和半径四舍五入为整数
            circles = np.uint16(np.around(circles))
            return circles[0]
        else:
            return None

    def get_performance(self):
        """获取性能指标"""
        return self.performance_metrics


# 主要的钱币检测器类
class CoinDetector:
    def __init__(self, strategy=None, params=None):
        """
        初始化钱币检测器

        参数:
            strategy: 检测策略，默认为OpenCV实现
            params: 算法参数
        """
        if strategy is None:
            self.strategy = OpenCVCoinDetection(params)
        else:
            self.strategy = strategy

        self.performance_metrics = {}

    def process_image(self, image_path=None, image=None):
        """
        处理图像，检测钱币

        参数:
            image_path: 图像文件路径
            image: 直接传入的图像对象

        返回:
            image: 原始图像
            edges: 边缘检测结果
            circles: 检测到的圆形 (x, y, r)
        """
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

        self.performance_metrics['total_time'] = (end_time - start_time)  # 转换为秒
        self.performance_metrics.update(self.strategy.get_performance())

        return image, edges, circles

    def visualize(self, image, edges, circles, save_path=None, show=False):
        # 创建带有子图的图形
        fig, axes = plt.subplots(1, 3, figsize=(15, 7))

        # 显示原始图像
        axes[0].imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        axes[0].set_title('OrigImage')
        axes[0].axis('off')

        # 显示边缘
        axes[1].imshow(edges, cmap='gray')
        axes[1].set_title('Canny')
        axes[1].axis('off')

        # 显示圆形
        result_image = image.copy()
        if circles is not None:
            for circle in circles:
                center = (circle[0], circle[1])
                radius = circle[2]
                cv2.circle(result_image, center, radius, (0, 255, 0), 2)
                cv2.circle(result_image, center, 2, (0, 0, 255), 3)

        axes[2].imshow(cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB))
        axes[2].set_title('HoughCircles')
        axes[2].axis('off')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path)

        if show:
            plt.show()
        else:
            plt.close(fig)

    def print_performance(self):
        print("性能指标:")
        print(f"Canny边缘检测: {self.performance_metrics.get('canny_time', 0):.2f} ms")
        print(f"HoughCircles检测: {self.performance_metrics.get('hough_time', 0):.2f} ms")
        print(f"总处理时间: {self.performance_metrics.get('total_time', 0):.2f} ms")

    def get_performance(self):
        return self.performance_metrics

    def save_results(self, circles, filename):
        if circles is None:
            coin_data = []
        else:
            coin_data = [{"center_x": int(circle[0]),
                          "center_y": int(circle[1]),
                          "radius": int(circle[2])}
                         for circle in circles]

        # 添加性能指标
        data = {
            "coins": coin_data,
            "performance": self.get_performance()
        }

        # 保存到文件
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

        return True

    @staticmethod
    def load_results(filename):
        with open(filename, 'r') as f:
            data = json.load(f)

        # 转换为可视化所需的格式
        if "coins" in data and data["coins"]:
            circles = np.array([[coin["center_x"], coin["center_y"], coin["radius"]]
                               for coin in data["coins"]], dtype=np.uint16)
            return circles

        return None

# 基准测试类
class Benchmark:
    def __init__(self):
        self.results = {}

    def run_benchmark(self, detector, image_paths):
        results = {
            'images': {},
            'average': {
                'canny_time': 0,
                'hough_time': 0,
                'total_time': 0
            }
        }

        total_coins = 0

        for path in image_paths:
            try:
                _, _, circles = detector.process_image(image_path=path)
                performance = detector.get_performance()

                image_name = os.path.basename(path)
                coin_count = len(circles) if circles is not None else 0
                total_coins += coin_count

                results['images'][image_name] = {
                    'performance': performance,
                    'coin_count': coin_count
                }

                # 更新平均值
                for key in ['canny_time', 'hough_time', 'total_time']:
                    if key in performance:
                        results['average'][key] += performance[key]

            except Exception as e:
                print(f"对 {path} 进行基准测试时出错: {e}")

        # 计算平均值
        num_images = len(image_paths)
        if num_images > 0:
            for key in results['average']:
                results['average'][key] /= num_images

        results['total_coins'] = total_coins
        self.results = results

        return results

    def print_results(self):
        if not self.results:
            print("没有可用的基准测试结果。")
            return

        print("\n===== 基准测试结果 =====")
        print(f"处理的图像总数: {len(self.results['images'])}")
        print(f"检测到的钱币总数: {self.results.get('total_coins', 0)}")
        print("\n平均性能:")
        for key, value in self.results['average'].items():
            print(f"  {key}: {value:.2f} ms")

        print("\n每个图像的结果:")
        for image_name, data in self.results['images'].items():
            print(f"\n{image_name}:")
            print(f"  检测到的钱币数: {data['coin_count']}")
            for key, value in data['performance'].items():
                print(f"  {key}: {value:.2f} ms")

def main():
    parser = argparse.ArgumentParser(description='检测图像中的硬币')
    parser.add_argument('--method', default='opencv', help='使用的处理方法')
    parser.add_argument('--input_folder', default='images', help='包含JPG/PNG图像的文件夹路径')
    parser.add_argument('--output_folder', default='output_opencv', help='输出文件夹路径')
    args = parser.parse_args()

    # 创建输出文件夹
    if not os.path.exists(args.output_folder):
        os.makedirs(args.output_folder)
        print(f"创建输出文件夹: {args.output_folder}")

    params = {
        'canny': {
            'threshold1': 20,
            'threshold2': 30,
            'aperture_size': 5,
            'L2gradient': True
        },
        'hough': {
            'method': cv2.HOUGH_GRADIENT,
            'dp': 1.5,
            'minDist': 30,
            'param1': 30,
            'param2': 20,
            'minRadius': 10,
            'maxRadius': 100
        }
    }

    # 查找输入文件夹中的所有JPG和PNG文件
    image_files = []
    for ext in ['jpg', 'jpeg', 'png']:
        image_files.extend(glob.glob(os.path.join(args.input_folder, f'*.{ext}')))
        image_files.extend(glob.glob(os.path.join(args.input_folder, f'*.{ext.upper()}')))

    if not image_files:
        print(f"在 {args.input_folder} 中未找到JPG/PNG图像")
        return

    print(f"找到 {len(image_files)} 个要处理的图像")

    # 创建硬币检测器
    if args.method == 'opencv':
        detector = CoinDetector(params=params, strategy=OpenCVCoinDetection(params))
    elif args.method == 'mycv':
        detector = CoinDetector(params=params, strategy=MyCoinDetection(params))


    all_results = {}
    for image_path in image_files:
        try:
            base_name = os.path.basename(image_path)
            name_without_ext = os.path.splitext(base_name)[0]

            print(f"处理 {base_name}...")

            # 处理图像
            image, edges, circles = detector.process_image(image_path=image_path)
            viz_path = os.path.join(args.output_folder, f"{name_without_ext}_detection.png")
            detector.visualize(image, edges, circles, save_path=viz_path)
            json_path = os.path.join(args.output_folder, f"{name_without_ext}_results.json")
            detector.save_results(circles, json_path)

            coin_count = len(circles) if circles is not None else 0
            all_results[base_name] = {
                'path': image_path,
                'coin_count': coin_count,
                'performance': detector.get_performance()
            }

            print(f"  检测到 {coin_count} 个硬币")

        except Exception as e:
            print(f"处理 {image_path} 时出错: {e}")

    # 计算平均性能指标
    avg_metrics = {}
    total_coins = 0
    processed_images = 0
    for img_data in all_results.values():
        if 'performance' in img_data:
            for metric_key in img_data['performance']:
                if metric_key not in avg_metrics:
                    avg_metrics[metric_key] = 0.0
            total_coins += img_data.get('coin_count', 0)
            processed_images += 1
    for img_data in all_results.values():
        if 'performance' in img_data:
            for metric_key, metric_value in img_data['performance'].items():
                avg_metrics[metric_key] += metric_value
    if processed_images > 0:
        for metric_key in avg_metrics:
            avg_metrics[metric_key] /= processed_images
    all_results['summary'] = {
        'total_images': processed_images,
        'total_coins': total_coins,
        'average_coins_per_image': total_coins / processed_images if processed_images > 0 else 0,
        'average_performance': avg_metrics,
        'algorithm_params': params  # 保存算法参数，惨痛教训;）
    }

    # 生成摘要报告
    summary_path = os.path.join(args.output_folder, "detection_summary.json")
    with open(summary_path, 'w') as f:
        json.dump(all_results, f, indent=2)

    print(f"\n处理完成。结果保存到 {args.output_folder}")
    print(f"摘要保存到 {summary_path}")

if __name__ == "__main__":
    main()