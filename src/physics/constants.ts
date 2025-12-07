
/**
 * 物理引擎常量定义
 * 将魔法数字集中管理，提高可读性和可配置性
 */

// === 载荷计算 ===
export const PHYSICS_CONSTANTS = {
    /** 最小轴载荷 (N)，防止除零 */
    MIN_AXLE_LOAD: 100,

    /** 重力加速度 (m/s²) */
    GRAVITY: 9.81,
} as const;

// === 停车状态机 ===
export const STOPPING_CONSTANTS = {
    /** 判定为制动中的最小制动力 (Nm) */
    MIN_BRAKE_TORQUE_THRESHOLD: 10,
} as const;

// === 轮胎物理 ===
export const TIRE_CONSTANTS = {
    /** 低速时的安全速度值 (m/s)，防止除零 */
    LOW_SPEED_SAFE_VALUE: 0.5,

    /** 停车过程中制动力缩放的速度系数 */
    STOPPING_BRAKE_SCALE_FACTOR: 5,
} as const;

// === 离合器 ===
export const CLUTCH_CONSTANTS = {
    /** 离合器接合阈值 (0-1)，低于此值视为接合 */
    ENGAGEMENT_THRESHOLD: 0.9,

    /** 最小离合器传递容量 (Nm) */
    MIN_CAPACITY: 5.0,

    /** 锁定判定的最大 RPM 差值 */
    LOCK_RPM_DIFF_THRESHOLD: 150,
} as const;

// === 发动机 ===
export const ENGINE_CONSTANTS = {
    /** 熄火判定的 RPM 阈值 */
    STALL_RPM_THRESHOLD: 300,

    /** 高挡位怠速熄火的 RPM 比例 (相对于怠速) */
    HIGH_GEAR_IDLE_STALL_RATIO: 0.8,

    /** 高挡位判定的最小挡位 */
    HIGH_GEAR_THRESHOLD: 3,

    /** 倒挡冲击判定的最小速度 (m/s) */
    REVERSE_SHOCK_MIN_SPEED: 0.5,
} as const;

// === 输入处理 ===
export const INPUT_CONSTANTS = {
    /** 虚拟踏板每秒变化量 */
    VIRTUAL_PEDAL_RATE: 2.0,

    /** 默认手刹棘轮速度 */
    DEFAULT_HANDBRAKE_RATCHET_SPEED: 3.0,
} as const;
