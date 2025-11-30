
export const tests_runtime = {
    'test.unit_rt_success.name': '运行时：简单通关流程',
    'test.unit_rt_success.desc': '验证满足目标后课程状态流转为 Success。',
    'test.unit_rt_success.s1': '输入未达标数据',
    'test.unit_rt_success.s2': '输入达标数据 -> 断言成功',

    'test.unit_rt_hold.name': '运行时：持续时间目标',
    'test.unit_rt_hold.desc': '验证 mustHoldForMs 逻辑及中断重置逻辑。',
    'test.unit_rt_hold.s1': '输入达标数据 (100ms)',
    'test.unit_rt_hold.s2': '中断条件 (重置计时)',
    'test.unit_rt_hold.s3': '再次输入达标数据 (200ms) -> 断言完成',

    'test.unit_rt_fail.name': '运行时：失败判定',
    'test.unit_rt_fail.desc': '验证触发 failConditions 后立即失败且状态锁定。',
    'test.unit_rt_fail.s1': '正常运行',
    'test.unit_rt_fail.s2': '触发熄火 -> 断言失败',

    'assert.rt.running': '课程状态应为 running',
    'assert.rt.success_cb': '应触发成功回调',
    'assert.rt.success_state': '课程状态应流转为 success',
    'assert.rt.pending': '目标状态应为 pending',
    'assert.rt.hold_accum': '保持时间应累积 ({ms}ms)',
    'assert.rt.hold_reset': '中断后计时器应重置',
    'assert.rt.obj_complete': '达到时间后目标应完成',
    'assert.rt.not_failed': '尚未触发失败',
    'assert.rt.fail_cb': '应触发失败回调',
    'assert.rt.fail_state': '课程状态应流转为 failed',
    'assert.rt.fail_locked': '失败后状态应锁定',
};
