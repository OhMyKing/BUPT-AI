import cv2
import numpy as np
import os
import argparse
from pathlib import Path
import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
import subprocess
import shutil
import tempfile

def parse_args():
    parser = argparse.ArgumentParser(description='从古画中提取包含人物的9:16区域并修复原图')
    parser.add_argument('--input', type=str, required=True, help='输入图像路径')
    parser.add_argument('--output_dir', type=str, default='output', help='输出目录')
    parser.add_argument('--method', type=str, default='yolo', choices=['yolo', 'hog', 'custom'], 
                        help='检测方法：yolo (预训练模型), hog (传统方法), custom (自定义模板匹配)')
    parser.add_argument('--conf_threshold', type=float, default=0.6, help='YOLO置信度阈值')
    parser.add_argument('--padding', type=float, default=0.2, help='边界框填充比例')
    parser.add_argument('--template', type=str, default=None, help='用于模板匹配的人物模板图像路径')
    parser.add_argument('--bg_color', type=str, default='transparent', 
                        choices=['transparent', 'white', 'black'], help='填充背景颜色')
    parser.add_argument('--color_correction', action='store_true', help='启用颜色校正')
    parser.add_argument('--temperature_adjust', type=float, default=0.0, help='色温调整 (-1.0到1.0, 负值变暖，正值变冷)')
    parser.add_argument('--keep_largest_only', action='store_true', default=True, help='只保留最大的连通区域（单个人物）')
    parser.add_argument('--min_area_ratio', type=float, default=0.01, help='最小连通区域面积比例阈值')
    
    # 图像修复相关参数
    parser.add_argument('--enable_inpainting', action='store_true', help='启用图像修复功能')
    parser.add_argument('--inpaint_method', type=str, default='opencv', 
                        choices=['opencv', 'lama', 'lama_large', 'ldm', 'zits', 'mat', 'fcf'], 
                        help='图像修复方法：opencv (OpenCV内置), lama (LaMa), lama_large, ldm, zits, mat, fcf')
    parser.add_argument('--opencv_method', type=str, default='telea', choices=['telea', 'ns'], 
                        help='OpenCV修复方法：telea (快速行进法) 或 ns (Navier-Stokes)')
    parser.add_argument('--inpaint_radius', type=int, default=3, help='OpenCV修复算法的邻域半径')
    parser.add_argument('--mask_dilation', type=int, default=3, help='mask膨胀核大小，用于扩展修复区域')
    parser.add_argument('--mask_expansion_mode', type=str, default='gaussian', 
                        choices=['traditional', 'gaussian', 'hybrid'], 
                        help='掩码扩张模式：traditional (传统膨胀), gaussian (高斯扩张), hybrid (混合模式)')
    parser.add_argument('--gaussian_expansion_radius', type=int, default=15, 
                        help='高斯扩张半径，控制软边缘范围')
    parser.add_argument('--gaussian_expansion_sigma', type=float, default=5.0, 
                        help='高斯扩张的标准差，控制边缘渐变强度')
    parser.add_argument('--edge_fade_strength', type=float, default=0.8, 
                        help='边缘淡化强度 (0.0-1.0)，较高值产生更强的渐变效果')
    parser.add_argument('--save_intermediate', action='store_true', help='保存中间处理结果（mask、空洞图像等）')
    parser.add_argument('--preserve_sharpness', action='store_true', default=True, help='保持图像清晰度（推荐开启）')
    parser.add_argument('--quality_mode', type=str, default='high', choices=['high', 'balanced'], 
                        help='修复质量模式：high (保持最高清晰度) 或 balanced (平衡质量和效果)')
    
    # LaMa相关参数
    parser.add_argument('--lama_device', type=str, default='cpu', choices=['cpu', 'cuda'], 
                        help='LaMa模型运行设备')
    parser.add_argument('--lama_model_dir', type=str, default=None, 
                        help='LaMa模型目录路径（如果不指定，将使用默认模型）')
    
    return parser.parse_args()

def ensure_dir(directory):
    Path(directory).mkdir(parents=True, exist_ok=True)

def keep_largest_connected_component(image, min_area_ratio=0.01):
    """
    只保留图像中最大的连通区域，用于确保每个图像只包含一个人物
    
    Args:
        image: 输入的BGRA图像
        min_area_ratio: 最小区域面积比例阈值，小于此比例的区域将被忽略
    
    Returns:
        处理后的BGRA图像，只包含最大的连通区域
    """
    if image.shape[2] != 4:
        print("警告: 输入图像没有alpha通道，跳过连通区域处理")
        return image
    
    # 提取alpha通道作为mask
    alpha_channel = image[:, :, 3]
    
    # 二值化alpha通道（阈值设为128，即半透明以上认为是前景）
    _, binary_mask = cv2.threshold(alpha_channel, 128, 255, cv2.THRESH_BINARY)
    
    # 形态学操作，去除噪声
    kernel = np.ones((3, 3), np.uint8)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
    
    # 寻找连通区域
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
    
    if num_labels <= 1:  # 只有背景，没有前景区域
        print("警告: 没有找到有效的前景区域")
        return image
    
    # 计算图像总面积
    total_area = image.shape[0] * image.shape[1]
    min_area = total_area * min_area_ratio
    
    # 找到最大的连通区域（排除背景区域，label=0）
    max_area = 0
    largest_label = 0
    
    # 统计有效区域信息
    valid_components = []
    
    for i in range(1, num_labels):  # 从1开始，跳过背景
        area = stats[i, cv2.CC_STAT_AREA]
        if area >= min_area:  # 只考虑面积大于阈值的区域
            valid_components.append((i, area))
            if area > max_area:
                max_area = area
                largest_label = i
    
    if largest_label == 0:
        print("警告: 没有找到满足最小面积要求的连通区域")
        return image
    
    print(f"找到 {len(valid_components)} 个有效连通区域，保留最大区域（面积: {max_area} 像素）")
    
    # 创建新的mask，只保留最大的连通区域
    new_mask = np.zeros_like(binary_mask)
    new_mask[labels == largest_label] = 255
    
    # 对mask进行轻微的形态学平滑
    kernel_smooth = np.ones((2, 2), np.uint8)
    new_mask = cv2.morphologyEx(new_mask, cv2.MORPH_CLOSE, kernel_smooth)
    
    # 应用高斯模糊来平滑边缘（可选）
    new_mask = cv2.GaussianBlur(new_mask, (3, 3), 0)
    
    # 创建结果图像
    result_image = image.copy()
    result_image[:, :, 3] = new_mask
    
    # 对于完全透明的区域，将RGB通道也设为0
    transparent_mask = new_mask == 0
    result_image[transparent_mask, 0:3] = 0
    
    return result_image

