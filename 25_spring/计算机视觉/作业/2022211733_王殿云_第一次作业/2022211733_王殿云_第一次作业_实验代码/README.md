## 环境配置

### 使用Conda配置环境（推荐）

项目包含一个配置好的环境文件，可以直接使用conda创建所需环境：

```bash
# 克隆仓库（或直接下载ZIP）
git clone [仓库URL] coin-detection
cd coin-detection

# 使用conda创建环境
conda env create -f environment.yml

# 激活环境
conda activate cv
```

### 手动配置环境（如果不使用conda）

如果不使用conda，您需要安装以下依赖：

1. Python 3.6+
2. OpenCV 4.x（包含C++开发库）
3. Flask
4. NumPy
5. Matplotlib
6. pybind11
7. 支持C++14和OpenMP的编译器

## 编译C++模块

系统使用C++实现了高性能Canny边缘检测算法，需要先编译才能使用：

```bash
# 确保已激活正确的环境
conda activate cv

# 进入canny_cpp目录
cd canny_cpp

# 使用pip编译安装模块
pip install -e .
# 返回项目根目录
cd ..
```

如果编译成功，会在canny_cpp目录下生成`my_canny.*.so`文件（Linux/macOS）或`my_canny.*.pyd`文件（Windows）。

## 运行系统

### 命令行模式

```bash
# 使用OpenCV实现处理图像文件夹
python coin_detection.py --method opencv --input_folder images --output_folder output_opencv

# 使用自定义实现处理图像文件夹
python coin_detection.py --method mycv --input_folder images --output_folder output_mycv
```

### Web应用模式

```bash
# 启动Web服务器
python app.py

# 打开浏览器访问以下地址
# http://127.0.0.1:5000
```

在Web界面中：
1. 点击"选择文件"上传一张包含硬币的图像
2. 点击"上传"按钮
3. 使用滑动条调整算法参数，观察检测效果
4. 点击参数预设按钮快速应用常用参数组合

## 项目结构说明

```
.
├── app.py                    # Web应用主程序
├── canny_cpp/                # C++实现的Canny模块
│   ├── canny.cpp             # Canny算法C++实现
│   ├── canny.h               # 头文件
│   ├── python_bindings.cpp   # Python绑定代码
│   └── setup.py              # 构建脚本
├── coin_detection.py         # 命令行检测主程序
├── environment.yml           # Conda环境配置文件
├── images/                   # 测试图像文件夹
├── mycv.py                   # 自定义计算机视觉算法模块
└── templates/                # Web应用模板
    └── index.html            # Web界面
```

## 可能遇到的问题及解决方案

### 编译错误

**问题**：编译C++模块时出现与OpenCV或OpenMP相关的错误。

**解决方案**：
- 确保已安装OpenCV开发库。在Linux上可以使用`sudo apt install libopencv-dev`安装。
- 确保编译器支持OpenMP。GCC和最新版本的Clang通常都支持。
- 在macOS上可能需要安装libomp：`brew install libomp`。

### 运行时错误

**问题**：运行时无法找到`my_canny`模块。

**解决方案**：
- 确保已编译C++模块并生成了`.so`（Linux/macOS）或`.pyd`（Windows）文件。
- 确保从项目根目录运行Python脚本。
- 尝试将`canny_cpp`目录添加到Python路径：
  ```python
  import sys
  sys.path.append('canny_cpp')
  ```

### Web应用问题

**问题**：Web应用启动时出现地址已被占用的错误。

**解决方案**：
- 关闭已在运行的Flask应用。
- 修改`app.py`中的端口号：
  ```python
  if __name__ == '__main__':
      app.run(debug=True, port=5001)  # 修改端口号
  ```