import os
import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
import subprocess
import tempfile

def init_rmbg_model(device='cpu'):
    """
    初始化RMBG-2.0模型用于图像分割
    
    Args:
        device: 使用的设备 ('cpu' 或 'cuda')
    """
    print("初始化RMBG-2.0模型...")
    
    # 如果模型不存在，则从Hugging Face下载
    if not os.path.exists('./models/RMBG-2.0'):
        print("下载RMBG-2.0模型，这可能需要一些时间...")
        model = AutoModelForImageSegmentation.from_pretrained("briaai/RMBG-2.0", trust_remote_code=True)
        model.save_pretrained('./models/RMBG-2.0')
    
    # 加载模型
    model = AutoModelForImageSegmentation.from_pretrained('./models/RMBG-2.0', trust_remote_code=True)
    torch.set_float32_matmul_precision('high')
    model.to(device)
    model.eval()
    
    print("RMBG-2.0模型加载完成")
    return model

def remove_background(image, rmbg_model):
    """
    使用RMBG模型去除图像背景
    
    Args:
        image: 输入图像 (BGR格式的NumPy数组)
        rmbg_model: 预先加载的RMBG模型
    
    Returns:
        透明背景的图像 (BGRA格式)
    """
    # 保存原始图像用于颜色参考
    original_image = image.copy()
    
    # 转换为RGB格式的PIL Image
    if isinstance(image, np.ndarray):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(image_rgb)
    else:
        pil_image = image

    # 数据预处理
    transform_image = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 准备输入并进行预测
    device = next(rmbg_model.parameters()).device
    input_images = transform_image(pil_image.convert('RGB')).unsqueeze(0).to(device)
    
    with torch.no_grad():
        preds = rmbg_model(input_images)[-1].sigmoid().cpu()
    
    pred = preds[0].squeeze()
    pred_pil = transforms.ToPILImage()(pred)
    mask = pred_pil.resize(pil_image.size)
    
    # 使用原始颜色和生成的mask
    original_pil = Image.fromarray(cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB))
    original_pil.putalpha(mask)
    
    # 转换回OpenCV格式 (BGRA)
    opencv_image = cv2.cvtColor(np.array(original_pil), cv2.COLOR_RGBA2BGRA)
    return opencv_image

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
    
    # 创建新的mask，只保留最大的连通区域
    new_mask = np.zeros_like(binary_mask)
    new_mask[labels == largest_label] = 255
    
    # 对mask进行轻微的形态学平滑
    kernel_smooth = np.ones((2, 2), np.uint8)
    new_mask = cv2.morphologyEx(new_mask, cv2.MORPH_CLOSE, kernel_smooth)
    
    # 应用高斯模糊来平滑边缘
    new_mask = cv2.GaussianBlur(new_mask, (3, 3), 0)
    
    # 创建结果图像
    result_image = image.copy()
    result_image[:, :, 3] = new_mask
    
    # 对于完全透明的区域，将RGB通道也设为0
    transparent_mask = new_mask == 0
    result_image[transparent_mask, 0:3] = 0
    
    return result_image

def pad_to_9_16_ratio(image, bbox, padding=0.2):
    """
    将人物区域填充到9:16比例
    
    Args:
        image: 原始图像
        bbox: 边界框 {'x': x, 'y': y, 'width': w, 'height': h}
        padding: 边界框填充比例，默认为0.2
    
    Returns:
        padded_image: 填充后的图像 (BGRA格式)
    """
    img_height, img_width = image.shape[:2]
    x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
    
    # 计算9:16比例的目标尺寸
    target_ratio = 9 / 16
    
    if w / h > target_ratio:  # 太宽
        new_width = w
        new_height = int(new_width / target_ratio)
    else:  # 太高
        new_height = h
        new_width = int(new_height * target_ratio)
    
    # 创建透明背景图像
    padded_image = np.zeros((new_height, new_width, 4), dtype=np.uint8)
    
    # 计算人物区域在新图像中的位置 (居中)
    x_offset = (new_width - w) // 2
    y_offset = (new_height - h) // 2
    
    # 将人物区域粘贴到新图像中
    padded_image[y_offset:y_offset+h, x_offset:x_offset+w] = image
    
    return padded_image

def create_gaussian_expanded_mask(binary_mask, expansion_radius=20, sigma=6.0, fade_strength=0.7):
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

