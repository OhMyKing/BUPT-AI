import subprocess
import os
import shutil

def iopaint_inpaint_single(input_image, mask_image, output_dir, model="lama", device="cpu"):
    """
    使用iopaint进行单张图像修复
    注意：iopaint run 是批量处理命令，需要文件夹作为输入
    """
    # 创建临时文件夹
    temp_input_dir = "temp_input"
    temp_mask_dir = "temp_mask"
    
    try:
        # 创建临时目录
        os.makedirs(temp_input_dir, exist_ok=True)
        os.makedirs(temp_mask_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        
        # 获取文件名（不含路径）
        input_filename = os.path.basename(input_image)
        mask_filename = os.path.basename(mask_image)
        
        # 复制文件到临时目录
        temp_input_path = os.path.join(temp_input_dir, input_filename)
        temp_mask_path = os.path.join(temp_mask_dir, mask_filename)
        
        shutil.copy2(input_image, temp_input_path)
        shutil.copy2(mask_image, temp_mask_path)
        
        # 构建命令
        command = [
            "iopaint", "run",
            "--model", model,
            "--device", device,
            "--image", temp_input_dir,
            "--mask", temp_mask_path,  # 单个掩码文件
            "--output", output_dir
        ]
        
        # 执行命令
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print("修复成功!")
        print("输出:", result.stdout)
        return True
        
    except subprocess.CalledProcessError as e:
        print("修复失败!")
        print("错误码:", e.returncode)
        print("错误信息:", e.stderr)
        return False
    finally:
        # 清理临时文件夹
        if os.path.exists(temp_input_dir):
            shutil.rmtree(temp_input_dir)
        if os.path.exists(temp_mask_dir):
            shutil.rmtree(temp_mask_dir)

def iopaint_inpaint_batch(input_folder, mask_folder, output_folder, model="lama", device="cpu"):
    """
    批量处理图像修复
    """
    command = [
        "iopaint", "run",
        "--model", model,
        "--device", device,
        "--image", input_folder,
        "--mask", mask_folder,
        "--output", output_folder
    ]
    
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print("批量修复成功!")
        print("输出:", result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print("批量修复失败!")
        print("错误码:", e.returncode)
        print("错误信息:", e.stderr)
        return False

# 使用示例

# 单张图像修复
success = iopaint_inpaint_single(
    input_image="input.jpeg",
    mask_image="mask.png", 
    output_dir="output",
    model="lama",
    device="cpu"
)

# 批量处理（如果你有多张图片）
# success_batch = iopaint_inpaint_batch(
#     input_folder="input_images/",
#     mask_folder="mask_images/",  # 或者单个掩码文件路径
#     output_folder="output_images/",
#     model="lama",
#     device="cpu"
# )