import { PhysicalEngine } from '@src/physical-engine/index'
import * as THREE from 'three'
import { setLookAtTarget, setCameraOrbitRadius } from 'coin/cameras/customCamera'

// 自定义一个时钟,触发 three 的渲染和物理引擎的运行
export class Clock {
    private physicalEngine: PhysicalEngine
    private renderEngine: any
    private worldStepInterval = 1 / 60
    private lookAtTargets: any[] = []
    private camera: any
    
    constructor({ physicalEngine, renderEngine }) {
        this.physicalEngine = physicalEngine
        this.renderEngine = renderEngine
    }

    setLookAtTarget(lookAtTarget) {
        if (Array.isArray(lookAtTarget)) {
            this.lookAtTargets = lookAtTarget;
        } else {
            this.lookAtTargets = [lookAtTarget];
        }
        
        // 如果有多个目标，则计算中心点
        if (this.lookAtTargets.length > 1) {
            this.updateCameraForMultipleTargets();
        } else if (this.lookAtTargets.length === 1) {
            // 单个目标情况
            setLookAtTarget(this.lookAtTargets[0].threeMesh.position);
            setCameraOrbitRadius(2); // 默认距离
        }
    }

    // 计算多个目标的中心点和适当的相机距离
    private updateCameraForMultipleTargets() {
        if (this.lookAtTargets.length === 0) return;
        
        // 计算所有目标的中心点
        const center = new THREE.Vector3();
        this.lookAtTargets.forEach(target => {
            center.add(target.threeMesh.position);
        });
        center.divideScalar(this.lookAtTargets.length);
        
        // 计算适当的相机距离
        let maxDistance = 0;
        this.lookAtTargets.forEach(target => {
            const distance = center.distanceTo(target.threeMesh.position);
            maxDistance = Math.max(maxDistance, distance);
        });
        
        // 设置相机的目标为中心点
        setLookAtTarget(center);
        
        // 设置相机距离为最大距离的2.5倍，确保所有硬币都在视野内
        const cameraRadius = Math.max(2, maxDistance * 3);
        setCameraOrbitRadius(cameraRadius);
    }

    setCameraInstance(camera) {
        this.camera = camera
    }

    step() {
        // 如果有多个目标，则动态更新相机位置
        if (this.lookAtTargets.length > 1) {
            this.updateCameraForMultipleTargets();
        }
        
        this.physicalEngine.step(this.worldStepInterval)
        this.renderEngine.render()
    }

    start() {
        setInterval(() => {
            this.step()
        }, this.worldStepInterval * 1000)
    }
}