def create_hybrid_expanded_mask(binary_mask, dilation_size=3, expansion_radius=20, sigma=6.0, fade_strength=0.7):
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

def create_mask_from_alpha(alpha_channel, expansion_mode='gaussian', dilation_size=3, 
                          expansion_radius=20, sigma=6.0, fade_strength=0.7):
    """
    从alpha通道创建修复mask，支持多种扩张模式
    
    Args:
        alpha_channel: Alpha通道 (单通道, 0-255)
        expansion_mode: 扩张模式 ('traditional', 'gaussian', 'hybrid')
        dilation_size: 传统膨胀核大小
        expansion_radius: 高斯扩张半径
        sigma: 高斯核的标准差
        fade_strength: 边缘淡化强度
    
    Returns:
        expanded_mask: 扩张后的mask
    """
    # 二值化alpha通道
    _, binary_mask = cv2.threshold(alpha_channel, 128, 255, cv2.THRESH_BINARY)
    
    # 根据选择的扩张模式处理mask
    if expansion_mode == 'traditional':
        # 传统膨胀方式
        kernel = np.ones((dilation_size, dilation_size), np.uint8)
        expanded_mask = cv2.dilate(binary_mask, kernel)
    elif expansion_mode == 'gaussian':
        # 高斯扩张方式
        expanded_mask = create_gaussian_expanded_mask(
            binary_mask, expansion_radius, sigma, fade_strength
        )
    elif expansion_mode == 'hybrid':
        # 混合模式：传统膨胀 + 高斯扩张
        expanded_mask = create_hybrid_expanded_mask(
            binary_mask, dilation_size, expansion_radius, sigma, fade_strength
        )
    else:
        # 默认使用传统膨胀
        kernel = np.ones((dilation_size, dilation_size), np.uint8)
        expanded_mask = cv2.dilate(binary_mask, kernel)
    
    return expanded_mask

def inpaint_background(image, mask, inpaint_method='lama', device='cpu'):
    """
    使用指定的方法修复图像背景
    
    Args:
        image: 原始图像 (BGR格式)
        mask: 需要修复的区域 (单通道, 255表示需要修复的区域)
        inpaint_method: 修复方法 ('lama', 'opencv')
        device: 设备类型 ('cpu', 'cuda')
    
    Returns:
        inpainted_image: 修复后的图像
    """
    # 确保输入是BGR格式
    if len(image.shape) == 4:
        bgr_image = image[:, :, :3].copy()
    else:
        bgr_image = image.copy()
    
    # 优先使用LaMa进行修复
    if inpaint_method == 'lama':
        try:
            print("使用LaMa模型进行背景修复...")
            return inpaint_with_lama(bgr_image, mask, model_name="lama", device=device)
        except Exception as e:
            print(f"LaMa修复失败: {e}，回退到OpenCV修复")
            return cv2.inpaint(bgr_image, mask, 3, cv2.INPAINT_TELEA)
    else:
        # 使用OpenCV方法
        return cv2.inpaint(bgr_image, mask, 3, cv2.INPAINT_TELEA)
    
