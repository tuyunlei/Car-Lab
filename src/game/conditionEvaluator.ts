
import { 
    ConditionDefinition, 
    AtomicCondition, 
    ConditionGroup, 
    TelemetryField 
} from './lessonTypes';
import { TelemetrySnapshot } from './telemetry';
import { GameEvent } from './events';

/**
 * 评估单个条件是否满足
 * 这是一个纯函数，不保留状态。
 * 
 * @param condition 条件定义
 * @param telemetry 当前帧的车辆遥测数据
 * @param events 当前帧发生的事件列表 (可选)
 * @returns boolean
 */
export const evaluateCondition = (
    condition: ConditionDefinition, 
    telemetry: TelemetrySnapshot,
    events: GameEvent[] = []
): boolean => {
    if (condition.type === 'atomic') {
        return evaluateAtomic(condition, telemetry, events);
    } else {
        return evaluateGroup(condition, telemetry, events);
    }
};

const evaluateAtomic = (
    cond: AtomicCondition, 
    telemetry: TelemetrySnapshot,
    events: GameEvent[]
): boolean => {
    // 1. 获取被比较的值 (Subject)
    let actualValue: number | boolean | undefined;

    // 优先从 Telemetry 中查找
    // 注意：我们需要断言 field 是否存在于 telemetry 中，或者它是特殊字段
    if (cond.field in telemetry) {
        actualValue = telemetry[cond.field as TelemetryField];
    } 
    // TODO: Phase 3 - 在这里处理基于 Event 的字段 (例如 'hitObject')
    // 目前如果字段不在 telemetry 中，我们暂时返回 false 或 undefined
    else {
        // 占位逻辑：如果字段名匹配某个事件类型，检查该事件是否发生
        // 这只是一个简单的示例，实际逻辑可能更复杂（如检查 objectId）
        const eventMatch = events.find(e => e.type === cond.field);
        if (eventMatch) {
            actualValue = true;
        } else {
            // 如果既不是 telemetry 也不是已知事件，视为未满足
            return false;
        }
    }

    // 2. 执行比较 (Operator)
    switch (cond.op) {
        case 'EQ':
            return actualValue === cond.value;
        case 'NEQ':
            return actualValue !== cond.value;
        case 'GT':
            return typeof actualValue === 'number' && typeof cond.value === 'number' && actualValue > cond.value;
        case 'GTE':
            return typeof actualValue === 'number' && typeof cond.value === 'number' && actualValue >= cond.value;
        case 'LT':
            return typeof actualValue === 'number' && typeof cond.value === 'number' && actualValue < cond.value;
        case 'LTE':
            return typeof actualValue === 'number' && typeof cond.value === 'number' && actualValue <= cond.value;
        case 'BETWEEN':
            if (typeof actualValue === 'number' && cond.min !== undefined && cond.max !== undefined) {
                return actualValue >= cond.min && actualValue <= cond.max;
            }
            return false;
        default:
            return false;
    }
};

const evaluateGroup = (
    group: ConditionGroup, 
    telemetry: TelemetrySnapshot,
    events: GameEvent[]
): boolean => {
    // 边界情况处理
    if (!group.conditions || group.conditions.length === 0) {
        // AND 空集通常视为 True (Identity)，OR 空集视为 False
        if (group.type === 'and') return true;
        if (group.type === 'or') return false;
        return false;
    }

    if (group.type === 'not') {
        // NOT 只应该包含一个子条件，如果由多个，我们只取第一个或全部取反
        // 定义：NOT 对所有子条件的结果取反 (通常只放一个)
        return !evaluateCondition(group.conditions[0], telemetry, events);
    }

    if (group.type === 'and') {
        // 所有子条件都必须为 True
        return group.conditions.every(c => evaluateCondition(c, telemetry, events));
    }

    if (group.type === 'or') {
        // 只要有一个子条件为 True
        return group.conditions.some(c => evaluateCondition(c, telemetry, events));
    }

    return false;
};