def adjust_color_temperature(image, temperature=0.0):
    """
    调整图像色温
    temperature: -1.0 (暖) 到 1.0 (冷)
    """
    if temperature == 0.0:
        return image
    
    # 转换为浮点数进行计算
    img_float = image.astype(np.float32) / 255.0
    
    if temperature > 0:  # 偏冷，减少红色，增加蓝色
        img_float[:, :, 2] = np.clip(img_float[:, :, 2] * (1 + temperature * 0.3), 0, 1)  # 增加蓝色
        img_float[:, :, 0] = np.clip(img_float[:, :, 0] * (1 - temperature * 0.2), 0, 1)  # 减少红色
    else:  # 偏暖，增加红色，减少蓝色
        temp = -temperature
        img_float[:, :, 0] = np.clip(img_float[:, :, 0] * (1 + temp * 0.3), 0, 1)  # 增加红色
        img_float[:, :, 2] = np.clip(img_float[:, :, 2] * (1 - temp * 0.2), 0, 1)  # 减少蓝色
    
    return (img_float * 255).astype(np.uint8)

def white_balance_correction(image):
    """
    简单的白平衡校正
    """
    # 分离通道
    b, g, r = cv2.split(image[:, :, :3])
    
    # 计算每个通道的平均值
    b_mean = np.mean(b)
    g_mean = np.mean(g)
    r_mean = np.mean(r)
    
    # 计算整体平均值
    overall_mean = (b_mean + g_mean + r_mean) / 3
    
    # 计算校正因子
    b_factor = overall_mean / b_mean if b_mean > 0 else 1.0
    g_factor = overall_mean / g_mean if g_mean > 0 else 1.0
    r_factor = overall_mean / r_mean if r_mean > 0 else 1.0
    
    # 限制校正因子的范围
    b_factor = np.clip(b_factor, 0.5, 2.0)
    g_factor = np.clip(g_factor, 0.5, 2.0)
    r_factor = np.clip(r_factor, 0.5, 2.0)
    
    # 应用校正
    b_corrected = np.clip(b * b_factor, 0, 255).astype(np.uint8)
    g_corrected = np.clip(g * g_factor, 0, 255).astype(np.uint8)
    r_corrected = np.clip(r * r_factor, 0, 255).astype(np.uint8)
    
    # 合并通道
    corrected = cv2.merge([b_corrected, g_corrected, r_corrected])
    
    # 如果原图有alpha通道，保留它
    if image.shape[2] == 4:
        corrected = cv2.merge([b_corrected, g_corrected, r_corrected, image[:, :, 3]])
    
    return corrected

def color_enhancement(image):
    """
    颜色增强，提升饱和度和对比度
    """
    # 转换为HSV色彩空间
    if image.shape[2] == 4:
        hsv = cv2.cvtColor(image[:, :, :3], cv2.COLOR_BGR2HSV)
        alpha = image[:, :, 3]
    else:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        alpha = None
    
    hsv = hsv.astype(np.float32)
    
    # 轻微增加饱和度
    hsv[:, :, 1] = hsv[:, :, 1] * 1.1
    hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
    
    # 轻微增加明度
    hsv[:, :, 2] = hsv[:, :, 2] * 1.05
    hsv[:, :, 2] = np.clip(hsv[:, :, 2], 0, 255)
    
    hsv = hsv.astype(np.uint8)
    enhanced = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    if alpha is not None:
        enhanced = cv2.merge([enhanced[:, :, 0], enhanced[:, :, 1], enhanced[:, :, 2], alpha])
    
    return enhanced

def preserve_original_colors(original_region, processed_region, mask_alpha=0.7):
    """
    保留原始颜色信息，与处理后的图像进行混合
    """
    if original_region.shape[:2] != processed_region.shape[:2]:
        original_region = cv2.resize(original_region, (processed_region.shape[1], processed_region.shape[0]))
    
    # 确保两个图像都有相同的通道数
    if len(original_region.shape) == 3 and original_region.shape[2] == 3:
        original_bgra = cv2.cvtColor(original_region, cv2.COLOR_BGR2BGRA)
    else:
        original_bgra = original_region.copy()
    
    if len(processed_region.shape) == 3 and processed_region.shape[2] == 3:
        processed_bgra = cv2.cvtColor(processed_region, cv2.COLOR_BGR2BGRA)
    else:
        processed_bgra = processed_region.copy()
    
    # 获取alpha通道作为mask
    if processed_bgra.shape[2] == 4:
        mask = processed_bgra[:, :, 3].astype(np.float32) / 255.0
    else:
        mask = np.ones((processed_bgra.shape[0], processed_bgra.shape[1]), dtype=np.float32)
    
    # 在有人物的区域混合颜色
    result = processed_bgra.copy().astype(np.float32)
    original_float = original_bgra.astype(np.float32)
    
    for c in range(3):  # BGR通道
        # 在有mask的区域，混合原始颜色和处理后的颜色
        blend_factor = mask * (1 - mask_alpha) + mask_alpha
        result[:, :, c] = (result[:, :, c] * blend_factor + 
                          original_float[:, :, c] * (1 - blend_factor))
    
    return result.astype(np.uint8)

