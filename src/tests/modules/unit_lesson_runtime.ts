
import { TestDefinition } from '../types';
import { UnitContext } from '../context';
import { LessonRuntime, LessonCallbacks } from '../../game/lessonRuntime';
import { LessonDefinition } from '../../game/lessonTypes';
import { TelemetrySnapshot } from '../../game/telemetry';

// Helper to create a dummy telemetry
const createMockTelemetry = (overrides?: Partial<TelemetrySnapshot>): TelemetrySnapshot => ({
    timestamp: 0,
    elapsedTime: 0,
    speedKmh: 0,
    engineRpm: 800,
    gear: 1,
    throttleInput: 0,
    brakeInput: 0,
    clutchInput: 0,
    handbrakeInput: 0,
    steeringAngle: 0,
    stalled: false,
    engineOn: true,
    position: { x: 0, y: 0 },
    heading: 0,
    isColliding: false,
    isInTargetZone: false,
    ...overrides
});

export const RUNTIME_TESTS: TestDefinition[] = [
    {
        id: 'UNIT-RT-SUCCESS',
        category: 'UNIT',
        name: 'test.unit_rt_success.name',
        description: 'test.unit_rt_success.desc',
        steps: [
            'test.unit_rt_success.s1',
            'test.unit_rt_success.s2'
        ],
        run: (ctx: UnitContext) => {
            let successCalled: boolean = false;
            const callbacks: LessonCallbacks = {
                onLessonSuccess: () => { successCalled = true; },
                onLessonFailed: () => {},
                onObjectiveCompleted: () => {},
                onHintTriggered: () => {}
            };

            const lesson: LessonDefinition = {
                id: 'test-l1',
                levelId: 'lvl1',
                titleKey: 'title',
                descriptionKey: 'desc',
                skills: [],
                recommendedOrder: 1,
                objectives: [
                    {
                        id: 'obj1',
                        titleKey: 'obj1',
                        required: true,
                        condition: { type: 'atomic', field: 'speedKmh', op: 'GT', value: 10 }
                    }
                ],
                failConditions: []
            };

            const runtime = new LessonRuntime(lesson, callbacks);
            runtime.start();

            // 1. Update with low speed (Not met)
            runtime.update(0.1, createMockTelemetry({ speedKmh: 5 }));
            ctx.assert(runtime.getState().status === 'running', 'Status remains running', undefined, { key: 'assert.rt.running' });

            // 2. Update with high speed (Met)
            runtime.update(0.1, createMockTelemetry({ speedKmh: 15 }));
            
            ctx.assert(successCalled, 'Success callback triggered', undefined, { key: 'assert.rt.success_cb' });
            ctx.assert(runtime.getState().status === 'success', 'Status updated to success', undefined, { key: 'assert.rt.success_state' });
        }
    },
    {
        id: 'UNIT-RT-HOLD',
        category: 'UNIT',
        name: 'test.unit_rt_hold.name',
        description: 'test.unit_rt_hold.desc',
        steps: [
            'test.unit_rt_hold.s1',
            'test.unit_rt_hold.s2',
            'test.unit_rt_hold.s3'
        ],
        run: (ctx: UnitContext) => {
            let objCompleted: boolean = false;
            const callbacks: LessonCallbacks = {
                onLessonSuccess: () => {},
                onLessonFailed: () => {},
                onObjectiveCompleted: (id) => { if(id === 'obj_hold') objCompleted = true; },
                onHintTriggered: () => {}
            };

            const lesson: LessonDefinition = {
                id: 'test-hold',
                levelId: 'lvl1',
                titleKey: 'title',
                descriptionKey: 'desc',
                skills: [],
                recommendedOrder: 1,
                objectives: [
                    {
                        id: 'obj_hold',
                        titleKey: 'obj_hold',
                        required: true,
                        mustHoldForMs: 200, // Hold for 200ms
                        condition: { type: 'atomic', field: 'engineRpm', op: 'GT', value: 2000 }
                    }
                ],
                failConditions: []
            };

            const runtime = new LessonRuntime(lesson, callbacks);
            runtime.start();

            // 1. First tick (100ms) - Met but not enough time
            runtime.update(0.1, createMockTelemetry({ engineRpm: 2500 }));
            const objState1 = runtime.getObjectiveState('obj_hold');
            
            ctx.assert(objState1?.status === 'pending', 'Status pending after 100ms', undefined, { key: 'assert.rt.pending' });
            ctx.assert(objState1?.currentHoldMs === 100, 'Hold timer accumulated', undefined, { key: 'assert.rt.hold_accum', params: { ms: 100 } });

            // 2. Interruption (Condition broken)
            runtime.update(0.1, createMockTelemetry({ engineRpm: 1000 }));
            const objState2 = runtime.getObjectiveState('obj_hold');
            ctx.assert(objState2?.currentHoldMs === 0, 'Hold timer reset on break', undefined, { key: 'assert.rt.hold_reset' });

            // 3. Retry and Complete (100ms + 100ms)
            runtime.update(0.1, createMockTelemetry({ engineRpm: 2500 }));
            runtime.update(0.1, createMockTelemetry({ engineRpm: 2500 }));
            
            ctx.assert(objCompleted, 'Objective completed after hold', undefined, { key: 'assert.rt.obj_complete' });
        }
    },
    {
        id: 'UNIT-RT-FAIL',
        category: 'UNIT',
        name: 'test.unit_rt_fail.name',
        description: 'test.unit_rt_fail.desc',
        steps: [
            'test.unit_rt_fail.s1',
            'test.unit_rt_fail.s2'
        ],
        run: (ctx: UnitContext) => {
            let failed: boolean = false;
            const callbacks: LessonCallbacks = {
                onLessonSuccess: () => {},
                onLessonFailed: () => { failed = true; },
                onObjectiveCompleted: () => {},
                onHintTriggered: () => {}
            };

            const lesson: LessonDefinition = {
                id: 'test-fail',
                levelId: 'lvl1',
                titleKey: 'title',
                descriptionKey: 'desc',
                skills: [],
                recommendedOrder: 1,
                objectives: [
                    {
                        id: 'obj1',
                        titleKey: 'obj1',
                        required: true,
                        condition: { type: 'atomic', field: 'speedKmh', op: 'GT', value: 100 }
                    }
                ],
                failConditions: [
                    { type: 'atomic', field: 'stalled', op: 'EQ', value: true }
                ]
            };

            const runtime = new LessonRuntime(lesson, callbacks);
            runtime.start();

            // 1. Normal state
            runtime.update(0.1, createMockTelemetry({ stalled: false, speedKmh: 50 }));
            ctx.assert(failed === false, 'Not failed yet', undefined, { key: 'assert.rt.not_failed' });

            // 2. Trigger Fail
            runtime.update(0.1, createMockTelemetry({ stalled: true, speedKmh: 50 }));
            ctx.assert(failed, 'Fail callback triggered', undefined, { key: 'assert.rt.fail_cb' });
            ctx.assert(runtime.getState().status === 'failed', 'State is failed', undefined, { key: 'assert.rt.fail_state' });

            // 3. Try to succeed after fail (Should be ignored)
            runtime.update(0.1, createMockTelemetry({ stalled: false, speedKmh: 150 }));
            ctx.assert(runtime.getState().status === 'failed', 'State locked in failed', undefined, { key: 'assert.rt.fail_locked' });
        }
    }
];
