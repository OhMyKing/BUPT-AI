import * as THREE from 'three';
import { createPlane } from 'coin/meshes/plane'
import { camera } from 'coin/cameras/customCamera';
import { createBulbLight } from 'coin/lights/bulbLight'
import { createCoin, Coin } from 'coin/targets/coin'
import { createHemiLight } from 'coin/lights/hemiLight'
import physicalEngine from 'coin/physical-engine/index'
import { Clock } from 'coin/clock/clock'
import { createInteraction } from 'coin/interaction/interaction'
import { coinStateManager } from 'coin/state/coinState'

// 初始化 WebGL Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
// 物理正确的光照渲染,以下参数可以模拟出更加贴近现实环境的光照效果
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = Math.pow(0.8, 8.0);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);

// 时钟
const clock = new Clock({ physicalEngine, renderEngine: { render } })
clock.start()
clock.setCameraInstance(camera)

// 主场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa59d8e);

// 点光源
const { bulbLight } = createBulbLight()
scene.add(bulbLight);

// 半球光源
const { hemiLight } = createHemiLight()
scene.add(hemiLight);

// 地面
const floorMesh = createPlane()
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// 创建三枚硬币
const coins = [];
const coinPositions = [
  { x: -0.8, y: 0, z: 0.1 },
  { x: 0, y: 0, z: 0.1 },
  { x: 0.8, y: 0, z: 0.1 }
];

// 创建三枚硬币并放置在不同位置
for (let i = 0; i < 3; i++) {
  const coin = createCoin();
  const { x, y, z } = coinPositions[i];
  
  // 设置硬币位置
  coin.threeMesh.position.set(x, y, z);
  
  // 更新物理引擎中的位置
  coin.synchronizer.syncThree2Connon();
  
  scene.add(coin.threeMesh);
  
  // 为硬币对象添加实例引用以便交互组件能够访问
  coin.threeMesh.__coin_instance__ = coin;
  
  coins.push(coin);
}

// 存储交互清理函数
let interactionCleanup = null;

function render() {
    renderer.render(scene, camera);
}

// 为了避免重复触发事件，创建一个映射来存储已经创建的实例
const componentInstances = new Map();