def assess_image_quality(original_image, processed_image, region_mask=None):
    """
    评估处理后图像的质量，特别是清晰度保持情况
    
    Args:
        original_image: 原始图像
        processed_image: 处理后的图像
        region_mask: 可选的评估区域mask
    
    Returns:
        quality_metrics: 质量指标字典
    """
    # 确保图像尺寸一致
    if original_image.shape != processed_image.shape:
        processed_image = cv2.resize(processed_image, (original_image.shape[1], original_image.shape[0]))
    
    # 转换为灰度图像进行清晰度评估
    original_gray = cv2.cvtColor(original_image, cv2.COLOR_BGR2GRAY) if len(original_image.shape) == 3 else original_image
    processed_gray = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY) if len(processed_image.shape) == 3 else processed_image
    
    # 如果有区域mask，只在非修复区域评估
    if region_mask is not None:
        # 反转mask，评估未修复区域
        eval_mask = cv2.bitwise_not(region_mask)
        original_gray = cv2.bitwise_and(original_gray, original_gray, mask=eval_mask)
        processed_gray = cv2.bitwise_and(processed_gray, processed_gray, mask=eval_mask)
    
    # 计算拉普拉斯方差（清晰度指标）
    original_sharpness = cv2.Laplacian(original_gray, cv2.CV_64F).var()
    processed_sharpness = cv2.Laplacian(processed_gray, cv2.CV_64F).var()
    
    # 计算结构相似性指数（SSIM）
    try:
        from skimage.metrics import structural_similarity as ssim
        ssim_score = ssim(original_gray, processed_gray, data_range=255)
    except:
        # 如果skimage不可用，使用简化的相似性计算
        ssim_score = np.corrcoef(original_gray.flatten(), processed_gray.flatten())[0, 1]
    
    # 计算峰值信噪比（PSNR）
    mse = np.mean((original_image.astype(np.float64) - processed_image.astype(np.float64)) ** 2)
    if mse == 0:
        psnr = float('inf')
    else:
        psnr = 20 * np.log10(255.0 / np.sqrt(mse))
    
    quality_metrics = {
        'original_sharpness': original_sharpness,
        'processed_sharpness': processed_sharpness,
        'sharpness_ratio': processed_sharpness / original_sharpness if original_sharpness > 0 else 1.0,
        'ssim': ssim_score,
        'psnr': psnr
    }
    
    return quality_metrics

def create_gaussian_expanded_mask(binary_mask, expansion_radius=15, sigma=5.0, fade_strength=0.8):
    """
    创建具有高斯扩张边缘的掩码，产生自然的渐变过渡
    
    Args:
        binary_mask: 二值化的原始mask
        expansion_radius: 高斯扩张半径
        sigma: 高斯核的标准差
        fade_strength: 边缘淡化强度 (0.0-1.0)
    
    Returns:
        expanded_mask: 具有软边缘的扩张mask (0-255灰度值)
    """
    # 转换为浮点数进行计算
    mask_float = binary_mask.astype(np.float32) / 255.0
    
    # 创建距离变换，获取到前景的距离
    dist_transform = cv2.distanceTransform(
        (1 - mask_float).astype(np.uint8), 
        cv2.DIST_L2, 
        5
    )
    
    # 创建高斯权重函数
    # 在expansion_radius范围内创建从1到fade_strength的渐变
    gaussian_weights = np.exp(-(dist_transform ** 2) / (2 * sigma ** 2))
    
    # 只在扩张半径内应用渐变
    mask_expanded = mask_float.copy()
    expansion_region = (dist_transform <= expansion_radius) & (mask_float == 0)
    
    # 在扩张区域应用高斯权重
    expansion_weights = gaussian_weights[expansion_region]
    # 调整权重范围到 [fade_strength, 1.0]
    expansion_weights = fade_strength + (1 - fade_strength) * expansion_weights
    
    mask_expanded[expansion_region] = expansion_weights
    
    # 转换回0-255范围
    return (mask_expanded * 255).astype(np.uint8)

def create_hybrid_expanded_mask(binary_mask, dilation_size=3, expansion_radius=10, sigma=3.0, fade_strength=0.6):
    """
    创建混合模式的扩张mask：先传统膨胀，再高斯边缘扩张
    
    Args:
        binary_mask: 二值化的原始mask
        dilation_size: 传统膨胀核大小
        expansion_radius: 高斯扩张半径
        sigma: 高斯核标准差
        fade_strength: 边缘淡化强度
    
    Returns:
        hybrid_mask: 混合扩张的mask
    """
    # 先进行传统膨胀
    if dilation_size > 0:
        kernel = np.ones((dilation_size, dilation_size), np.uint8)
        dilated_mask = cv2.dilate(binary_mask, kernel, iterations=1)
    else:
        dilated_mask = binary_mask.copy()
    
    # 再进行高斯扩张
    gaussian_mask = create_gaussian_expanded_mask(
        dilated_mask, expansion_radius, sigma, fade_strength
    )
    
    return gaussian_mask

def create_inpainting_mask(person_region, bbox, original_shape, 
                          mask_dilation=3, expansion_mode='gaussian',
                          gaussian_expansion_radius=15, gaussian_expansion_sigma=5.0, 
                          edge_fade_strength=0.8):
    """
    根据去背景的人物图像创建用于修复的mask，支持多种扩张模式
    
    Args:
        person_region: 去背景后的人物图像 (BGRA)
        bbox: 人物在原图中的边界框 (x, y, w, h)
        original_shape: 原图尺寸 (height, width)
        mask_dilation: 传统膨胀核大小
        expansion_mode: 扩张模式 ('traditional', 'gaussian', 'hybrid')
        gaussian_expansion_radius: 高斯扩张半径
        gaussian_expansion_sigma: 高斯扩张标准差
        edge_fade_strength: 边缘淡化强度
    
    Returns:
        inpaint_mask: 用于图像修复的mask (单通道, 0-255灰度值)
    """
    x, y, w, h = bbox
    
    # 创建与原图相同尺寸的mask
    inpaint_mask = np.zeros((original_shape[0], original_shape[1]), dtype=np.uint8)
    
    # 从人物区域提取alpha通道作为前景mask
    if person_region.shape[2] == 4:
        alpha_channel = person_region[:, :, 3]
        # 二值化alpha通道
        _, binary_mask = cv2.threshold(alpha_channel, 128, 255, cv2.THRESH_BINARY)
    else:
        # 如果没有alpha通道，创建一个简单的矩形mask
        binary_mask = np.ones((person_region.shape[0], person_region.shape[1]), dtype=np.uint8) * 255
    
    # 确保mask尺寸与边界框匹配
    if binary_mask.shape != (h, w):
        binary_mask = cv2.resize(binary_mask, (w, h), interpolation=cv2.INTER_NEAREST)
    
    # 将人物mask放置到原图对应位置
    end_y = min(y + h, original_shape[0])
    end_x = min(x + w, original_shape[1])
    actual_h = end_y - y
    actual_w = end_x - x
    
    if actual_h > 0 and actual_w > 0:
        inpaint_mask[y:end_y, x:end_x] = binary_mask[:actual_h, :actual_w]
    
    # 根据选择的扩张模式处理mask
    if expansion_mode == 'traditional':
        # 传统膨胀方式
        if mask_dilation > 0:
            kernel = np.ones((mask_dilation, mask_dilation), np.uint8)
            inpaint_mask = cv2.dilate(inpaint_mask, kernel, iterations=1)
    
    elif expansion_mode == 'gaussian':
        # 高斯扩张方式
        print(f"应用高斯扩张: 半径={gaussian_expansion_radius}, σ={gaussian_expansion_sigma}, 淡化强度={edge_fade_strength}")
        inpaint_mask = create_gaussian_expanded_mask(
            inpaint_mask, 
            gaussian_expansion_radius, 
            gaussian_expansion_sigma, 
            edge_fade_strength
        )
    
    elif expansion_mode == 'hybrid':
        # 混合模式：传统膨胀 + 高斯扩张
        print(f"应用混合扩张: 膨胀核={mask_dilation}, 高斯半径={gaussian_expansion_radius}")
        inpaint_mask = create_hybrid_expanded_mask(
            inpaint_mask,
            mask_dilation,
            gaussian_expansion_radius,
            gaussian_expansion_sigma,
            edge_fade_strength
        )
    
    return inpaint_mask

