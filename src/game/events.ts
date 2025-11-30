
export type EventType = 
    | 'COLLISION'      // 发生碰撞
    | 'ENTER_AREA'     // 进入区域
    | 'LEAVE_AREA'     // 离开区域
    | 'GEAR_CHANGE'    // 换挡事件
    | 'STALL';         // 熄火事件

export interface GameEvent {
    type: EventType;
    timestamp: number;
    
    // 可选：事件相关的对象ID
    objectId?: string; 
    
    // 可选：事件携带的数据
    data?: Record<string, any>; 
}
