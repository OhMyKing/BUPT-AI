import * as THREE from 'three'
import { downEvent, moveEvent, upEvent, commonEvent } from './event'
// 创建一个透视投影相机
const fov = 45
const aspect = window.innerWidth / window.innerHeight; // 2 // the canvas default
const near = 0.1
const far = 10
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
// 控制相机位移时的旋转半径
let cameraOrbitRadius = 3
let baseXYRadian = -Math.PI / 2
let xyRadian = -Math.PI / 2
let baseZHeight = cameraOrbitRadius
let zHeight = 3
let lookAtTarget = new THREE.Vector3(0, 0, 0)

// 更新相机位置,但使相机始终看向目标位置
function updateCameraPosition() {
    camera.position.set(
        lookAtTarget.x + cameraOrbitRadius * Math.cos(xyRadian),
        lookAtTarget.y + cameraOrbitRadius * Math.sin(xyRadian),
        lookAtTarget.z + zHeight,
    )
    camera.up.x = 0
    camera.up.y = 0
    camera.up.z = 1
    camera.lookAt(lookAtTarget)
    camera.updateProjectionMatrix()
}
updateCameraPosition()

// 设置相机轨道半径，用来调整相机与目标的距离
function setCameraOrbitRadius(radius) {
    cameraOrbitRadius = radius
    updateCameraPosition()
}

// 设置相机的观察目标
function setLookAtTarget(target) {
    if (target instanceof THREE.Vector3) {
        lookAtTarget = target.clone()
    } else {
        lookAtTarget = target
    }
    updateCameraPosition()
}

export { camera, updateCameraPosition, setCameraOrbitRadius, setLookAtTarget }