// 创建一个自定义标签，可以向外传递硬币状态
export function createCoinTossComponent(containerId, forceReset = false) {
  console.log(`创建硬币组件: 容器ID=${containerId}, 强制重置=${forceReset}`);
  
  // 如果是强制重置模式，则清理所有实例
  if (forceReset) {
    console.log("强制重置模式：清理所有实例");
    for (const [id, instance] of componentInstances.entries()) {
      if (typeof instance.destroy === 'function') {
        instance.destroy();
      }
      componentInstances.delete(id);
    }
    
    // 重置状态管理器
    coinStateManager.reset();
    
    // 重置所有硬币的位置和状态
    coins.forEach((coin, index) => {
      const { x, y, z } = coinPositions[index];
      
      // 重置硬币位置
      coin.threeMesh.position.set(x, y, z);
      coin.threeMesh.rotation.set(0, 0, 0);
      
      // 重置物理引擎中的状态
      coin.synchronizer.syncThree2Connon();
    });
  }
  // 否则，只清理当前容器ID的实例
  else if (componentInstances.has(containerId)) {
    console.log(`清理容器ID=${containerId}的现有实例`);
    // 先清理现有实例
    const existingInstance = componentInstances.get(containerId);
    existingInstance.destroy();
    componentInstances.delete(containerId);
  }
  
  // 创建一个包装组件，可以嵌入到其他页面
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found`);
    return;
  }
  
  // 创建容器包装
  const wrapper = document.createElement('div');
  wrapper.className = 'coin-toss-component';
  wrapper.style.position = 'relative';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  
  // 设置渲染器样式为相对定位，适应容器
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  
  // 先清空容器
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  // 添加Three.js渲染容器
  wrapper.appendChild(renderer.domElement);
  
  // 添加到提供的容器
  container.appendChild(wrapper);
  
  // 清理旧的交互事件
  if (interactionCleanup) {
    interactionCleanup();
    interactionCleanup = null;
  }
  
  // 为每个硬币添加点击事件
  // 只需要为第一个硬币创建交互，因为点击任一硬币都会触发所有硬币翻转
  const firstCoin = coins[0];
  if (firstCoin && firstCoin.threeMesh) {
    const cleanupObj = createInteraction(
      renderer.domElement, 
      scene, 
      firstCoin.threeMesh.uuid, 
      () => {
        // 翻转所有硬币
        coins.forEach(c => c.flip());
      }
    );
    
    if (cleanupObj && cleanupObj.cleanup) {
      interactionCleanup = cleanupObj.cleanup;
    }
  }
  
  // 使用闭包存储此实例的状态监听器，便于后续清理
  let stateListener = null;
  
  // 移除现有事件监听器
  const existingListeners = coinStateManager.__listeners__ || [];
  if (existingListeners.length > 0) {
    // 如果已经存在监听器，则移除它们
    coinStateManager.__listeners__ = [];
  }
  
  // 添加新的状态监听器
  stateListener = (status, results) => {
    // 创建自定义事件，传递状态给外部
    const event = new CustomEvent('cointossstate', { 
      detail: {
        status,
        results
      },
      bubbles: true 
    });
    
    // 分发事件
    container.dispatchEvent(event);
  };
  
  // 保存监听器引用到状态管理器，便于管理
  if (!coinStateManager.__listeners__) {
    coinStateManager.__listeners__ = [];
  }
  coinStateManager.__listeners__.push(stateListener);
  
  // 添加监听器到状态管理器
  coinStateManager.addListener(stateListener);
  
  // 调整大小以适应容器
  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  
  resizeObserver.observe(container);
  
  // 立即调整一次大小以适应容器
  const width = container.clientWidth;
  const height = container.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // 将时钟目标设置为硬币
  clock.setLookAtTarget(coins);
  
  // 创建实例对象
  const instance = {
    // 获取当前状态
    getState: () => ({
      status: coinStateManager.status,
      results: coinStateManager.coinResults
    }),
    
    // 增强版重置方法 - 不只重置状态管理器，还重置硬币位置和物理状态
    reset: () => {
      console.log("调用实例reset方法");
      // 重置状态管理器
      coinStateManager.reset();
      
      // 重置所有硬币的位置和状态
      coins.forEach((coin, index) => {
        const { x, y, z } = coinPositions[index];
        
        // 重置硬币位置
        coin.threeMesh.position.set(x, y, z);
        coin.threeMesh.rotation.set(0, 0, 0);
        
        // 重置物理引擎中的状态
        coin.synchronizer.syncThree2Connon();
      });
      
      // 重置时钟（如果有需要）
      if (typeof clock.reset === 'function') {
        clock.reset();
      }
    },
    
    // 销毁组件
    destroy: () => {
      console.log(`销毁硬币组件: 容器ID=${containerId}`);
      // 移除事件监听器
      if (stateListener) {
        coinStateManager.__listeners__ = (coinStateManager.__listeners__ || []).filter(
          listener => listener !== stateListener
        );
      }
      
      // 清理交互事件
      if (interactionCleanup) {
        interactionCleanup();
        interactionCleanup = null;
      }
      
      resizeObserver.disconnect();
      
      // 移除渲染器
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      
      // 清空容器
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // 从映射中移除实例
      componentInstances.delete(containerId);
    }
  };
  
  // 将实例保存到映射中
  componentInstances.set(containerId, instance);
  
  // 如果是强制重置模式，立即调用reset确保状态干净
  if (forceReset) {
    instance.reset();
  }
  
  // 返回控制接口
  return instance;
}

// 向window对象暴露组件创建函数，方便外部JS调用
if (typeof window !== 'undefined') {
  (window as any).createCoinTossComponent = createCoinTossComponent;
}

// 导出状态管理器，方便模块化引用
export { coinStateManager };