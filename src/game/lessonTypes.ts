
import { TelemetrySnapshot } from './telemetry';
import { EventType } from './events';

// --- 基础枚举与标识 ---

export type SkillTag = 
    | 'BASIC_CONTROLS'  // 基础控制
    | 'CLUTCH_CONTROL'  // 离合控制
    | 'THROTTLE_CONTROL'// 油门控制
    | 'BRAKE'           // 刹车控制
    | 'HANDBRAKE'       // 手刹控制
    | 'STEERING'        // 转向
    | 'SMOOTH_START'    // 平稳起步
    | 'HILL_START'      // 坡道起步
    | 'REVERSE'         // 倒车
    | 'PARKING'         // 停车
    | 'GEAR_SHIFT'      // 换挡
    | 'SAFETY'          // 安全意识
    | 'EXAM_MODE';      // 考试模式

export enum CourseCategory {
    FOUNDATION = 'FOUNDATION',      // 基础控车
    SUBJECT_2 = 'SUBJECT_2',        // 场地考试练习
    SUBJECT_2_EXAM = 'SUBJECT_2_EXAM', // 场地考试模拟 (新增)
    SUBJECT_3 = 'SUBJECT_3',        // 道路驾驶
    ADVANCED = 'ADVANCED'           // 进阶技巧
}

export type LessonMode = 'PRACTICE' | 'EXAM';

export type ComparisonOperator = 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ' | 'NEQ' | 'BETWEEN';

// Telemetry 中的数值型字段名
export type TelemetryField = keyof Pick<TelemetrySnapshot, 
    'speedKmh' | 'engineRpm' | 'gear' | 'throttleInput' | 
    'brakeInput' | 'clutchInput' | 'handbrakeInput' | 'elapsedTime' | 'heading'
>;

// --- 条件表达式系统 (DSL) ---

export interface AtomicCondition {
    type: 'atomic';
    field: TelemetryField | 'stalled' | 'engineOn' | 'isColliding' | 'isInTargetZone' | EventType;
    op: ComparisonOperator;
    value?: number | boolean;
    min?: number; // For BETWEEN
    max?: number; // For BETWEEN
    
    // 持续时间要求：该条件必须连续满足多久 (ms) 才能判定为真
    holdDuration?: number; 
}

export interface ConditionGroup {
    type: 'and' | 'or' | 'not';
    conditions: ConditionDefinition[];
}

export type ConditionDefinition = AtomicCondition | ConditionGroup;

// --- 评分与提示系统 ---

export interface ScoringDefinition {
    baseScore: number;          // 满分基准 (默认100)
    minScore?: number;          // 最低分 (默认0)
    stallPenalty?: number;      // 每次熄火扣分
    collisionPenalty?: number;  // 每次碰撞扣分
    timePenaltyPerSecond?: number; // 超时每秒扣分
    benchmarkTimeSeconds?: number; // 不扣分的基准时间
    passingScore?: number;      // 考试及格线 (仅 EXAM 模式有效)
}

export interface HintDefinition {
    id: string;
    trigger: ConditionDefinition; // 触发条件
    delayMs: number;              // 条件满足持续多久后触发 (ms)
    messageKey: string;           // 提示文案
    once?: boolean;               // 是否全课程只触发一次 (默认 false，即条件断开后重连可再次触发)
}

export interface LessonResult {
    lessonId: string;
    score: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    elapsedMs: number;
    stallCount: number;
    collisionCount: number;
    passed: boolean; // 是否通过 (考虑 passingScore)
}

// --- 课程与目标定义 ---

export interface ObjectiveDefinition {
    id: string;
    titleKey: string; // i18n
    required: boolean; // 是否是通关必须目标
    
    // 成功条件：例如 "在目标区域内 + 速度为0 + 手刹拉起"
    condition: ConditionDefinition;
    
    // 可选：目标需要保持满足的时间 (快捷字段，也可以写在 condition 里)
    mustHoldForMs?: number; 
}

export interface LessonDefinition {
    id: string;
    mode?: LessonMode; // 默认为 PRACTICE
    levelId: string; // 关联的物理场景 ID (src/config/levels.ts)
    
    titleKey: string;
    descriptionKey: string;
    
    skills: SkillTag[];
    recommendedOrder: number;
    prereqLessonIds?: string[]; // 解锁条件

    // 课程内的阶段性目标 (例如：1.启动引擎 2.挂档 3.起步)
    objectives: ObjectiveDefinition[];

    // 失败/违规条件 (例如：熄火、碰撞)
    failConditions: ConditionDefinition[];
    
    // 评分规则
    scoring?: ScoringDefinition;

    // 智能提示规则
    hints?: HintDefinition[];
}

export interface CourseDefinition {
    id: string;
    category: CourseCategory;
    titleKey: string;
    descriptionKey: string;
    order: number;
    
    // 包含的课程单元
    lessons: LessonDefinition[];
}