def inpaint_with_lama(image, mask, model_name="lama", device="cpu", output_dir="temp_lama_output"):
    """
    使用LaMa模型进行图像修复
    
    Args:
        image: 原始图像 (BGR格式)
        mask: 修复mask (单通道, 255表示需要修复的区域)
        model_name: 模型名称 (lama, lama_large, ldm, zits, mat, fcf等)
        device: 运行设备 (cpu或cuda)
        output_dir: 临时输出目录
    
    Returns:
        inpainted_image: 修复后的图像，如果失败则返回None
    """
    
    # 创建临时目录
    with tempfile.TemporaryDirectory() as temp_dir:
        # 创建子目录
        input_dir = os.path.join(temp_dir, "input")
        mask_dir = os.path.join(temp_dir, "mask")
        output_temp_dir = os.path.join(temp_dir, "output")
        
        os.makedirs(input_dir, exist_ok=True)
        os.makedirs(mask_dir, exist_ok=True)
        os.makedirs(output_temp_dir, exist_ok=True)
        
        # 生成唯一的文件名
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        input_filename = f"input_{unique_id}.png"
        mask_filename = f"mask_{unique_id}.png"
        
        input_path = os.path.join(input_dir, input_filename)
        mask_path = os.path.join(mask_dir, mask_filename)
        
        try:
            # 保存输入图像和mask
            cv2.imwrite(input_path, image, [cv2.IMWRITE_PNG_COMPRESSION, 0])
            cv2.imwrite(mask_path, mask, [cv2.IMWRITE_PNG_COMPRESSION, 0])
            
            print(f"使用 {model_name} 模型进行图像修复...")
            print(f"设备: {device}")
            
            # 构建iopaint命令
            command = [
                "iopaint", "run",
                "--model", model_name,
                "--device", device,
                "--image", input_dir,
                "--mask", mask_path,  # 单个掩码文件
                "--output", output_temp_dir
            ]
            
            # 执行命令
            result = subprocess.run(
                command, 
                capture_output=True, 
                text=True, 
                check=True,
                timeout=300  # 5分钟超时
            )
            
            print("LaMa修复成功!")
            if result.stdout:
                print("输出信息:", result.stdout)
            
            # 查找输出文件
            output_files = [f for f in os.listdir(output_temp_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
            
            if not output_files:
                print("错误: 没有找到输出文件")
                return None
            
            # 读取修复后的图像
            output_file = output_files[0]  # 使用第一个找到的文件
            output_path = os.path.join(output_temp_dir, output_file)
            inpainted_image = cv2.imread(output_path)
            
            if inpainted_image is None:
                print(f"错误: 无法读取输出图像 {output_path}")
                return None
            
            # 如果需要，将结果复制到指定输出目录
            if output_dir and output_dir != "temp_lama_output":
                ensure_dir(output_dir)
                final_output_path = os.path.join(output_dir, f"lama_result_{unique_id}.png")
                cv2.imwrite(final_output_path, inpainted_image, [cv2.IMWRITE_PNG_COMPRESSION, 0])
                print(f"LaMa修复结果已保存到: {final_output_path}")
            
            return inpainted_image
            
        except subprocess.TimeoutExpired:
            print("错误: LaMa修复超时 (5分钟)")
            return None
        except subprocess.CalledProcessError as e:
            print("LaMa修复失败!")
            print("错误码:", e.returncode)
            print("错误信息:", e.stderr)
            return None
        except Exception as e:
            print(f"LaMa修复过程中发生错误: {str(e)}")
            return None

def inpaint_image_opencv(image, mask, method='telea', inpaint_radius=3):
    """
    使用OpenCV的图像修复算法填补空洞，保持清晰度
    
    Args:
        image: 原始图像 (BGR)
        mask: 修复mask (单通道, 255表示需要修复的区域)
        method: 修复方法 ('telea' 或 'ns')
        inpaint_radius: 修复半径
    
    Returns:
        inpainted_image: 修复后的图像
    """
    # 确保输入图像是BGR格式
    if len(image.shape) == 3 and image.shape[2] == 4:
        # 如果是BGRA，转换为BGR
        bgr_image = image[:, :, :3].copy()
    else:
        bgr_image = image.copy()
    
    # 确保数据类型一致性
    bgr_image = bgr_image.astype(np.uint8)
    mask = mask.astype(np.uint8)
    
    # 选择修复算法
    if method == 'telea':
        inpaint_flag = cv2.INPAINT_TELEA
    else:  # ns
        inpaint_flag = cv2.INPAINT_NS
    
    # 执行图像修复
    inpainted = cv2.inpaint(bgr_image, mask, inpaint_radius, inpaint_flag)
    
    # 确保输出数据类型与输入一致
    inpainted = inpainted.astype(np.uint8)
    
    return inpainted

def advanced_inpainting_preprocessing(image, mask, preserve_sharpness=True):
    """
    图像修复的高级预处理，改善修复效果同时保持清晰度
    
    Args:
        image: 原始图像
        mask: 修复mask
        preserve_sharpness: 是否保持图像清晰度
    
    Returns:
        preprocessed_image: 预处理后的图像
        refined_mask: 优化后的mask
    """
    # 对mask进行轻微的形态学操作，平滑边缘
    kernel = np.ones((2, 2), np.uint8)  # 使用更小的核
    refined_mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # 只对mask边缘进行非常轻微的平滑
    refined_mask = cv2.GaussianBlur(refined_mask, (3, 3), 0.5)  # 减小sigma值
    refined_mask = cv2.threshold(refined_mask, 127, 255, cv2.THRESH_BINARY)[1]
    
    # 根据preserve_sharpness参数决定是否进行图像预处理
    if preserve_sharpness:
        # 保持原图不变，不进行任何可能影响清晰度的处理
        preprocessed_image = image.copy()
    else:
        # 轻微去噪（可选）
        preprocessed_image = cv2.bilateralFilter(image, 5, 50, 50)  # 减小参数
    
    return preprocessed_image, refined_mask

def multi_scale_inpainting_opencv(image, mask, method='telea', scales=[1.0], inpaint_radius=3, preserve_sharpness=True):
    """
    多尺度OpenCV图像修复，提高修复质量同时保持清晰度
    
    Args:
        image: 原始图像
        mask: 修复mask
        method: 修复方法
        scales: 修复尺度列表
        inpaint_radius: 修复半径
        preserve_sharpness: 是否保持清晰度
    
    Returns:
        final_result: 最终修复结果
    """
    # 如果要保持清晰度，只使用原尺寸修复
    if preserve_sharpness:
        scales = [1.0]
    
    results = []
    
    for scale in scales:
        if scale != 1.0:
            # 缩放图像和mask
            new_width = int(image.shape[1] * scale)
            new_height = int(image.shape[0] * scale)
            scaled_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            scaled_mask = cv2.resize(mask, (new_width, new_height), interpolation=cv2.INTER_NEAREST)
        else:
            scaled_image = image.copy()
            scaled_mask = mask.copy()
        
        # 执行修复
        scaled_result = inpaint_image_opencv(scaled_image, scaled_mask, method, inpaint_radius)
        
        # 如果需要，将结果缩放回原尺寸
        if scale != 1.0:
            scaled_result = cv2.resize(scaled_result, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_CUBIC)
        
        results.append(scaled_result)
    
    # 如果只有一个尺度，直接返回
    if len(results) == 1:
        return results[0]
    else:
        # 融合多尺度结果（仅在非保持清晰度模式下）
        final_result = results[0].astype(np.float64) * 0.7 + results[1].astype(np.float64) * 0.3
        return np.clip(final_result, 0, 255).astype(np.uint8)

def inpaint_image_unified(image, mask, method='opencv', **kwargs):
    """
    统一的图像修复接口，支持OpenCV和LaMa等方法
    
    Args:
        image: 原始图像 (BGR)
        mask: 修复mask (单通道, 255表示需要修复的区域)
        method: 修复方法 ('opencv', 'lama', 'lama_large', 'ldm', 'zits', 'mat', 'fcf')
        **kwargs: 其他参数
    
    Returns:
        inpainted_image: 修复后的图像
    """
    
    if method == 'opencv':
        # 使用OpenCV方法
        opencv_method = kwargs.get('opencv_method', 'telea')
        inpaint_radius = kwargs.get('inpaint_radius', 3)
        preserve_sharpness = kwargs.get('preserve_sharpness', True)
        
        # 预处理
        preprocessed_image, refined_mask = advanced_inpainting_preprocessing(
            image, mask, preserve_sharpness
        )
        
        # 修复
        scales = [1.0] if preserve_sharpness else [1.0, 0.75]
        result = multi_scale_inpainting_opencv(
            preprocessed_image, refined_mask, 
            method=opencv_method,
            scales=scales,
            inpaint_radius=inpaint_radius,
            preserve_sharpness=preserve_sharpness
        )
        
        return result
    
    else:
        # 使用LaMa等深度学习方法
        device = kwargs.get('device', 'cpu')
        output_dir = kwargs.get('output_dir', 'temp_lama_output')
        
        result = inpaint_with_lama(image, mask, method, device, output_dir)
        
        if result is None:
            print(f"警告: {method} 修复失败，回退到OpenCV方法")
            # 回退到OpenCV
            return inpaint_image_unified(image, mask, method='opencv', **kwargs)
        
        return result

def pad_to_9_16_ratio(image, bbox, padding=0.2, bg_color='transparent', 
                     color_correction=False, temperature_adjust=0.0, 
                     keep_largest_only=True, min_area_ratio=0.01):
    """将包含人物的区域填充到9:16比例，并进行颜色校正和连通区域处理"""
    img_height, img_width = image.shape[:2]
    x, y, w, h = bbox
    
    # 应用填充
    pad_w, pad_h = int(w * padding), int(h * padding)
    x1, y1 = max(0, x - pad_w), max(0, y - pad_h)
    x2, y2 = min(img_width, x + w + pad_w), min(img_height, y + h + pad_h)
    
    # 提取包含人物的区域
    original_region = image[y1:y2, x1:x2].copy()
    
    # 初始化RMBG模型并去除背景
    rmbg_model = init_rmbg_model()
    processed_region = remove_background(original_region, rmbg_model)
    
    # 只保留最大的连通区域（单个人物）
    if keep_largest_only:
        print("应用连通区域分析，只保留最大的人物区域...")
        processed_region = keep_largest_connected_component(processed_region, min_area_ratio)
    
    # 颜色校正
    if color_correction:
        # 保留原始颜色信息
        processed_region = preserve_original_colors(original_region, processed_region, mask_alpha=0.6)
        
        # 白平衡校正
        processed_region = white_balance_correction(processed_region)
        
        # 色温调整
        if temperature_adjust != 0.0:
            processed_region = adjust_color_temperature(processed_region, temperature_adjust)
        
        # 颜色增强
        processed_region = color_enhancement(processed_region)
    
    person_h, person_w = processed_region.shape[:2]
    
    # 计算9:16比例的目标尺寸
    target_ratio = 9 / 16
    
    if person_w > person_h:  # 太宽
        new_width = person_w
        new_height = int(person_w / target_ratio)
    else:  # 太高
        new_height = person_h
        new_width = int(person_h * target_ratio)
    
    # 创建透明背景图像
    result = np.zeros((new_height, new_width, 4), dtype=np.uint8)
    
    # 计算人物区域在新图像中的位置 (居中)
    x_offset = (new_width - person_w) // 2
    y_offset = (new_height - person_h) // 2
    
    # 将人物区域粘贴到新图像中
    result[y_offset:y_offset+person_h, x_offset:x_offset+person_w] = processed_region
    
    # 返回处理后的人物图像和实际使用的边界框
    actual_bbox = (x1, y1, x2-x1, y2-y1)
    
    return result, processed_region, actual_bbox

def detect_with_yolo(image_path, conf_threshold=0.25, padding=40):
    """使用YOLOv5检测人物"""
    # 加载YOLOv5模型
    model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
    model.conf = conf_threshold  # 设置置信度阈值
    model.classes = [0]  # 只检测人物类别 (COCO dataset中的第0类)
    
    # 推理
    results = model(image_path)
    
    # 提取检测结果
    detections = []
    if len(results.xyxy[0]) > 0:
        for det in results.xyxy[0].cpu().numpy():
            x1, y1, x2, y2, conf, cls = det
            if int(cls) == 0:  # 人物类
                detections.append((int(x1)-padding, int(y1)-padding, int(x2-x1)+padding*2, int(y2-y1)+padding*2, float(conf)))
    
    return detections

def detect_with_hog(image_path):
    """使用HOG特征检测人物"""
    image = cv2.imread(image_path)
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    
    # 检测人物
    bounding_boxes, weights = hog.detectMultiScale(
        image, 
        winStride=(8, 8),
        padding=(16, 16), 
        scale=1.05,
        useMeanshiftGrouping=True
    )
    
    detections = []
    for (x, y, w, h), weight in zip(bounding_boxes, weights):
        detections.append((x, y, w, h, float(weight)))
    
    return detections

def detect_with_template(image_path, template_path):
    """使用模板匹配检测人物，适合特定风格的古画"""
    image = cv2.imread(image_path)
    template = cv2.imread(template_path)
    
    # 转换为灰度
    gray_img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_template = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
    
    # 多尺度模板匹配
    detections = []
    scales = np.linspace(0.5, 1.5, 10)
    
    for scale in scales:
        resized_template = cv2.resize(gray_template, (0, 0), fx=scale, fy=scale)
        template_h, template_w = resized_template.shape
        
        # 检查模板尺寸是否超过原图
        if template_h > gray_img.shape[0] or template_w > gray_img.shape[1]:
            continue
        
        result = cv2.matchTemplate(gray_img, resized_template, cv2.TM_CCOEFF_NORMED)
        threshold = 0.7
        loc = np.where(result >= threshold)
        
        for pt in zip(*loc[::-1]):
            detections.append((pt[0], pt[1], template_w, template_h, result[pt[1], pt[0]]))
    
    # 进行非最大抑制
    if detections:
        detections_np = np.array([(x, y, x+w, y+h, score) for x, y, w, h, score in detections])
        indices = cv2.dnn.NMSBoxes(
            detections_np[:, :4].astype(int).tolist(),
            detections_np[:, 4].tolist(),
            0.5,
            0.4
        )
        
        filtered_detections = []
        for i in indices:
            if isinstance(i, np.ndarray):
                i = i.item()
            x, y, w, h, score = detections[i]
            filtered_detections.append((x, y, w, h, score))
        
        return filtered_detections
    
    return []

def init_rmbg_model():
    """初始化RMBG模型"""
    model = AutoModelForImageSegmentation.from_pretrained('./RMBG-2.0', trust_remote_code=True)
    torch.set_float32_matmul_precision(['high', 'highest'][0])
    model.to('cpu')
    model.eval()
    return model

def remove_background(image, rmbg_model):
    """使用RMBG模型去除背景，保持颜色准确性"""
    # 保存原始图像用于颜色参考
    original_image = image.copy()
    
    # 转换为PIL Image
    if isinstance(image, np.ndarray):
        # 如果是OpenCV图像（BGR），转换为RGB
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image[:, :, :3]
            image_rgb = cv2.cvtColor(image_rgb, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
    else:
        pil_image = image

    # 数据预处理
    image_size = (1024, 1024)
    transform_image = transforms.Compose([
        transforms.Resize(image_size),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 准备输入
    input_images = transform_image(pil_image.convert('RGB')).unsqueeze(0).to('cpu')

    # 预测
    with torch.no_grad():
        preds = rmbg_model(input_images)[-1].sigmoid().cpu()
    pred = preds[0].squeeze()
    pred_pil = transforms.ToPILImage()(pred)
    mask = pred_pil.resize(pil_image.size)
    
    # 使用原始颜色和生成的mask
    original_pil = Image.fromarray(cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB))
    original_pil.putalpha(mask)
    
    # 转换回OpenCV格式
    opencv_image = cv2.cvtColor(np.array(original_pil), cv2.COLOR_RGBA2BGRA)
    return opencv_image

def check_iopaint_installation():
    """检查iopaint是否已安装并可用"""
    try:
        result = subprocess.run(['iopaint', '--help'], capture_output=True, text=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def main():
    args = parse_args()
    ensure_dir(args.output_dir)
    
    # 检查LaMa相关依赖
    if args.inpaint_method != 'opencv':
        if not check_iopaint_installation():
            print("错误: 未找到iopaint，无法使用LaMa等深度学习修复方法")
            print("请安装iopaint: pip install iopaint")
            print("或者使用 --inpaint_method opencv 来使用OpenCV修复")
            return
        else:
            print(f"✅ iopaint已安装，将使用 {args.inpaint_method} 模型进行修复")
    
    # 加载图像（同时支持透明通道）
    image = cv2.imread(args.input, cv2.IMREAD_UNCHANGED)
    if image is None:
        print(f"无法加载图像: {args.input}")
        return
    
    # 如果图像只有BGR通道，添加Alpha通道
    if len(image.shape) == 3 and image.shape[2] == 3:
        img_height, img_width = image.shape[:2]
        image_with_alpha = np.zeros((img_height, img_width, 4), dtype=np.uint8)
        image_with_alpha[:, :, 0:3] = image
        image_with_alpha[:, :, 3] = 255  # 设置完全不透明
        image_for_saving = image_with_alpha
    else:
        image_for_saving = image.copy()
    
    img_height, img_width = image.shape[:2]
    print(f"图像尺寸: {img_width}x{img_height}")
    
    # 根据选择的方法检测人物
    if args.method == 'yolo':
        print("使用YOLOv5检测人物...")
        detections = detect_with_yolo(args.input, args.conf_threshold)
    elif args.method == 'hog':
        print("使用HOG检测人物...")
        detections = detect_with_hog(args.input)
    elif args.method == 'custom':
        if args.template is None:
            print("使用自定义模板匹配方法时需要提供模板图像!")
            return
        print("使用模板匹配检测人物...")
        detections = detect_with_template(args.input, args.template)
    
    print(f"检测到 {len(detections)} 个人物")
    
    # 提取并保存9:16区域，同时准备图像修复
    image_name = os.path.splitext(os.path.basename(args.input))[0]
    
    # 创建原图的副本用于修复
    original_for_inpainting = image.copy()
    if len(original_for_inpainting.shape) == 3 and original_for_inpainting.shape[2] == 4:
        original_for_inpainting = original_for_inpainting[:, :, :3]  # 转为BGR用于修复
    
    # 累积所有人物的mask用于最终修复
    cumulative_mask = np.zeros((img_height, img_width), dtype=np.uint8)
    
    for i, (x, y, w, h, conf) in enumerate(detections):
        print(f"\n处理第 {i+1} 个人物...")
        
        # 将人物区域填充到9:16比例，并应用颜色校正和连通区域处理
        padded_image, person_region, actual_bbox = pad_to_9_16_ratio(
            image, (x, y, w, h), 
            args.padding, 
            args.bg_color,
            color_correction=args.color_correction,
            temperature_adjust=args.temperature_adjust,
            keep_largest_only=args.keep_largest_only,
            min_area_ratio=args.min_area_ratio
        )
        
        # 保存人物图像（使用PNG格式以支持透明度）
        output_path = os.path.join(args.output_dir, f"{image_name}_person_{i}.png")
        cv2.imwrite(output_path, padded_image)
        print(f"保存人物到: {output_path}")
        
        # 图像修复处理
        if args.enable_inpainting:
            print(f"为第 {i+1} 个人物创建修复mask (模式: {args.mask_expansion_mode})...")
            
            # 创建用于修复的mask
            inpaint_mask = create_inpainting_mask(
                person_region, actual_bbox, (img_height, img_width), 
                mask_dilation=args.mask_dilation,
                expansion_mode=args.mask_expansion_mode,
                gaussian_expansion_radius=args.gaussian_expansion_radius,
                gaussian_expansion_sigma=args.gaussian_expansion_sigma,
                edge_fade_strength=args.edge_fade_strength
            )
            
            # 累积mask（对于高斯mask，使用最大值合并）
            if args.mask_expansion_mode in ['gaussian', 'hybrid']:
                cumulative_mask = np.maximum(cumulative_mask, inpaint_mask)
            else:
                cumulative_mask = cv2.bitwise_or(cumulative_mask, inpaint_mask)
            
            # 保存中间结果（可选）
            if args.save_intermediate:
                # 保存个人mask
                mask_path = os.path.join(args.output_dir, f"{image_name}_person_{i}_mask_{args.mask_expansion_mode}.png")
                cv2.imwrite(mask_path, inpaint_mask)
                
                # 如果使用高斯扩张，额外保存可视化版本
                if args.mask_expansion_mode in ['gaussian', 'hybrid']:
                    # 创建彩色可视化mask：原始区域为红色，扩张区域为渐变
                    mask_vis = np.zeros((inpaint_mask.shape[0], inpaint_mask.shape[1], 3), dtype=np.uint8)
                    
                    # 原始区域（高强度）为红色
                    high_intensity = inpaint_mask > 200
                    mask_vis[high_intensity] = [0, 0, 255]  # 红色
                    
                    # 扩张区域（中等强度）为黄色渐变
                    medium_intensity = (inpaint_mask > 50) & (inpaint_mask <= 200)
                    intensity_ratio = inpaint_mask[medium_intensity].astype(np.float32) / 255.0
                    mask_vis[medium_intensity, 0] = (intensity_ratio * 255).astype(np.uint8)  # 蓝色通道
                    mask_vis[medium_intensity, 1] = (intensity_ratio * 255).astype(np.uint8)  # 绿色通道
                    mask_vis[medium_intensity, 2] = 255  # 红色通道固定
                    
                    mask_vis_path = os.path.join(args.output_dir, f"{image_name}_person_{i}_mask_visualization.png")
                    cv2.imwrite(mask_vis_path, mask_vis)
                    print(f"保存mask可视化: {mask_vis_path}")
                
                # 创建显示空洞的图像
                hollow_image = original_for_inpainting.copy()
                # 对于高斯mask，使用渐变的红色显示
                if args.mask_expansion_mode in ['gaussian', 'hybrid']:
                    mask_normalized = inpaint_mask.astype(np.float32) / 255.0
                    for c in range(3):
                        if c == 2:  # 红色通道
                            hollow_image[:, :, c] = ((1 - mask_normalized) * hollow_image[:, :, c] + 
                                                   mask_normalized * 255).astype(np.uint8)
                        else:  # 蓝绿通道
                            hollow_image[:, :, c] = ((1 - mask_normalized) * hollow_image[:, :, c]).astype(np.uint8)
                else:
                    hollow_image[inpaint_mask > 0] = [0, 0, 255]  # 传统红色显示
                
                hollow_path = os.path.join(args.output_dir, f"{image_name}_person_{i}_hollow_{args.mask_expansion_mode}.png")
                cv2.imwrite(hollow_path, hollow_image)
                print(f"保存中间结果: {mask_path}, {hollow_path}")
    
    # 执行最终的图像修复
    if args.enable_inpainting and np.any(cumulative_mask > 0):
        print(f"\n执行图像修复 (使用 {args.inpaint_method} 方法)...")
        
        # 准备修复参数
        inpaint_kwargs = {
            'opencv_method': args.opencv_method,
            'inpaint_radius': args.inpaint_radius,
            'preserve_sharpness': args.preserve_sharpness,
            'device': args.lama_device,
            'output_dir': args.output_dir
        }
        
        # 统一修复接口
        inpainted_result = inpaint_image_unified(
            original_for_inpainting, 
            cumulative_mask, 
            method=args.inpaint_method,
            **inpaint_kwargs
        )
        
        if inpainted_result is not None:
            # 确保修复结果的数据类型与原图一致
            inpainted_result = inpainted_result.astype(original_for_inpainting.dtype)
            
            # 保存修复结果
            inpainted_path = os.path.join(args.output_dir, f"{image_name}_inpainted_{args.inpaint_method}_{args.mask_expansion_mode}.png")
            # 使用无损压缩保存
            cv2.imwrite(inpainted_path, inpainted_result, [cv2.IMWRITE_PNG_COMPRESSION, 0])
            print(f"保存修复后的图像到: {inpainted_path}")
            
            # 保存最终累积mask（可选）
            if args.save_intermediate:
                final_mask_path = os.path.join(args.output_dir, f"{image_name}_final_mask_{args.mask_expansion_mode}.png")
                cv2.imwrite(final_mask_path, cumulative_mask)
                
                # 创建对比图像
                comparison = np.hstack([
                    original_for_inpainting, 
                    cv2.cvtColor(cumulative_mask, cv2.COLOR_GRAY2BGR),
                    inpainted_result
                ])
                comparison_path = os.path.join(args.output_dir, f"{image_name}_comparison_{args.inpaint_method}_{args.mask_expansion_mode}.png")
                cv2.imwrite(comparison_path, comparison, [cv2.IMWRITE_PNG_COMPRESSION, 0])
                print(f"保存对比图像到: {comparison_path}")
                
                # 输出图像质量信息
                original_size = os.path.getsize(args.input)
                inpainted_size = os.path.getsize(inpainted_path)
                print(f"原图大小: {original_size / 1024 / 1024:.2f} MB")
                print(f"修复图大小: {inpainted_size / 1024 / 1024:.2f} MB")
                print(f"尺寸比例: {inpainted_size / original_size:.2f}")
            
            print(f"修复完成，使用方法: {args.inpaint_method}")
            
            # 质量评估
            if args.save_intermediate and args.inpaint_method == 'opencv':
                print("\n=== 图像质量评估 ===")
                try:
                    quality_metrics = assess_image_quality(
                        original_for_inpainting, 
                        inpainted_result, 
                        cumulative_mask
                    )
                    
                    print(f"清晰度保持率: {quality_metrics['sharpness_ratio']:.3f}")
                    print(f"结构相似性 (SSIM): {quality_metrics['ssim']:.3f}")
                    print(f"峰值信噪比 (PSNR): {quality_metrics['psnr']:.2f} dB")
                    
                    # 提供质量建议
                    if quality_metrics['sharpness_ratio'] < 0.9:
                        print("\n⚠️  建议: 清晰度有所下降，可尝试以下选项：")
                        print("   --preserve_sharpness (已默认开启)")
                        print("   --quality_mode high")
                        print("   --inpaint_radius 2")
                        print("   或尝试 --inpaint_method lama (需要安装iopaint)")
                    elif quality_metrics['sharpness_ratio'] >= 0.95:
                        print("\n✅ 清晰度保持良好!")
                        
                except Exception as e:
                    print(f"质量评估失败: {e}")
        else:
            print("❌ 图像修复失败")
    
    # 在原图上绘制检测结果
    result_image = image_for_saving.copy()
    for x, y, w, h, conf in detections:
        # 绘制原始边界框
        if len(result_image.shape) == 3 and result_image.shape[2] == 4:
            # 对于BGRA图像，创建一个BGR副本用于绘制
            bgr_image = result_image[:,:,0:3].copy()
            cv2.rectangle(bgr_image, (x, y), (x+w, y+h), (0, 255, 0), 2)
            # 添加置信度标注
            conf_text = f"{conf:.2f}"
            # 计算文本位置（右上角）
            text_size = cv2.getTextSize(conf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            text_x = x + w - text_size[0] - 5
            text_y = y + text_size[1] + 5
            cv2.putText(bgr_image, conf_text, (text_x, text_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            result_image[:,:,0:3] = bgr_image
        else:
            cv2.rectangle(result_image, (x, y), (x+w, y+h), (0, 255, 0), 2)
            # 添加置信度标注
            conf_text = f"{conf:.2f}"
            # 计算文本位置（右上角）
            text_size = cv2.getTextSize(conf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            text_x = x + w - text_size[0] - 5
            text_y = y + text_size[1] + 5
            cv2.putText(result_image, conf_text, (text_x, text_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # 保存标记后的图像
    output_path = os.path.join(args.output_dir, f"{image_name}_detected.png")
    cv2.imwrite(output_path, result_image)
    print(f"保存检测结果到: {output_path}")
    
    print("\n处理完成!")
    if args.enable_inpainting:
        print(f"图像修复功能已启用，使用方法: {args.inpaint_method}")
        print("检查输出目录查看修复结果。")
        
        print(f"\n使用参数:")
        print(f"  修复方法: {args.inpaint_method}")
        print(f"  掩码扩张模式: {args.mask_expansion_mode}")
        if args.mask_expansion_mode == 'traditional':
            print(f"  膨胀核大小: {args.mask_dilation}")
        elif args.mask_expansion_mode == 'gaussian':
            print(f"  高斯扩张半径: {args.gaussian_expansion_radius}")
            print(f"  高斯标准差: {args.gaussian_expansion_sigma}")
            print(f"  边缘淡化强度: {args.edge_fade_strength}")
        elif args.mask_expansion_mode == 'hybrid':
            print(f"  传统膨胀核: {args.mask_dilation}")
            print(f"  高斯扩张半径: {args.gaussian_expansion_radius}")
            print(f"  边缘淡化强度: {args.edge_fade_strength}")
        
        if args.inpaint_method == 'opencv':
            print(f"  OpenCV方法: {args.opencv_method}")
            print(f"  修复半径: {args.inpaint_radius}")
            print(f"  清晰度保持: {'是' if args.preserve_sharpness else '否'}")
        else:
            print(f"  运行设备: {args.lama_device}")
        print(f"  质量模式: {args.quality_mode}")

if __name__ == "__main__":
    main()