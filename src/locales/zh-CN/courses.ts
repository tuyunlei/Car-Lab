
export const courses = {
    'course.foundation.title': '基础驾驶 (Foundation)',
    'course.foundation.desc': '掌握手动挡核心技巧：离合控制、油门配合与平稳起步。',
    
    // A1
    'course.foundation.a1.title': 'A1: 平稳起步',
    'course.foundation.a1.desc': '目标：启动车辆，平稳加速至 15km/h，过程中不得熄火。',
    'obj.engine_start': '启动引擎',
    'obj.reach_speed_15': '加速至 15km/h 并保持',

    // A2
    'course.foundation.a2.title': 'A2: 定点停车',
    'course.foundation.a2.desc': '目标：加速后在指定绿色区域内平稳刹停。',
    'obj.reach_speed_20': '加速至 20km/h',
    'obj.stop_in_zone': '在目标区域内完全刹停',

    // A3
    'course.foundation.a3.title': 'A3: 低速控车',
    'course.foundation.a3.desc': '目标：使用半联动或轻油门，将车速维持在 3-10km/h 之间持续 8 秒。',
    'obj.maintain_crawl': '保持车速 3-10km/h (8秒)',

    // A4
    'course.foundation.a4.title': 'A4: 坡道起步',
    'course.foundation.a4.desc': '目标：在15%的坡道上完成起步，不得严重溜车。',
    'obj.climb_hill': '爬坡速度达到 10km/h',
    
    // --- Subject 2 ---
    'course.subject2.title': '科目二专项 (Subject 2)',
    'course.subject2.desc': '场地驾驶技巧进阶，包含倒车入库与坡道定点考试。',

    'lesson.sub2.reverse_park.title': 'B1: 倒车入库',
    'lesson.sub2.reverse_park.desc': '综合测试：使用倒档精准停入车位，全程不得碰撞。需先完成定点停车与低速控车课程。',
    'obj.park_success': '倒车入库并停稳',

    'lesson.sub2.hill_exam.title': 'B2: 坡道起步 (考试)',
    'lesson.sub2.hill_exam.desc': '严格模式：在15%坡道完成起步。任何溜车(>1km/h)或熄火将直接判定失败。',
    'obj.hill_climb_exam': '无溜车完成爬坡',

    // --- Subject 2 Exam ---
    'course.subject2.exam.title': '科目二考试模拟',
    'course.subject2.exam.desc': '全真模拟考试环境，严格扣分。90分合格，碰撞直接挂科。',

    'lesson.sub2.reverse_park_exam.title': '模拟：倒车入库',
    'lesson.sub2.reverse_park_exam.desc': '考试标准倒车入库。时限50秒，碰撞立即失败，压线扣分。',
    
    'lesson.sub2.hill_exam_exam.title': '模拟：坡道定点起步',
    'lesson.sub2.hill_exam_exam.desc': '考试标准坡道起步。时限25秒，后溜超过0.5m/s立即失败。',

    'lesson.current_task': '当前任务',
    'lesson.status.running': '进行中',
    'lesson.status.success': '通过',
    'lesson.status.failed': '失败',
    
    'lesson.fail_reason': '失败原因',
    'lesson.fail.generic': '触犯失败条件',
    'lesson.fail.condition_violated': '发生严重失误 (碰撞/溜车/熄火)',
    'lesson.fail.score_too_low': '得分未达及格线',

    'lesson.hint.restart': '按 [R] 重置或在菜单重新开始',
    'lesson.success.msg': '恭喜！课程目标已达成。',
    
    'lesson.action.retry': '重试本课',
    'lesson.action.menu': '返回菜单',
    'lesson.action.next': '下一课',

    'lesson.result.score': '最终得分',
    'lesson.result.time': '耗时',
    'lesson.result.stalls': '熄火次数',
    'lesson.result.collisions': '碰撞次数',

    'hint.more_gas': '转速过低！请尝试多给一点油门',
    'hint.release_handbrake': '手刹未松！请按 [Space] 松开手刹',
    'hint.press_clutch_stop': '即将停车！请踩下离合器防止熄火',
    'hint.too_fast': '速度过快！请踩刹车或松油门',
    'hint.rolling_back': '正在后溜！踩刹车或配合手刹',
    'hint.reverse_clutch': '倒车太快！请半联动控制速度',
};
