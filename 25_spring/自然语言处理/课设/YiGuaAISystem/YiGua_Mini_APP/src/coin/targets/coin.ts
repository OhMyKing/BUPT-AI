import * as THREE from 'three';
import CANNON from 'cannon';
import physicalEngine from '../physical-engine';
import coin_front from './coin_front.png'
import coin_back from './coin_back.png'

export function getBoxSize(object: any) {
    const box = new THREE.Box3().setFromObject(object)
    const xSize = box.max.x - box.min.x
    const ySize = box.max.y - box.min.y
    const zSize = box.max.z - box.min.z
    return { xSize, ySize, zSize }
}

export class Coin {
    public synchronizer
    public threeMesh
    public cannonBody

    static createModel() {
        // 创建一个组来包含所有的元素
        const group = new THREE.Group();
        
        // 加载图片纹理
        const textureLoader = new THREE.TextureLoader();
        const frontTexture = textureLoader.load(coin_front);
        const backTexture = textureLoader.load(coin_back);

        // 设置纹理的中心点和旋转
        frontTexture.center = new THREE.Vector2(0.5, 0.5);
        backTexture.center = new THREE.Vector2(0.5, 0.5);
        // frontTexture.rotation = Math.PI / 2;
        // backTexture.rotation = Math.PI / 2;
        
        // 定义硬币半径，确保一致性
        const coinRadius = 0.25;
        
        // 创建硬币的边缘
        // 参数说明：torus(半径, 管粗细半径, 管径向分段数, 管周向分段数)
        const tubeRadius = 0.015; // 管的粗细（硬币的厚度）
        const edgeGeometry = new THREE.TorusGeometry(coinRadius, tubeRadius, 16, 64);
        const edgeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x85653d,
            // metalness: 0.8,
            // roughness: 0.3,
            transparent: true,
            opacity: 1,
        });
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        group.add(edge);
        
        // 创建硬币正面 - 使用圆形几何体而不是平面几何体
        const frontMaterial = new THREE.MeshBasicMaterial({ 
            map: frontTexture,
            transparent: true,
            side: THREE.DoubleSide,
            // alphaTest: 0.1, // 添加alphaTest来处理半透明区域
        });
        const frontGeometry = new THREE.CircleGeometry(coinRadius, 32);
        const frontFace = new THREE.Mesh(frontGeometry, frontMaterial);
        frontFace.position.set(0, 0, -0.011); // 略微偏移，避免z-fighting
        // frontFace.rotation.x = -Math.PI / 2;
        group.add(frontFace);
        
        // 创建硬币反面 - 使用圆形几何体而不是平面几何体
        const backMaterial = new THREE.MeshBasicMaterial({ 
            map: backTexture,
            transparent: true,
            side: THREE.DoubleSide,
            // alphaTest: 0.1, // 添加alphaTest来处理半透明区域
        });
        const backGeometry = new THREE.CircleGeometry(coinRadius, 32);
        const backFace = new THREE.Mesh(backGeometry, backMaterial);
        backFace.position.set(0, 0, 0.011); // 略微偏移，避免z-fighting
        // backFace.rotation.x = Math.PI / 2;
        group.add(backFace);
        
        // 把group作为模型返回
        return group;
    }

    constructor(model: any) {
        const halfExtents = 0.05
        const coinMesh = model  
        model.position.set(0, 0, 0.1)
        model.rotation.set(0, 0, 0)
        model.castShadow = true
        model.children.forEach((child: any) => {
            child.castShadow = true;
        });
        
        // 创建硬币的物理实体，使用更小的尺寸
        const { body, synchronizer } = physicalEngine.createInstance({ 
            halfExtents,
            shape: 'cylinder',
            radius: 0.25,
            height: 0.05
        });
        
        // 确保物理实体的朝向与视觉模型一致
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        
        // 调整摩擦系数和弹性，使硬币不会太容易卡住
        body.material.friction = 0.3;
        body.material.restitution = 0.3;
        
        // 避免硬币垂直卡住
        body.angularDamping = 0.5;
        body.linearDamping = 0.2;
        
        synchronizer.init({ threeMesh: coinMesh, cannonBody: body })
        synchronizer.syncThree2Connon()
        this.synchronizer = synchronizer
        this.threeMesh = coinMesh
        this.cannonBody = body
    }

    // 投掷硬币
    public flip() {
        this.cannonBody.velocity.set(0, 0, 5)
        setTimeout(() => {
            this.cannonBody.angularVelocity.set(
                Math.random() * 5 * Math.PI,
                0,
                Math.random() * 1 * Math.PI
            )
        }, 20);
    }
    
    // 判断正反面
    public getResult() {
        // 获取硬币的上向量
        const upVector = new THREE.Vector3(0, 1, 0);
        const coinUpVector = new THREE.Vector3(0, 1, 0).applyQuaternion(this.threeMesh.quaternion);
        
        // 计算点积判断朝向
        const dot = upVector.dot(coinUpVector);
        
        // 如果点积为正，说明硬币正面朝上
        if (dot > 0) {
            console.log('正面')
            return "正面";
        } else {
            console.log('反面')
            return "反面";
        }
    }
}

export function createCoin() {
    const model = Coin.createModel();
    return new Coin(model);
}