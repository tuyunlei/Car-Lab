
import { Vector2 } from '../physics/types';

/**
 * 车辆状态遥测快照
 * 用于课程系统的判定逻辑、回放录制或 Debug 显示
 */
export interface TelemetrySnapshot {
    // 时间戳 (ms)
    timestamp: number;
    // 局内流逝时间 (ms)
    elapsedTime: number;

    // --- 核心物理状态 ---
    speedKmh: number;
    engineRpm: number;
    gear: number;
    
    // --- 输入状态 (0.0 - 1.0) ---
    throttleInput: number;
    brakeInput: number;
    clutchInput: number; // 0.0 = 接合(脚离开), 1.0 = 分离(踩到底)
    handbrakeInput: number;
    steeringAngle: number; // 方向盘角度 (度)

    // --- 车辆逻辑状态 ---
    stalled: boolean;
    engineOn: boolean;
    
    // --- 空间状态 ---
    position: Vector2;
    heading: number; // 弧度

    // --- 环境交互事件 ---
    // 注意：这里只记录当前帧是否发生碰撞或处于目标区域，
    // 具体的碰撞对象ID判定将在后续阶段完善。
    isColliding: boolean;
    isInTargetZone: boolean;
}
