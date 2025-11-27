
import { CarConfig, LevelData } from './types';

// 预设配置库 - Reference 8 Template
export const CAR_PRESETS: Record<string, CarConfig> = {
  CIVILIAN: {
    name: "Civilian 1.6L Sedan",
    width: 1.8,
    length: 4.5,
    wheelBase: 2.65,
    trackWidth: 1.55,
    mass: 1250,
    wheelRadius: 0.3,
    
    // 转向：舒适取向，圈数多，转向比大
    maxSteeringWheelAngle: 540, // 1.5圈 (左+右=3圈)
    steeringRatio: 16.0, // 16:1 转向比
    steeringSpeed: 400, // 手速一般
    steeringReturnSpeed: 250, // 回正较柔和

    // 动力：普通家用车
    engineForce: 180, // Approx 180Nm peak torque
    brakingForce: 500,
    drag: 0.04,
    friction: 1.2,
    
    // 转速特性：参考资料标准值
    idleRPM: 750,
    stallRPM: 450,
    redlineRPM: 6500,
    maxRPM: 6800,
    
    // 瞬态：中规中矩
    flywheelInertia: 0.25, 
    engineFriction: 1.0, 
    engineBrakingCoefficient: 1.0,

    gearRatios: [0, 3.6, 2.1, 1.4, 1.0, 0.8],
    finalDriveRatio: 4.1,
  },
  SPORT: {
    name: "Sport 2.0L Turbo Coupe",
    width: 1.9,
    length: 4.4,
    wheelBase: 2.55,
    trackWidth: 1.60,
    mass: 1350,
    wheelRadius: 0.32,
    
    // 转向：运动取向，圈数少，转向比小，手感快
    maxSteeringWheelAngle: 360, // 1圈 (左+右=2圈)
    steeringRatio: 12.0, // 12:1 转向比，很贼
    steeringSpeed: 600, // 驾驶员操作更快
    steeringReturnSpeed: 400, // 回正力矩大

    // 动力：响应快，高转速
    engineForce: 350, // 350Nm
    brakingForce: 700,
    drag: 0.035,
    friction: 1.4,

    idleRPM: 850,
    stallRPM: 600,
    redlineRPM: 7200,
    maxRPM: 7500,
    
    // 瞬态：轻量化飞轮，响应极快
    flywheelInertia: 0.15, 
    engineFriction: 1.2, 
    engineBrakingCoefficient: 1.5, // 高压缩比

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
    
    // 转向：非常慢，圈数极多
    maxSteeringWheelAngle: 900, // 2.5圈
    steeringRatio: 24.0, // 24:1
    steeringSpeed: 300, 
    steeringReturnSpeed: 100,

    // 动力：柴油机低扭强
    engineForce: 600, 
    brakingForce: 1200,
    drag: 0.08,
    friction: 1.0,

    idleRPM: 600,
    stallRPM: 400,
    redlineRPM: 3500,
    maxRPM: 4000,
    
    // 瞬态：巨大的惯量
    flywheelInertia: 1.2, // 转速升降很慢
    engineFriction: 0.8, 
    engineBrakingCoefficient: 2.5, // 柴油机发动机制动很强

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