def inpaint_with_lama(image, mask, model_name="lama", device="cpu"):
    """
    使用LaMa模型进行图像修复
    
    Args:
        image: 原始图像 (BGR格式)
        mask: 修复mask (单通道, 255表示需要修复的区域)
        model_name: 模型名称 (默认为"lama")
        device: 设备类型 ('cpu', 'cuda')
    
    Returns:
        inpainted_image: 修复后的图像
    """
    # 创建临时目录
    with tempfile.TemporaryDirectory() as temp_dir:
        # 创建子目录
        input_dir = os.path.join(temp_dir, "input")
        mask_dir = os.path.join(temp_dir, "mask")
        output_dir = os.path.join(temp_dir, "output")
        
        os.makedirs(input_dir, exist_ok=True)
        os.makedirs(mask_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        
        # 生成唯一的文件名
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        input_path = os.path.join(input_dir, f"input_{unique_id}.png")
        mask_path = os.path.join(mask_dir, f"mask_{unique_id}.png")
        
        # 保存输入图像和mask
        cv2.imwrite(input_path, image, [cv2.IMWRITE_PNG_COMPRESSION, 0])  # 无损压缩
        cv2.imwrite(mask_path, mask, [cv2.IMWRITE_PNG_COMPRESSION, 0])
        
        # 构建iopaint命令
        command = [
            "iopaint", "run",
            "--model", model_name,
            "--device", device,
            "--image", input_dir,
            "--mask", mask_path,
            "--output", output_dir
        ]
        
        # 执行命令
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True, 
            check=True,
            timeout=300  # 5分钟超时
        )
        
        # 查找输出文件
        output_files = [f for f in os.listdir(output_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
        
        if not output_files:
            raise Exception("没有找到输出文件")
        
        # 读取修复后的图像
        output_path = os.path.join(output_dir, output_files[0])
        inpainted_image = cv2.imread(output_path)
        
        if inpainted_image is None:
            raise Exception(f"无法读取输出图像 {output_path}")
        
        return inpainted_image
    
def process_image(image_path, detection, output_dir, rmbg_model, padding=0.2):
    """
    处理图像：分割人物、去除背景、修复背景
    
    Args:
        image_path: 原始图像路径
        detection: 检测到的人物信息
        output_dir: 输出目录
        rmbg_model: 预加载的RMBG模型
        padding: 边界框填充比例，默认为0.2
    
    Returns:
        character_path: 处理后的人物图像路径
        background_path: 修复后的背景图像路径
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 读取原始图像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"无法加载图像: {image_path}")
    
    # 提取带填充的人物区域
    x, y, w, h = detection['x'], detection['y'], detection['width'], detection['height']
    img_height, img_width = image.shape[:2]
    
    # 应用填充
    pad_w, pad_h = int(w * padding), int(h * padding)
    x1, y1 = max(0, x - pad_w), max(0, y - pad_h)
    x2, y2 = min(img_width, x + w + pad_w), min(img_height, y + h + pad_h)
    
    # 提取包含人物的区域，包括额外的填充
    person_region = image[y1:y2, x1:x2].copy()
    
    # 使用RMBG去除背景
    person_no_bg = remove_background(person_region, rmbg_model)
    
    # 应用连通区域处理，只保留最大的人物区域
    person_no_bg = keep_largest_connected_component(person_no_bg)
    
    # 将人物填充到9:16比例
    padded_person = pad_to_9_16_ratio(person_no_bg, {'x': 0, 'y': 0, 'width': x2-x1, 'height': y2-y1})
    
    # 保存人物图像
    character_filename = f"person_{detection['id']}.png"
    character_path = os.path.join(output_dir, character_filename)
    cv2.imwrite(character_path, padded_person)
    
    # 创建用于背景修复的mask
    if person_no_bg.shape[2] == 4:  # 确保有alpha通道
        alpha_channel = person_no_bg[:, :, 3]
        # 创建与原始图像大小相同的mask
        full_mask = np.zeros((image.shape[0], image.shape[1]), dtype=np.uint8)
        # 使用高斯扩张创建mask
        mask_region = create_mask_from_alpha(
            alpha_channel,
            expansion_mode='gaussian',
            expansion_radius=20,
            sigma=6.0,
            fade_strength=0.7
        )
        full_mask[y1:y2, x1:x2] = mask_region
        
        # 使用LaMa修复背景
        inpainted_image = inpaint_background(
            image, 
            full_mask, 
            inpaint_method='lama', 
            device='cpu'
        )
        
        # 保存修复后的背景
        background_filename = f"inpainted_{detection['id']}.png"
        background_path = os.path.join(output_dir, background_filename)
        cv2.imwrite(background_path, inpainted_image, [cv2.IMWRITE_PNG_COMPRESSION, 0])
    else:
        # 如果没有alpha通道，仅复制原始图像作为背景
        background_path = os.path.join(output_dir, "original_background.jpg")
        cv2.imwrite(background_path, image)
    
    return character_path, background_path

def create_combined_mask(detections, person_regions_with_alpha, image_shape):
    """
    创建包含所有人物的组合mask，用于统一背景修复
    
    Args:
        detections: 所有检测到的人物信息列表
        person_regions_with_alpha: 带有alpha通道的人物区域列表
        image_shape: 原始图像形状 (height, width)
    
    Returns:
        combined_mask: 组合后的mask
    """
    # 创建与原始图像大小相同的mask
    combined_mask = np.zeros((image_shape[0], image_shape[1]), dtype=np.uint8)
    
    # 将每个人物的alpha通道添加到mask中
    for detection, person_region in zip(detections, person_regions_with_alpha):
        if person_region.shape[2] == 4:  # 确保有alpha通道
            x, y, w, h = detection['x'], detection['y'], detection['width'], detection['height']
            alpha_channel = person_region[:, :, 3]
            
            # 使用高斯扩张创建mask
            mask_region = create_mask_from_alpha(
                alpha_channel,
                expansion_mode='gaussian',
                expansion_radius=20,
                sigma=6.0,
                fade_strength=0.7
            )
            
            # 确保mask区域不超出原图范围
            roi_height, roi_width = mask_region.shape[:2]
            # 确保不超出边界
            end_y = min(y + roi_height, image_shape[0])
            end_x = min(x + roi_width, image_shape[1])
            # 计算实际放置的尺寸
            actual_h = end_y - y
            actual_w = end_x - x
            
            if actual_h > 0 and actual_w > 0:
                # 对于高斯mask，使用最大值融合以保持边缘渐变
                current_mask = combined_mask[y:end_y, x:end_x]
                new_mask_region = mask_region[:actual_h, :actual_w]
                combined_mask[y:end_y, x:end_x] = np.maximum(current_mask, new_mask_region)
    
    return combined_mask

def process_all_characters(image_path, detections, output_dir, rmbg_model, padding=0.2):
    """
    处理图像中的所有人物：分割人物、去除背景、统一修复背景
    
    Args:
        image_path: 原始图像路径
        detections: 检测到的所有人物信息
        output_dir: 输出目录
        rmbg_model: 预加载的RMBG模型
        padding: 边界框填充比例，默认为0.2
    
    Returns:
        character_paths: 处理后的所有人物图像路径列表
        background_path: 统一修复后的背景图像路径
    """
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 读取原始图像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"无法加载图像: {image_path}")
    
    img_height, img_width = image.shape[:2]
    
    # 存储所有处理后的人物区域
    processed_regions = []
    character_paths = []
    
    # 存储原始检测信息
    original_detections = []
    for detection in detections:
        original_detections.append(detection.copy())
    
    # 处理每个人物区域
    for i, detection in enumerate(detections):
        # 提取人物区域，应用填充
        x, y, w, h = detection['x'], detection['y'], detection['width'], detection['height']
        
        # 应用填充
        pad_w, pad_h = int(w * padding), int(h * padding)
        x1, y1 = max(0, x - pad_w), max(0, y - pad_h)
        x2, y2 = min(img_width, x + w + pad_w), min(img_height, y + h + pad_h)
        padded_w, padded_h = x2 - x1, y2 - y1
        
        # 提取包含人物的区域
        person_region = image[y1:y2, x1:x2].copy()
        
        # 使用RMBG去除背景
        person_no_bg = remove_background(person_region, rmbg_model)
        
        # 应用连通区域处理，只保留最大的人物区域
        person_no_bg = keep_largest_connected_component(person_no_bg)
        
        # 将人物填充到9:16比例
        padded_person = pad_to_9_16_ratio(person_no_bg, {'x': 0, 'y': 0, 'width': padded_w, 'height': padded_h})
        
        # 保存人物图像
        character_filename = f"person_{detection['id']}.png"
        character_path = os.path.join(output_dir, character_filename)
        cv2.imwrite(character_path, padded_person)
        
        # 添加到结果列表
        processed_regions.append(person_no_bg)
        character_paths.append(character_path)
        
        # 更新detection中的坐标为填充后的坐标
        detection['x'] = x1
        detection['y'] = y1
        detection['width'] = padded_w
        detection['height'] = padded_h
    
    # 创建组合mask用于统一背景修复
    combined_mask = create_combined_mask(detections, processed_regions, image.shape[:2])
    
    # 使用LaMa修复背景
    inpainted_image = inpaint_background(
        image, 
        combined_mask, 
        inpaint_method='lama', 
        device='cpu'
    )
    
    # 保存修复后的背景
    background_filename = "inpainted_all.png"
    background_path = os.path.join(output_dir, background_filename)
    cv2.imwrite(background_path, inpainted_image, [cv2.IMWRITE_PNG_COMPRESSION, 0])
    
    # 恢复detections中的原始坐标
    for i, detection in enumerate(detections):
        detection.update(original_detections[i])
    
    return character_paths, background_path