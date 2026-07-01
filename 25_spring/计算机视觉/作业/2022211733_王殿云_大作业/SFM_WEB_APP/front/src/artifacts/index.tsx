import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  Upload, Camera, Eye, EyeOff, RefreshCw, Maximize, 
  Download, Settings, Layers, Activity, AlertCircle,
  FileUp, Sliders, Grid3x3, Box, Sparkles, Target,
  ZoomIn, RotateCw, Home, ImageIcon, FileImage
} from 'lucide-react';

const SFMViewer = () => {
  // 状态管理
  const [pointCloud, setPointCloud] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(-1);
  const [isInCameraView, setIsInCameraView] = useState(false);
  const [sparseRegions, setSparseRegions] = useState([]);
  const [suggestedCameras, setSuggestedCameras] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('准备就绪');
  
  // SFM重建相关状态
  const [sfmImages, setSfmImages] = useState([]);
  const [sfmIntrinsics, setSfmIntrinsics] = useState([]);
  const [reconstructing, setReconstructing] = useState(false);
  
  // 可视化参数
  const [pointSize, setPointSize] = useState(0.01);
  const [cameraSize, setCameraSize] = useState(0.2);
  const [showSparseRegions, setShowSparseRegions] = useState(true);
  const [showSuggestedCameras, setShowSuggestedCameras] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  
  // Three.js 引用
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const pointCloudRef = useRef(null);
  const cameraModelsRef = useRef([]);
  const sparseRegionModelsRef = useRef([]);
  const suggestedCameraModelsRef = useRef([]);
  const gridRef = useRef(null);
  const axesRef = useRef(null);
  const previousCameraPosition = useRef(new THREE.Vector3());
  const cameraCheckThreshold = 0.01;

  // 初始化Three.js场景
  useEffect(() => {
    if (!mountRef.current) return;

    // 场景设置
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 50, 200);
    sceneRef.current = scene;

    // 相机设置
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // 渲染器设置
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 控制器设置
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 光照设置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // 添加额外的光源以更好地照亮相机模型
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-10, 10, -10);
    scene.add(directionalLight2);

    // 坐标轴
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    axesRef.current = axesHelper;

    // 创建无限延展的网格
    createInfiniteGrid(scene);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // 检查是否仍在相机视角
      checkCameraView();
      
      renderer.render(scene, camera);
    };
    animate();

    // 窗口大小调整
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // 创建无限延展的网格
  const createInfiniteGrid = (scene) => {
    const gridMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec2 coord = vWorldPosition.xz;
          vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
          float line = min(grid.x, grid.y);
          float lineResult = 1.0 - min(line, 1.0);
          
          vec3 color = vec3(0.15);
          if (abs(vWorldPosition.x) < 0.1) color = vec3(0.5, 0.0, 0.0);
          if (abs(vWorldPosition.z) < 0.1) color = vec3(0.0, 0.0, 0.5);
          
          gl_FragColor = vec4(color, lineResult * 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const gridGeometry = new THREE.PlaneGeometry(2000, 2000);
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);
    gridRef.current = grid;
  };

  // 检查是否仍在相机视角
  const checkCameraView = () => {
    if (isInCameraView && selectedCamera >= 0 && selectedCamera < cameras.length) {
      const currentCam = cameras[selectedCamera];
      const camPosition = currentCam.position instanceof THREE.Vector3 
        ? currentCam.position 
        : new THREE.Vector3(currentCam.position[0], currentCam.position[1], currentCam.position[2]);
      const distance = cameraRef.current.position.distanceTo(camPosition);
      
      if (distance > cameraCheckThreshold) {
        exitCameraView();
      }
    }
  };

  // 退出相机视角模式
  const exitCameraView = () => {
    setIsInCameraView(false);
    setSelectedCamera(-1);
    
    // 显示所有相机模型
    setAllCamerasVisibility(true);
    
    setMessage('已退出相机视角');
  };

  // 显示/隐藏所有相机
  const setAllCamerasVisibility = (visible) => {
    [...cameraModelsRef.current, ...suggestedCameraModelsRef.current].forEach(model => {
      if (model) model.visible = visible;
    });
  };

  // 加载PLY文件
  const handlePLYUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setProcessing(true);
      setMessage('正在上传PLY文件...');
      
      const response = await fetch('http://localhost:5005/api/upload_ply', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('上传失败');
      
      const data = await response.json();
      displayPointCloud(data.points, data.colors);
      setMessage(`PLY文件已加载，点数：${(data.points.length / 3).toLocaleString()}`);
    } catch (error) {
      setMessage(`错误：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 加载相机文件
  const handleCameraUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let file of files) {
      formData.append('files', file);
    }

    try {
      setProcessing(true);
      setMessage('正在上传相机参数文件...');
      
      const response = await fetch('http://localhost:5005/api/upload_cameras', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('上传失败');
      
      const data = await response.json();
      displayCameras(data.cameras);
      setMessage(`已加载 ${data.cameras.length} 个相机`);
    } catch (error) {
      setMessage(`错误：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 处理SFM图片选择
  const handleSfmImagesUpload = (event) => {
    const files = Array.from(event.target.files);
    setSfmImages(files);
    setMessage(`已选择 ${files.length} 张图片`);
  };

  // 处理SFM内参文件选择
  const handleSfmIntrinsicsUpload = (event) => {
    const files = Array.from(event.target.files);
    setSfmIntrinsics(files);
    setMessage(`已选择 ${files.length} 个内参文件`);
  };

  // 开始SFM重建
  const startSfmReconstruction = async () => {
    if (sfmImages.length === 0) {
      setMessage('请先选择图片');
      return;
    }

    const formData = new FormData();
    
    // 添加图片
    sfmImages.forEach(file => {
      formData.append('images', file);
    });
    
    // 添加内参文件
    sfmIntrinsics.forEach(file => {
      formData.append('intrinsics', file);
    });

    try {
      setReconstructing(true);
      setMessage('正在进行SFM重建...');
      
      const response = await fetch('http://localhost:5005/api/sfm_reconstruct', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('重建失败');
      
      const data = await response.json();
      
      // 显示重建结果
      displayPointCloud(data.points, data.colors);
      displayCameras(data.cameras);
      
      setMessage(`SFM重建完成！生成了 ${(data.points.length / 3).toLocaleString()} 个点和 ${data.cameras.length} 个相机`);
      
      // 清空选择的文件
      setSfmImages([]);
      setSfmIntrinsics([]);
    } catch (error) {
      setMessage(`SFM重建失败：${error.message}`);
    } finally {
      setReconstructing(false);
    }
  };

  // 显示点云
  const displayPointCloud = (positions, colors) => {
    // 移除旧的点云
    if (pointCloudRef.current) {
      sceneRef.current.remove(pointCloudRef.current);
      pointCloudRef.current.geometry.dispose();
      pointCloudRef.current.material.dispose();
    }

    // 处理点云坐标
    const processedPositions = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) {
      processedPositions[i] = positions[i];        // X
      processedPositions[i + 1] = positions[i + 1]; // Y
      processedPositions[i + 2] = positions[i + 2];  // Z
    }

    // 创建新的点云
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(processedPositions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);
    pointCloudRef.current = points;

    // 计算包围盒
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    controlsRef.current.target.copy(center);
    
    setPointCloud({ points: positions });
  };

  // 显示相机
  const displayCameras = (camerasData) => {
    // 清除旧的相机模型
    cameraModelsRef.current.forEach(model => {
      sceneRef.current.remove(model);
    });
    cameraModelsRef.current = [];

    // 创建新的相机模型
    camerasData.forEach((cam, index) => {
      const cameraGroup = createEnhancedCameraModel(cam, index);
      sceneRef.current.add(cameraGroup);
      cameraModelsRef.current.push(cameraGroup);
    });

    // 更新相机数据，确保包含计算后的位置和旋转
    const updatedCameras = camerasData.map((cam, index) => {
      const model = cameraModelsRef.current[index];
      if (model && model.userData.cameraData) {
        return model.userData.cameraData;
      }
      return cam;
    });

    setCameras(updatedCameras);
  };

  // 矩阵转置函数
  const transposeMatrix3 = (m) => {
    return [
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]]
    ];
  };

  // 创建相机模型
  const createEnhancedCameraModel = (cameraData, index, isSuggested = false) => {
    const group = new THREE.Group();
    const scale = cameraSize;

    // 从cameraData中提取参数
    let position, rotation, K, R, t, fovY, aspectRatio;
    
    if (cameraData.K && cameraData.R && cameraData.t) {
      // 如果有原始相机参数，计算位置和旋转
      K = cameraData.K;
      R = cameraData.R;
      t = cameraData.t;
      
      // 计算相机的位置（C = -R^T * t）
      const Rt = transposeMatrix3(R);
      const C = [
        -(Rt[0][0] * t[0] + Rt[0][1] * t[1] + Rt[0][2] * t[2]),
        -(Rt[1][0] * t[0] + Rt[1][1] * t[1] + Rt[1][2] * t[2]),
        -(Rt[2][0] * t[0] + Rt[2][1] * t[1] + Rt[2][2] * t[2])
      ];
      position = new THREE.Vector3(C[0], C[1], C[2]);
      
      // 从旋转矩阵获取旋转
      const rotMatrix = new THREE.Matrix4();
      rotMatrix.set(
        R[0][0], R[0][1], R[0][2], 0,
        R[1][0], R[1][1], R[1][2], 0,
        R[2][0], R[2][1], R[2][2], 0,
        0, 0, 0, 1
      );
      
      const euler = new THREE.Euler();
      euler.setFromRotationMatrix(rotMatrix, 'XYZ');
      rotation = euler;
      
      // 计算FOV
      const height = cameraData.height || 1080;
      fovY = 2 * Math.atan(height / (2 * K[1][1]));
      aspectRatio = cameraData.width / height || 1920 / 1080;
    } else {
      // 使用预计算的位置和旋转（建议相机的情况）
      position = new THREE.Vector3(cameraData.position[0], cameraData.position[1], cameraData.position[2]);
      rotation = new THREE.Euler(cameraData.rotation[0], cameraData.rotation[1], cameraData.rotation[2]);
      fovY = Math.PI / 3; // 默认60度
      aspectRatio = 1.5;
    }

    // 相机机身
    const bodyWidth = scale * 0.3;
    const bodyHeight = scale * 0.2;
    const bodyDepth = scale * 0.4;
    
    const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: isSuggested ? 0x00ff88 : 0x444444,
      opacity: isSuggested ? 0.8 : 1,
      transparent: isSuggested
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.z = bodyDepth / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 镜头
    const lensRadius = scale * 0.12;
    const lensDepth = scale * 0.15;
    const lensGeometry = new THREE.CylinderGeometry(lensRadius, lensRadius, lensDepth, 16);
    const lensMaterial = new THREE.MeshPhongMaterial({ 
      color: isSuggested ? 0x00cc66 : 0x222222,
      opacity: isSuggested ? 0.8 : 1,
      transparent: isSuggested
    });
    const lensMesh = new THREE.Mesh(lensGeometry, lensMaterial);
    lensMesh.rotation.x = Math.PI / 2;
    lensMesh.position.z = -lensDepth / 2;
    lensMesh.castShadow = true;
    group.add(lensMesh);

    // 取景器
    const finderGeometry = new THREE.BoxGeometry(bodyWidth * 0.5, bodyHeight * 0.3, bodyDepth * 0.3);
    const finderMaterial = new THREE.MeshPhongMaterial({ 
      color: isSuggested ? 0x009955 : 0x555555,
      opacity: isSuggested ? 0.8 : 1,
      transparent: isSuggested
    });
    const finderMesh = new THREE.Mesh(finderGeometry, finderMaterial);
    finderMesh.position.y = bodyHeight * 0.65;
    finderMesh.position.z = bodyDepth * 0.3;
    finderMesh.castShadow = true;
    group.add(finderMesh);

    // 视锥体线框（基于相机参数）
    const near = scale * 0.3;
    const far = scale * 4;  // 增加远距离，更好地显示朝向
    const frustumHeight = 2 * Math.tan(fovY / 2) * far;
    const frustumWidth = frustumHeight * aspectRatio;
    
    const frustumGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // 从相机中心到远平面四个角的连线
      0, 0, 0,  -frustumWidth/2, -frustumHeight/2, -far,
      0, 0, 0,   frustumWidth/2, -frustumHeight/2, -far,
      0, 0, 0,   frustumWidth/2,  frustumHeight/2, -far,
      0, 0, 0,  -frustumWidth/2,  frustumHeight/2, -far,
      
      // 远平面的边框
      -frustumWidth/2, -frustumHeight/2, -far,  frustumWidth/2, -frustumHeight/2, -far,
       frustumWidth/2, -frustumHeight/2, -far,  frustumWidth/2,  frustumHeight/2, -far,
       frustumWidth/2,  frustumHeight/2, -far, -frustumWidth/2,  frustumHeight/2, -far,
      -frustumWidth/2,  frustumHeight/2, -far, -frustumWidth/2, -frustumHeight/2, -far,
      
      // 近平面的边框
      -bodyWidth/2, -bodyHeight/2, -near,  bodyWidth/2, -bodyHeight/2, -near,
       bodyWidth/2, -bodyHeight/2, -near,  bodyWidth/2,  bodyHeight/2, -near,
       bodyWidth/2,  bodyHeight/2, -near, -bodyWidth/2,  bodyHeight/2, -near,
      -bodyWidth/2,  bodyHeight/2, -near, -bodyWidth/2, -bodyHeight/2, -near,
      
      // 添加中轴线，更清楚地显示相机朝向
      0, 0, 0, 0, 0, -far * 0.8
    ]);
    
    frustumGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const frustumMaterial = new THREE.LineBasicMaterial({ 
      color: isSuggested ? 0x00ffaa : 0xffa500,
      linewidth: 2,
      opacity: 0.6,
      transparent: true
    });
    const frustumLines = new THREE.LineSegments(frustumGeometry, frustumMaterial);
    group.add(frustumLines);

    // 相机局部坐标轴 - 增强版本
    const axisLength = scale * 0.6;
    const axisGroup = new THREE.Group();
    
    // X轴 - 红色（右）
    const xGeometry = new THREE.BufferGeometry();
    xGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0, axisLength,0,0]), 3));
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const xAxis = new THREE.Line(xGeometry, xMaterial);
    axisGroup.add(xAxis);
    
    // Y轴 - 绿色（上）
    const yGeometry = new THREE.BufferGeometry();
    yGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0, 0,axisLength,0]), 3));
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    axisGroup.add(yAxis);
    
    // Z轴 - 蓝色（相机朝向，向前为负Z）
    const zGeometry = new THREE.BufferGeometry();
    zGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0, 0,0,-axisLength]), 3));
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 3 });
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    axisGroup.add(zAxis);
    
    group.add(axisGroup);

    // 中心点标记
    const centerGeometry = new THREE.SphereGeometry(scale * 0.06, 16, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ 
      color: isSuggested ? 0x00ff88 : 0xff4444,
    });
    const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
    group.add(centerMesh);

    // 如果是建议相机，添加指向目标的射线
    if (isSuggested && cameraData.target_region) {
      const targetPos = new THREE.Vector3(
        cameraData.target_region[0], 
        cameraData.target_region[1], 
        cameraData.target_region[2]
      );
      const direction = targetPos.clone().sub(position).normalize();
      const distance = position.distanceTo(targetPos);
      
      // 创建指向目标的射线
      const rayGeometry = new THREE.BufferGeometry();
      rayGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        0, 0, 0,  // 相机位置
        direction.x * distance, direction.y * distance, direction.z * distance  // 目标位置
      ]), 3));
      
      const rayMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff4444, 
        linewidth: 3,
        opacity: 0.5,
        transparent: true
      });
      const rayLine = new THREE.Line(rayGeometry, rayMaterial);
      group.add(rayLine);
      
      // 在目标位置添加标记
      const targetGeometry = new THREE.SphereGeometry(scale * 0.08, 8, 8);
      const targetMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff4444,
        opacity: 0.7,
        transparent: true
      });
      const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
      targetMesh.position.copy(direction.multiplyScalar(distance));
      group.add(targetMesh);
    }

    // 相机标签
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'rgba(0,0,0,0.7)';
    context.fillRect(0, 0, 256, 64);
    context.fillStyle = isSuggested ? '#00ff88' : '#ffffff';
    context.font = 'bold 18px Arial';
    context.textAlign = 'center';
    
    let shortName;
    if (isSuggested) {
      shortName = `建议相机${index + 1}`;
      if (cameraData.score) {
        context.font = 'bold 16px Arial';
        context.fillText(`建议相机${index + 1}`, 128, 25);
        context.fillText(`评分: ${cameraData.score.toFixed(2)}`, 128, 45);
      } else {
        context.fillText(shortName, 128, 35);
      }
    } else {
      shortName = cameraData.filename ? cameraData.filename.replace('.camera', '').replace('.txt', '') : `相机${index + 1}`;
      context.fillText(shortName, 128, 35);
    }
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      sizeAttenuation: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.25, 0.06, 1);
    sprite.position.y = bodyHeight * 1.8;
    group.add(sprite);

    // 设置位置和旋转
    group.position.copy(position);
    group.rotation.copy(rotation);

    // 添加用户数据
    group.userData = { 
      index, 
      isSuggested,
      cameraData: {
        ...cameraData,
        position: position,
        rotation: rotation,
        K: K,
        R: R,
        t: t,
        fovY: fovY,
        aspectRatio: aspectRatio
      }
    };

    return group;
  };

  // 创建相机模型（保留原方法用于兼容）
  const createCameraModel = (cameraData, index) => {
    return createEnhancedCameraModel(cameraData, index, false);
  };

  // 切换到相机视角
  const switchToCamera = (index) => {
    if (index < 0 || index >= cameras.length) return;
    
    setSelectedCamera(index);
    setIsInCameraView(true);
    const cam = cameras[index];
    
    // 获取相机的位置和旋转
    const position = cam.position instanceof THREE.Vector3 ? cam.position : new THREE.Vector3(cam.position[0], cam.position[1], cam.position[2]);
    const rotation = cam.rotation instanceof THREE.Euler ? cam.rotation : new THREE.Euler(cam.rotation[0], cam.rotation[1], cam.rotation[2]);
    
    // 计算相机前方的点作为目标
    const forward = new THREE.Vector3(0, 0, -5);
    forward.applyEuler(rotation);
    const target = position.clone().add(forward);
    
    // 设置相机位置和目标
    cameraRef.current.position.copy(position);
    controlsRef.current.target.copy(target);
    cameraRef.current.lookAt(target);
    
    // 隐藏所有相机模型
    setAllCamerasVisibility(false);
    
    setMessage(`切换到相机: ${cam.filename}`);
  };

  // 重置视角
  const resetView = () => {
    cameraRef.current.position.set(5, 5, 5);
    controlsRef.current.target.set(0, 0, 0);
    cameraRef.current.lookAt(0, 0, 0);
    
    exitCameraView();
    
    setMessage('视角已重置');
  };

  // 适应场景
  const fitToScene = () => {
    if (!pointCloudRef.current && cameras.length === 0) {
      setMessage('没有场景内容可适应');
      return;
    }
    
    const box = new THREE.Box3();
    
    // 添加点云到包围盒
    if (pointCloudRef.current) {
      box.setFromObject(pointCloudRef.current);
    }
    
    // 添加所有相机到包围盒
    [...cameraModelsRef.current, ...suggestedCameraModelsRef.current].forEach(model => {
      if (model && model.visible) {
        box.expandByObject(model);
      }
    });
    
    if (box.isEmpty()) {
      setMessage('无法计算场景包围盒');
      return;
    }
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
    
    cameraRef.current.position.set(
      center.x + distance * 0.1,
      center.y + distance * 0.1,
      center.z + distance * 0.1
    );
    controlsRef.current.target.copy(center);
    cameraRef.current.lookAt(center);
    
    exitCameraView();
    
    setMessage('视角已适应场景');
  };

  // 点云处理功能
  const processPointCloud = async (method) => {
    if (!pointCloudRef.current) {
      setMessage('请先加载点云');
      return;
    }

    try {
      setProcessing(true);
      setMessage(`正在进行${method}处理...`);

      const response = await fetch('http://localhost:5005/api/process_pointcloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });

      if (!response.ok) throw new Error('处理失败');

      const data = await response.json();
      displayPointCloud(data.points, data.colors);
      setMessage(`${method}处理完成，剩余点数：${(data.points.length / 3).toLocaleString()}`);
    } catch (error) {
      setMessage(`错误：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 分析稀疏区域
  const analyzeSparseRegions = async () => {
    if (!pointCloudRef.current) {
      setMessage('请先加载点云');
      return;
    }

    try {
      setProcessing(true);
      setMessage('正在分析稀疏区域...');

      const response = await fetch('http://localhost:5005/api/analyze_sparse_regions', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('分析失败');

      const data = await response.json();
      displaySparseRegions(data.sparse_regions);
      setSparseRegions(data.sparse_regions);
      setMessage(`发现 ${data.sparse_regions.length} 个稀疏区域`);
    } catch (error) {
      setMessage(`错误：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 显示稀疏区域
  const displaySparseRegions = (regions) => {
    // 清除旧的稀疏区域显示
    sparseRegionModelsRef.current.forEach(model => {
      sceneRef.current.remove(model);
    });
    sparseRegionModelsRef.current = [];

    if (!showSparseRegions) return;

    // 创建新的稀疏区域显示
    regions.forEach(region => {
      const geometry = new THREE.SphereGeometry(region.radius, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        opacity: 0.3,
        transparent: true,
        side: THREE.DoubleSide
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(region.center[0], region.center[1], region.center[2]);
      sceneRef.current.add(sphere);
      sparseRegionModelsRef.current.push(sphere);
    });
  };

  // 优化相机位置
  const optimizeCameraPositions = async () => {
    if (!pointCloudRef.current || cameras.length === 0) {
      setMessage('请先加载点云和相机');
      return;
    }

    try {
      setProcessing(true);
      setMessage('正在计算优化相机位置...');

      const response = await fetch('http://localhost:5005/api/optimize_cameras', {
        method: 'POST'
      });

      if (!response.ok) throw new Error('优化失败');

      const data = await response.json();
      displaySuggestedCameras(data.suggested_cameras);
      setSuggestedCameras(data.suggested_cameras);
      setMessage(`建议添加 ${data.suggested_cameras.length} 个相机位置`);
    } catch (error) {
      setMessage(`错误：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 显示建议的相机位置
  const displaySuggestedCameras = (suggestedCams) => {
    // 清除旧的建议相机
    suggestedCameraModelsRef.current.forEach(model => {
      sceneRef.current.remove(model);
      // 清理几何体和材质
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    suggestedCameraModelsRef.current = [];

    if (!showSuggestedCameras) return;

    // 创建新的建议相机显示
    suggestedCams.forEach((cam, index) => {
      // 确保相机数据格式正确，包含目标区域信息
      const cameraData = {
        ...cam,
        filename: cam.filename || `建议相机${index + 1}`,
        width: cam.width || 1920,
        height: cam.height || 1080,
        target_region: cam.target_region || null  // 包含目标区域信息
      };
      
      const group = createEnhancedCameraModel(cameraData, index, true);
      sceneRef.current.add(group);
      suggestedCameraModelsRef.current.push(group);
    });
    
    console.log(`显示了 ${suggestedCams.length} 个建议相机位置`);
  };

  // 导出处理后的点云
  const exportPointCloud = async () => {
    if (!pointCloudRef.current) {
      setMessage('没有点云可导出');
      return;
    }

    try {
      const response = await fetch('http://localhost:5005/api/export_pointcloud');
      if (!response.ok) throw new Error('导出失败');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'processed_pointcloud.ply';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('点云已导出');
    } catch (error) {
      setMessage(`错误：${error.message}`);
    }
  };

  // 切换网格显示
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // 切换坐标轴显示
  useEffect(() => {
    if (axesRef.current) {
      axesRef.current.visible = showAxes;
    }
  }, [showAxes]);

  return (
    <div className="w-full h-screen bg-[#1a1a1a] text-gray-200 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-[#252525] border-b border-[#333] flex items-center px-4 z-20 shadow-lg">
        <div className="flex items-center space-x-1">
          <Box className="w-6 h-6 text-[#00b4d8] mr-2" />
          <h1 className="text-lg font-semibold text-gray-100">SFM System</h1>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-1">
            {/* 视图控制按钮组 */}
            <button
              onClick={resetView}
              className="p-2 hover:bg-[#333] rounded transition-colors group relative"
              title="重置视角"
            >
              <Home className="w-5 h-5 text-gray-400 group-hover:text-[#00b4d8]" />
            </button>
            <button
              onClick={fitToScene}
              className="p-2 hover:bg-[#333] rounded transition-colors group relative"
              title="适应场景"
            >
              <Maximize className="w-5 h-5 text-gray-400 group-hover:text-[#00b4d8]" />
            </button>
            <div className="w-px h-6 bg-[#333] mx-1" />
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 hover:bg-[#333] rounded transition-colors group relative ${showGrid ? 'bg-[#333]' : ''}`}
              title="切换网格"
            >
              <Grid3x3 className={`w-5 h-5 ${showGrid ? 'text-[#00b4d8]' : 'text-gray-400'} group-hover:text-[#00b4d8]`} />
            </button>
            <button
              onClick={() => setShowAxes(!showAxes)}
              className={`p-2 hover:bg-[#333] rounded transition-colors group relative ${showAxes ? 'bg-[#333]' : ''}`}
              title="切换坐标轴"
            >
              <Activity className={`w-5 h-5 ${showAxes ? 'text-[#00b4d8]' : 'text-gray-400'} group-hover:text-[#00b4d8]`} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">{message}</span>
          {processing && (
            <div className="w-4 h-4 border-2 border-[#00b4d8] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* 3D视图 */}
      <div ref={mountRef} className="w-full h-full pt-12" />

      {/* 左侧工具面板 */}
      <div className="absolute left-0 top-12 bottom-0 w-80 bg-[#252525] border-r border-[#333] overflow-y-auto">
        {/* SFM重建 */}
        <div className="border-b border-[#333]">
          <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
            <ImageIcon className="w-4 h-4 mr-2 text-[#00b4d8]" />
            <h3 className="font-medium">SFM重建</h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                图片文件 {sfmImages.length > 0 && <span className="text-[#00b4d8]">({sfmImages.length} 个)</span>}
              </label>
              <label className="flex items-center justify-center px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                <FileImage className="w-4 h-4 mr-2" />
                <span className="text-sm">选择图片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSfmImagesUpload}
                  disabled={processing || reconstructing}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                内参文件 {sfmIntrinsics.length > 0 && <span className="text-[#00b4d8]">({sfmIntrinsics.length} 个)</span>}
                <span className="text-xs text-gray-500 ml-1">(可选)</span>
              </label>
              <label className="flex items-center justify-center px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                <Settings className="w-4 h-4 mr-2" />
                <span className="text-sm">选择内参</span>
                <input
                  type="file"
                  accept=".txt,.K"
                  multiple
                  onChange={handleSfmIntrinsicsUpload}
                  disabled={processing || reconstructing}
                  className="hidden"
                />
              </label>
            </div>
            <button
              onClick={startSfmReconstruction}
              disabled={processing || reconstructing || sfmImages.length === 0}
              className="w-full px-4 py-3 bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-[#151515] disabled:text-gray-600 text-white rounded transition-colors flex items-center justify-center"
            >
              {reconstructing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  重建中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  开始重建
                </>
              )}
            </button>
          </div>
        </div>

        {/* 文件导入 */}
        <div className="border-b border-[#333]">
          <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
            <FileUp className="w-4 h-4 mr-2 text-[#00b4d8]" />
            <h3 className="font-medium">数据导入</h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">点云文件 (PLY)</label>
              <label className="flex items-center justify-center px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                <span className="text-sm">选择文件</span>
                <input
                  type="file"
                  accept=".ply"
                  onChange={handlePLYUpload}
                  disabled={processing}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">相机参数文件</label>
              <label className="flex items-center justify-center px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded cursor-pointer hover:bg-[#2a2a2a] transition-colors">
                <Camera className="w-4 h-4 mr-2" />
                <span className="text-sm">选择文件</span>
                <input
                  type="file"
                  accept=".camera,.txt"
                  multiple
                  onChange={handleCameraUpload}
                  disabled={processing}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 可视化参数 */}
        <div className="border-b border-[#333]">
          <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
            <Sliders className="w-4 h-4 mr-2 text-[#00b4d8]" />
            <h3 className="font-medium">可视化参数</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">点云大小</label>
                <span className="text-xs text-gray-500">{pointSize.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={pointSize}
                onChange={(e) => {
                  setPointSize(parseFloat(e.target.value));
                  if (pointCloudRef.current) {
                    pointCloudRef.current.material.size = parseFloat(e.target.value);
                  }
                }}
                className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">相机大小</label>
                <span className="text-xs text-gray-500">{cameraSize.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={cameraSize}
                onChange={(e) => {
                  setCameraSize(parseFloat(e.target.value));
                  [...cameraModelsRef.current, ...suggestedCameraModelsRef.current].forEach(model => {
                    model.scale.setScalar(parseFloat(e.target.value) / 0.2);
                  });
                }}
                className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showSparseRegions}
                  onChange={(e) => {
                    setShowSparseRegions(e.target.checked);
                    sparseRegionModelsRef.current.forEach(model => {
                      model.visible = e.target.checked;
                    });
                  }}
                  className="mr-3 w-4 h-4 text-[#00b4d8] bg-[#1a1a1a] border-[#333] rounded focus:ring-[#00b4d8]"
                />
                <AlertCircle className="w-4 h-4 mr-2 text-[#ff6b6b]" />
                <span className="text-sm group-hover:text-gray-100">显示稀疏区域</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showSuggestedCameras}
                  onChange={(e) => {
                    setShowSuggestedCameras(e.target.checked);
                    suggestedCameraModelsRef.current.forEach(model => {
                      model.visible = e.target.checked;
                    });
                  }}
                  className="mr-3 w-4 h-4 text-[#00b4d8] bg-[#1a1a1a] border-[#333] rounded focus:ring-[#00b4d8]"
                />
                <Target className="w-4 h-4 mr-2 text-[#00ff88]" />
                <span className="text-sm group-hover:text-gray-100">显示建议相机</span>
              </label>
            </div>
          </div>
        </div>

        {/* 场景信息 */}
        <div className="border-b border-[#333]">
          <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
            <Activity className="w-4 h-4 mr-2 text-[#00b4d8]" />
            <h3 className="font-medium">场景统计</h3>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">点云点数</span>
              <span className="font-mono">{pointCloud ? (pointCloud.points.length / 3).toLocaleString() : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">相机数量</span>
              <span className="font-mono">{cameras.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">稀疏区域</span>
              <span className="font-mono text-[#ff6b6b]">{sparseRegions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">建议相机</span>
              <span className="font-mono text-[#00ff88]">{suggestedCameras.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧处理工具面板 */}
      <div className="absolute right-0 top-12 bottom-0 w-72 bg-[#252525] border-l border-[#333] overflow-y-auto">
        {/* 点云处理 */}
        <div className="border-b border-[#333]">
          <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-[#00b4d8]" />
            <h3 className="font-medium">点云处理</h3>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={() => processPointCloud('statistical_outlier_removal')}
              disabled={processing}
              className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#151515] disabled:text-gray-600 border border-[#333] rounded transition-colors text-sm text-left"
            >
              <div className="font-medium">统计离群点去除</div>
              <div className="text-xs text-gray-500 mt-1">基于统计分析去除噪点</div>
            </button>
            <button
              onClick={() => processPointCloud('radius_outlier_removal')}
              disabled={processing}
              className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#151515] disabled:text-gray-600 border border-[#333] rounded transition-colors text-sm text-left"
            >
              <div className="font-medium">半径离群点去除</div>
              <div className="text-xs text-gray-500 mt-1">基于邻域半径去除孤立点</div>
            </button>
            <button
              onClick={() => processPointCloud('dbscan_clustering')}
              disabled={processing}
              className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#151515] disabled:text-gray-600 border border-[#333] rounded transition-colors text-sm text-left"
            >
              <div className="font-medium">DBSCAN聚类去噪</div>
              <div className="text-xs text-gray-500 mt-1">密度聚类算法去噪</div>
            </button>
            <button
              onClick={() => processPointCloud('poisson_reconstruction')}
              disabled={processing}
              className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#151515] disabled:text-gray-600 border border-[#333] rounded transition-colors text-sm text-left"
            >
              <div className="font-medium">泊松表面重建</div>
              <div className="text-xs text-gray-500 mt-1">生成平滑的三维表面</div>
            </button>
          </div>
        </div>

        {/* 场景优化 */}
        <div className="border-b border-[#333]">
          <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
            <Target className="w-4 h-4 mr-2 text-[#00b4d8]" />
            <h3 className="font-medium">场景优化</h3>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={analyzeSparseRegions}
              disabled={processing}
              className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#151515] disabled:text-gray-600 border border-[#333] rounded transition-colors text-sm text-left"
            >
              <div className="font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-[#ff6b6b]" />
                分析稀疏区域
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">检测点云密度不足的区域</div>
            </button>
            <button
              onClick={optimizeCameraPositions}
              disabled={processing}
              className="w-full px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] disabled:bg-[#151515] disabled:text-gray-600 border border-[#333] rounded transition-colors text-sm text-left"
            >
              <div className="font-medium flex items-center">
                <Camera className="w-4 h-4 mr-2 text-[#00ff88]" />
                优化相机位置
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-6">计算最佳补充拍摄位置</div>
            </button>
          </div>
        </div>

        {/* 导出 */}
        <div className="p-4">
          <button
            onClick={exportPointCloud}
            disabled={processing || !pointCloudRef.current}
            className="w-full px-4 py-3 bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-[#151515] disabled:text-gray-600 text-white rounded transition-colors flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            导出点云
          </button>
        </div>

        {/* 相机列表 */}
        {cameras.length > 0 && (
          <div className="border-t border-[#333]">
            <div className="px-4 py-3 bg-[#2a2a2a] flex items-center">
              <Camera className="w-4 h-4 mr-2 text-[#00b4d8]" />
              <h3 className="font-medium">相机列表</h3>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              {cameras.map((cam, index) => (
                <button
                  key={index}
                  className={`w-full px-3 py-2 text-sm text-left rounded transition-colors mb-1 ${
                    selectedCamera === index 
                      ? 'bg-[#00b4d8] text-white' 
                      : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300'
                  }`}
                  onClick={() => switchToCamera(index)}
                >
                  <div className="flex items-center">
                    <Camera className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {cam.filename.replace('.camera', '').replace('.txt', '')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="absolute bottom-0 left-80 right-72 h-8 bg-[#1a1a1a] border-t border-[#333] flex items-center px-4 text-xs text-gray-500">
        <div className="flex items-center space-x-6">
          {isInCameraView && (
            <div className="flex items-center text-[#ffa500]">
              <Eye className="w-3 h-3 mr-1" />
              <span>相机视角模式</span>
            </div>
          )}
          <span>就绪</span>
        </div>
      </div>

      {/* 加载遮罩 */}
      {(processing || reconstructing) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2a2a2a] p-8 rounded-lg shadow-2xl border border-[#333]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-3 border-[#00b4d8] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-200">{reconstructing ? 'SFM重建中...' : '处理中...'}</p>
              {reconstructing && (
                <p className="text-sm text-gray-400 mt-2">这可能需要几分钟时间</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #00b4d8;
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #0096c7;
          transform: scale(1.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #00b4d8;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          transition: all 0.2s;
        }
        
        .slider::-moz-range-thumb:hover {
          background: #0096c7;
          transform: scale(1.2);
        }
        
        /* 自定义滚动条 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
};

export default SFMViewer;