
export interface Vector2 {
  x: number;
  y: number;
}

// 车辆配置参数（可调节）
export interface CarConfig {
  name: string; // 配置名称
  
  // 尺寸与质量
  width: number;
  length: number;
  wheelBase: number; // 轴距
  trackWidth: number; // 轮距
  mass: number;
  wheelRadius: number;
  
  // 操控与阻力
  // maxSteerAngle: number; // DEPRECATED: 由 steeringRatio 和 maxSteeringWheelAngle 决定
  drag: number; // 空气阻力
  friction: number; // 轮胎侧向摩擦 (为漂移预留)
  brakingForce: number;

  // 转向系统 (Steering System)
  maxSteeringWheelAngle: number; // 方向盘最大转角 (度), 例如 450度
  steeringRatio: number; // 转向比, 例如 15:1 (方向盘转15度，轮子转1度)
  steeringSpeed: number; // 驾驶员打方向的速度 (度/秒)
  steeringReturnSpeed: number; // 自动回正速度 (度/秒)

  // 动力系统核心
  engineForce: number; // 扭矩峰值系数 (Nm)
  idleRPM: number; // 目标怠速
  stallRPM: number; // 熄火转速 (Hard stall)
  redlineRPM: number; // 红线转速
  maxRPM: number; // 断油转速
  
  // 动力手感/瞬态响应
  flywheelInertia: number; // 飞轮惯量：决定转速上升/下降的快慢
  engineFriction: number;  // 引擎内部摩擦：决定空挡掉转速的快慢
  engineBrakingCoefficient: number; // 发动机制动系数：决定带档滑行时的阻力

  // 传动
  gearRatios: number[]; // 齿轮比
  finalDriveRatio: number; // 终传比
}

// 实时物理状态
export interface PhysicsState {
  position: Vector2;
  velocity: Vector2; // 世界坐标系速度
  heading: number; // 车头朝向 (弧度)
  angularVelocity: number;
  
  steerAngle: number; // 当前前轮实际转向角 (弧度) - 只读，由方向盘计算得出
  steeringWheelAngle: number; // 方向盘当前角度 (度) - 核心控制变量
  
  // 动力系统状态
  rpm: number;
  gear: number; // 0: N, 1: 1st, -1: R
  clutchPosition: number; // 0 (结合) - 1 (分离)
  throttleInput: number; // 0 - 1 (平滑后)
  brakeInput: number; // 0 - 1 (平滑后)
  
  engineOn: boolean;
  stalled: boolean; // 是否熄火
  speedKmh: number;
}

export interface MapObject {
  id: string;
  type: 'wall' | 'parking-spot' | 'cone';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  target?: boolean; // 是否是关卡目标
}

export interface LevelData {
  id: string;
  name: string;
  description: string;
  startPos: Vector2;
  startHeading: number;
  objects: MapObject[];
  instructions: string;
}

export enum GameMode {
  LEVELS = 'LEVELS',
  SANDBOX = 'SANDBOX'
}