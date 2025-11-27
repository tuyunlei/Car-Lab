
import { CarConfig, LevelData } from './types';

// 预设配置库 - Reference 8 Template
export const CAR_PRESETS: Record<string, CarConfig> = {
  CIVILIAN: {
    name: "Civilian 1.6L Sedan",
    width: 1.8,
    length: 4.5,
    wheelBase: 2.65,
    trackWidth: 1.55,
    mass: 1300,
    wheelRadius: 0.3,

    // 动力学：典型前驱家用车
    // 头重脚轻 (60%前)，导致极限下容易推头 (Understeer)
    frontWeightDistribution: 0.60, 
    momentOfInertia: 2000, 
    // 后轮刚度略高，增加行驶稳定性，防止甩尾
    tireStiffnessFront: 60000,
    tireStiffnessRear: 70000, 
    
    // 转向：舒适取向
    maxSteeringWheelAngle: 540, // 1.5圈
    steeringRatio: 16.0, 
    steeringSpeed: 400, 
    steeringReturnSpeed: 250,

    // 动力：普通家用车
    engineForce: 180, 
    brakingForce: 500,
    drag: 0.04,
    friction: 1.1, // 街道轮胎
    
    idleRPM: 750,
    stallRPM: 450,
    redlineRPM: 6500,
    maxRPM: 6800,
    
    flywheelInertia: 0.25, 
    engineFriction: 1.0, 
    engineBrakingCoefficient: 1.0,

    gearRatios: [0, 3.6, 2.1, 1.4, 1.0, 0.8],
    finalDriveRatio: 4.1,
  },
  SPORT: {
    name: "Sport 2.0L Turbo RWD",
    width: 1.9,
    length: 4.4,
    wheelBase: 2.55,
    trackWidth: 1.60,
    mass: 1400,
    wheelRadius: 0.32,
    
    // 动力学：50:50 配重，后驱
    frontWeightDistribution: 0.51, 
    momentOfInertia: 2400,
    // 前后刚度接近，动态活跃，允许一定的转向过度 (Oversteer)
    tireStiffnessFront: 80000,
    tireStiffnessRear: 80000,

    // 转向：运动取向
    maxSteeringWheelAngle: 360, 
    steeringRatio: 12.0, 
    steeringSpeed: 600, 
    steeringReturnSpeed: 400, 

    engineForce: 380, 
    brakingForce: 800,
    drag: 0.035,
    friction: 1.4, // 运动轮胎

    idleRPM: 850,
    stallRPM: 600,
    redlineRPM: 7200,
    maxRPM: 7500,
    
    flywheelInertia: 0.15, 
    engineFriction: 1.2, 
    engineBrakingCoefficient: 1.5, 

    gearRatios: [0, 3.2, 2.0, 1.5, 1.1, 0.9],
    finalDriveRatio: 3.9,
  },
  TRUCK: {
    name: "Heavy Diesel Truck",
    width: 2.4,
    length: 6.0,
    wheelBase: 3.8,
    trackWidth: 2.0,
    mass: 4500,
    wheelRadius: 0.45,
    
    // 动力学：极其笨重
    frontWeightDistribution: 0.4, // 假设空载，头重
    momentOfInertia: 10000, 
    tireStiffnessFront: 120000,
    tireStiffnessRear: 150000,

    maxSteeringWheelAngle: 900, 
    steeringRatio: 24.0, 
    steeringSpeed: 300, 
    steeringReturnSpeed: 100,

    engineForce: 600, 
    brakingForce: 1200,
    drag: 0.08,
    friction: 0.9,

    idleRPM: 600,
    stallRPM: 400,
    redlineRPM: 3500,
    maxRPM: 4000,
    
    flywheelInertia: 1.2, 
    engineFriction: 0.8, 
    engineBrakingCoefficient: 2.5, 

    gearRatios: [0, 5.0, 3.0, 2.0, 1.5, 1.0],
    finalDriveRatio: 5.0,
  }
};

export const DEFAULT_CAR_CONFIG: CarConfig = CAR_PRESETS.CIVILIAN;

export const LEVELS: LevelData[] = [
  {
    id: 'lvl1',
    name: '课程一：直线起步与停车',
    description: '最基础的驾驶训练。练习离合器与油门的配合，平稳起步并停在目标区域。无需转向。',
    startPos: { x: 100, y: 300 },
    startHeading: 0,
    instructions: '1. 按 [E] 启动引擎\n2. 按 [Q] 踩住离合\n3. 按 [W] 挂入1档\n4. 轻按 [↑] 给油，将转速维持在 1500-2000 转\n5. 慢慢松开 [Q] 离合找到半联动点\n6. 车身动起来后完全松开离合\n7. 到达绿色方框区域刹车停稳',
    objects: [
      { id: 'wall_top', type: 'wall', x: 0, y: 150, width: 800, height: 10, rotation: 0 },
      { id: 'wall_bottom', type: 'wall', x: 0, y: 450, width: 800, height: 10, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 480, y: 270, width: 100, height: 60, rotation: 0, target: true }
    ]
  },
  {
    id: 'lvl2',
    name: '课程二：基础倒车入库',
    description: '学习使用倒档和后视镜原理（想象），将车辆停入指定车位。',
    startPos: { x: 200, y: 300 },
    startHeading: 0,
    instructions: '1. 向前开过车位，车尾超过库口\n2. 踩离合刹车停稳\n3. 按 [S] 挂入倒档 (R)\n4. 控制好离合器（半联动），缓慢倒车\n5. 配合转向倒入车位',
    objects: [
      { id: 'wall_top', type: 'wall', x: 200, y: 100, width: 600, height: 10, rotation: 0 },
      { id: 'spot_left', type: 'wall', x: 380, y: 200, width: 10, height: 100, rotation: 0 },
      { id: 'spot_right', type: 'wall', x: 440, y: 200, width: 10, height: 100, rotation: 0 },
      { id: 'spot_back', type: 'wall', x: 380, y: 200, width: 70, height: 10, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 410, y: 200, width: 50, height: 90, rotation: 0, target: true }
    ]
  }
];

export const KEYS = {
  THROTTLE: 'ArrowUp',
  BRAKE: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  CLUTCH: 'q',
  SHIFT_UP: 'w',
  SHIFT_DOWN: 's',
  START_ENGINE: 'e',
  RESET: 'r'
};
