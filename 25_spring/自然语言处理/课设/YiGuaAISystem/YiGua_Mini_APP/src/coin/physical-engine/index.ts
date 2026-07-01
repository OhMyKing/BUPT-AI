import CANNON from 'cannon'

import { Synchronizer } from './synchronizer'

// 在物理引擎中创建两种材质
const groundMaterial = new CANNON.Material('default')
const boxMaterial = new CANNON.Material('box')
const coinMaterial = new CANNON.Material('coin')
// 设置两种材质交互时的作用效果
const groundBoxContactMaterial = new CANNON.ContactMaterial(groundMaterial, boxMaterial, {
    friction: 0.1, restitution: 0.3
})
const groundCoinContactMaterial = new CANNON.ContactMaterial(groundMaterial, coinMaterial, {
    friction: 0.1, restitution: 0.5
})

export class PhysicalEngine {
    private world: CANNON.World | undefined
    private instances: Array<CANNON.Body> = []
    private synchronizers: Array<Synchronizer> = []
    constructor() {
        this.init()
    }

    private init() {
        const world = new CANNON.World();
        world.gravity.set(0, 0, -9.82); // m/s²

        // 创建地面实体
        const groundBody = new CANNON.Body({
            mass: 0, // mass == 0 makes the body static
            material: groundMaterial
        });
        const groundShape = new CANNON.Plane();
        groundBody.addShape(groundShape);
        world.addBody(groundBody);
        world.addContactMaterial(groundBoxContactMaterial)
        world.addContactMaterial(groundCoinContactMaterial)
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;
        this.world = world
    }

    public step(worldStepInterval: any) {
        // 推进 cannon 中的运算
        this.world.step(worldStepInterval);
        // 将 cannon 中的元算结果同步给 three mesh
        this.synchronizers.forEach(synchronizer => synchronizer.syncConnon2Three())
    }

    public createInstance({ halfExtents, shape = 'box', radius = 0, height = 0 }: { halfExtents: any, shape: string, radius: number, height: number }) {
        let physicalShape;
        let bodyOptions = {
            mass: 1, // kg
            fixedRotation: false
        };
        
        if (shape === 'box') {
            physicalShape = new CANNON.Box(new CANNON.Vec3(halfExtents, halfExtents, halfExtents));
            bodyOptions['shape'] = physicalShape;
            bodyOptions['material'] = boxMaterial;
        } else if (shape === 'cylinder') {
            physicalShape = new CANNON.Cylinder(radius, radius, height, 32);
            bodyOptions['shape'] = physicalShape;
            bodyOptions['material'] = coinMaterial;
        }
        
        const body = new CANNON.Body(bodyOptions);
        const synchronizer = new Synchronizer()
        this.world.addBody(body)
        this.instances.push(body)
        this.synchronizers.push(synchronizer)
        return { body, synchronizer }
    }

}

export default new PhysicalEngine()
