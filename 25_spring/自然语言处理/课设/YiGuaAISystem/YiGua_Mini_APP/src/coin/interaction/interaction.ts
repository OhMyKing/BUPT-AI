import * as THREE from 'three'
import { camera } from 'coin/cameras/customCamera'
import { downEvent, moveEvent, upEvent, commonEvent } from 'coin/cameras/event'
import { Coin } from 'coin/targets/coin'
import { coinStateManager, CoinResult } from 'coin/state/coinState'

// 重新导出coinStateManager，以便index.ts可以导入
export { coinStateManager }

const raycaster = new THREE.Raycaster()

// 将浏览器视窗坐标系下的坐标转换为 Canvas 坐标系下的坐标
function normalizePosition(event = {}, canvas) {
    // 获取canvas元素的边界矩形
    const rect = canvas.getBoundingClientRect();
    
    // 计算点击在canvas内的坐标
    const clientX = commonEvent(event).x;
    const clientY = commonEvent(event).y;
    
    // 转换为画布坐标系
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    return { x, y };
}

// 检测当前设备是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 为移动设备设置摇一摇检测
function setupShakeDetection(callback) {
    // 存储加速度数据的变量
    let lastX = 0, lastY = 0, lastZ = 0;
    let moveCounter = 0;
    let lastUpdate = 0;
    const shakeThreshold = 8; // 摇动阈值，可根据需要调整
    const updateInterval = 100; // 更新间隔（毫秒）
    
    // 处理设备运动事件的函数
    function deviceMotionHandler(event) {
        const currentTime = new Date().getTime();
        
        // 只有当经过足够时间后才处理
        if ((currentTime - lastUpdate) > updateInterval) {
            lastUpdate = currentTime;
            
            // 获取加速度数据
            const acceleration = event.accelerationIncludingGravity;
            if (!acceleration) return;
            
            const x = acceleration.x;
            const y = acceleration.y;
            const z = acceleration.z;
            
            // 计算移动幅度
            const movement = Math.abs(x + y + z - lastX - lastY - lastZ);
            
            if (movement > shakeThreshold) {
                moveCounter++;
                
                // 如果检测到足够的移动次数，触发回调
                if (moveCounter > 2) {
                    // 重置计数器
                    moveCounter = 0;
                    
                    // 触发回调（翻转硬币）
                    callback();
                }
            }
            
            // 存储当前值以供下次比较
            lastX = x;
            lastY = y;
            lastZ = z;
        }
    }
    
    // 请求设备运动权限（iOS 13+设备需要）
    if (typeof window.DeviceMotionEvent !== 'undefined' && 
        // @ts-ignore - iOS 13+ specific API
        typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ 设备
        // @ts-ignore - iOS 13+ specific API
        DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', deviceMotionHandler);
          }
        })
        .catch(console.error);
    } else {
        // 非iOS 13+设备
        window.addEventListener('devicemotion', deviceMotionHandler);
    }
    
    // 返回清理函数
    return () => {
        window.removeEventListener('devicemotion', deviceMotionHandler);
    };
}

export function createInteraction(canvas, mainScene, coinId, callback) {
    let cleanupShakeDetection = null;
    
    // 获取所有的币对象（不只是传入的特定ID）
    const coinObjects = mainScene.children.filter(child => child.__coin_instance__);
    
    if (coinObjects.length === 0) {
        console.warn('No coin objects found in the scene');
        return { cleanup: () => {} };
    }
    
    // 处理硬币翻转的通用函数（用于点击和摇一摇）
    const handleCoinToss = () => {
        // 如果硬币正在翻转中，直接返回，不处理事件
        if (coinStateManager.status === 'TOSSING') return;
        
        // 更新状态为翻转中
        coinStateManager.startTossing();
        
        // 调用回调函数开始翻转硬币
        callback();
        
        // 等待硬币停止翻转后显示结果
        setTimeout(() => {
            // 获取场景中所有硬币实例
            const coinInstances = [];
            mainScene.children.forEach(child => {
                if (child.__coin_instance__ && typeof child.__coin_instance__.getResult === 'function') {
                    coinInstances.push(child.__coin_instance__);
                }
            });
            
            if (coinInstances.length > 0) {
                // 获取结果并更新状态
                const results = coinInstances.map(coin => 
                    coin.getResult().toUpperCase() as CoinResult
                );
                
                // 更新状态管理器
                coinStateManager.setResults(results);
            } else {
                // 如果无法获取结果，重置状态
                coinStateManager.reset();
            }
        }, 3000);
    };
    
    // 点击/触摸事件处理函数
    const handlePointerDown = (e) => {
        // 如果硬币正在翻转中，直接返回，不处理点击事件
        if (coinStateManager.status === 'TOSSING') return;
        
        // 使用正确的canvas元素和位置计算
        const normalizedPos = normalizePosition(e, canvas);
        
        // 从点击的位置,沿着摄像头的方向发出一条射线
        raycaster.setFromCamera(normalizedPos, camera);
        
        // 创建一个包含所有硬币及其子物体的数组用于射线检测
        const allCoinObjects = [];
        coinObjects.forEach(coinObj => {
            // 添加硬币主物体
            allCoinObjects.push(coinObj);
            // 添加所有子物体（硬币的面、边缘等）
            if (coinObj.children) {
                coinObj.children.forEach(child => {
                    allCoinObjects.push(child);
                });
            }
        });
        
        // 获得与射线相交的物体
        const intersectionObjects = raycaster.intersectObjects(allCoinObjects, false);
        
        // 检查是否点击到了任何硬币相关的物体
        if (intersectionObjects.length > 0) {
            handleCoinToss();
            // 阻止事件进一步传播和默认行为
            e.stopPropagation();
            e.preventDefault();
        }
    };
    
    // 添加事件监听器
    canvas.addEventListener(downEvent, handlePointerDown, { passive: false });
    
    // 检查设备是否为移动设备并设置摇一摇检测
    if (isMobileDevice()) {
        cleanupShakeDetection = setupShakeDetection(handleCoinToss);
    }
    
    // 返回清理函数用于移除事件监听器
    return {
        cleanup: () => {
            canvas.removeEventListener(downEvent, handlePointerDown);
            if (cleanupShakeDetection) {
                cleanupShakeDetection();
            }
        }
    };
}