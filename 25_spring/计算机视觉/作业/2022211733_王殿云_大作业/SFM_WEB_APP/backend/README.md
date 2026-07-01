# SFM点云处理与优化系统

这是一个基于Flask和React的SFM（Structure from Motion）点云处理和相机优化系统。

## 功能特性

### 点云处理
- **统计离群点去除 (SOR)**: 基于统计分析去除离群点
- **半径离群点去除**: 去除在指定半径内邻居数量不足的点
- **DBSCAN聚类去噪**: 使用密度聚类算法识别和去除噪声
- **泊松表面重建**: 从点云生成连续的三角网格表面

### 场景优化
- **稀疏区域检测**: 自动检测点云中的稀疏区域并可视化
- **相机位置优化**: 计算最佳的补充相机位置以提高重建质量
- **覆盖度分析**: 分析现有相机配置的场景覆盖情况

## 项目结构

```
sfm-viewer/
├── app.py                    # Flask后端主文件
├── modules/
│   ├── ply_processor.py      # PLY文件处理模块
│   ├── pointcloud_processor.py # 点云处理算法模块
│   └── camera_optimizer.py    # 相机优化算法模块
├── uploads/                  # 上传文件存储目录
├── requirements.txt          # Python依赖
└── README.md                # 本文件
```

## 安装和运行

### 1. 安装Python依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 创建必要的目录结构

```bash
mkdir modules
mkdir uploads
```

### 3. 将代码文件放置到相应位置

- 将 `app.py` 放在项目根目录
- 将 `ply_processor.py`、`pointcloud_processor.py`、`camera_optimizer.py` 放在 `modules/` 目录下

### 4. 启动Flask后端

```bash
python app.py
```

后端将在 `http://localhost:5000` 启动

### 5. 启动React前端

将React组件代码保存为HTML文件，或创建一个React应用：

```bash
# 如果使用Create React App
npx create-react-app sfm-viewer-frontend
cd sfm-viewer-frontend

# 将React组件代码复制到 src/App.js
# 安装额外依赖
npm install three

# 启动前端
npm start
```

前端将在 `http://localhost:3000` 启动

## 使用说明

1. **上传PLY文件**: 点击"选择PLY文件"按钮上传点云数据
2. **上传相机文件**: 点击"选择相机参数文件"按钮上传相机参数（支持多选）
3. **调整可视化参数**: 使用滑块调整点云大小和相机模型大小
4. **处理点云**: 
   - 选择不同的处理方法去除噪声和离群点
   - 处理后的点云会自动更新显示
5. **分析和优化**:
   - 点击"分析稀疏区域"检测点云中的稀疏部分
   - 点击"优化相机位置"获取建议的补充拍摄位置
6. **导出结果**: 点击"导出点云"保存处理后的点云文件

## API接口

### POST /api/upload_ply
上传PLY点云文件

### POST /api/upload_cameras
上传相机参数文件（支持多个）

### POST /api/process_pointcloud
处理点云，支持的方法：
- `statistical_outlier_removal`
- `radius_outlier_removal`
- `dbscan_clustering`
- `poisson_reconstruction`

### POST /api/analyze_sparse_regions
分析点云中的稀疏区域

### POST /api/optimize_cameras
基于当前场景优化相机位置

### GET /api/export_pointcloud
导出处理后的点云文件

## 相机参数文件格式

相机参数文件应为文本文件，包含23个数值：
- 前9个数值：相机内参矩阵K (3x3)
- 接下来9个数值：旋转矩阵R (3x3)
- 接下来3个数值：平移向量t
- 最后2个数值：图像宽度和高度

示例：
```
fx 0 cx
0 fy cy
0 0 1
r11 r12 r13
r21 r22 r23
r31 r32 r33
tx ty tz
width height
```

## 注意事项

1. 确保上传的PLY文件格式正确（支持ASCII和二进制格式）
2. 大型点云文件可能需要较长的处理时间
3. Open3D库用于泊松重建，如果安装失败，该功能将降级处理
4. 建议的相机位置是基于当前场景的启发式算法，实际拍摄时需要考虑物理可行性

## 故障排除

1. **CORS错误**: 确保Flask后端已启用CORS
2. **文件上传失败**: 检查uploads目录权限
3. **处理超时**: 对于大型点云，考虑增加请求超时时间
4. **Open3D安装问题**: 某些系统可能需要额外的依赖，参考Open3D官方文档