
export const tests_runtime = {
    'test.unit_rt_success.name': 'Runtime: Simple Success Flow',
    'test.unit_rt_success.desc': 'Verify lesson transitions to Success when objectives met.',
    'test.unit_rt_success.s1': 'Input failing data',
    'test.unit_rt_success.s2': 'Input passing data -> Assert Success',

    'test.unit_rt_hold.name': 'Runtime: Hold Duration',
    'test.unit_rt_hold.desc': 'Verify mustHoldForMs accumulation and reset logic.',
    'test.unit_rt_hold.s1': 'Input passing data (100ms)',
    'test.unit_rt_hold.s2': 'Interrupt (Reset timer)',
    'test.unit_rt_hold.s3': 'Input passing data (200ms) -> Assert Complete',

    'test.unit_rt_fail.name': 'Runtime: Failure Check',
    'test.unit_rt_fail.desc': 'Verify failConditions trigger immediate failure and lock state.',
    'test.unit_rt_fail.s1': 'Normal operation',
    'test.unit_rt_fail.s2': 'Trigger Stall -> Assert Failed',

    'assert.rt.running': 'State should be running',
    'assert.rt.success_cb': 'Success callback triggered',
    'assert.rt.success_state': 'State should transition to success',
    'assert.rt.pending': 'Objective should be pending',
    'assert.rt.hold_accum': 'Hold timer accumulated ({ms}ms)',
    'assert.rt.hold_reset': 'Timer reset on interruption',
    'assert.rt.obj_complete': 'Objective completed after hold',
    'assert.rt.not_failed': 'Not failed yet',
    'assert.rt.fail_cb': 'Failure callback triggered',
    'assert.rt.fail_state': 'State should transition to failed',
    'assert.rt.fail_locked': 'State should be locked after fail',
};
