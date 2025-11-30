
import { TestDefinition } from '../types';
import { UnitContext } from '../context';
import { evaluateCondition } from '../../game/conditionEvaluator';
import { ConditionDefinition } from '../../game/lessonTypes';
import { TelemetrySnapshot } from '../../game/telemetry';

// 构造一个 Mock 的 TelemetrySnapshot
const mockTelemetry: TelemetrySnapshot = {
    timestamp: 1000,
    elapsedTime: 5000,
    speedKmh: 45.5,
    engineRpm: 2500,
    gear: 2,
    throttleInput: 0.5,
    brakeInput: 0,
    clutchInput: 0,
    handbrakeInput: 0,
    steeringAngle: 0,
    stalled: false,
    engineOn: true,
    position: { x: 0, y: 0 },
    heading: 0,
    isColliding: false,
    isInTargetZone: false
};

export const EVALUATOR_TESTS: TestDefinition[] = [
    {
        id: 'UNIT-EVAL-ATOMIC',
        category: 'UNIT',
        name: 'test.unit_eval_atomic.name',
        description: 'test.unit_eval_atomic.desc',
        steps: [
            'test.unit_eval_atomic.s1',
            'test.unit_eval_atomic.s2',
            'test.unit_eval_atomic.s3'
        ],
        run: (ctx: UnitContext) => {
            // 1. 数值 GT
            const condGT: ConditionDefinition = {
                type: 'atomic',
                field: 'speedKmh',
                op: 'GT',
                value: 40
            };
            ctx.assert(
                evaluateCondition(condGT, mockTelemetry) === true, 
                '45.5 > 40 Should be True',
                undefined,
                { key: 'assert.eval.gt_true', params: { val1: 45.5, val2: 40 } }
            );

            // 2. 数值 LT (Fail case)
            const condLT: ConditionDefinition = {
                type: 'atomic',
                field: 'engineRpm',
                op: 'LT',
                value: 2000
            };
            ctx.assert(
                evaluateCondition(condLT, mockTelemetry) === false, 
                '2500 < 2000 Should be False',
                undefined,
                { key: 'assert.eval.lt_false', params: { val1: 2500, val2: 2000 } }
            );

            // 3. 布尔 EQ
            const condBool: ConditionDefinition = {
                type: 'atomic',
                field: 'stalled',
                op: 'EQ',
                value: false
            };
            ctx.assert(
                evaluateCondition(condBool, mockTelemetry) === true, 
                'stalled == false Should be True',
                undefined,
                { key: 'assert.eval.eq_true', params: { field: 'stalled', val: 'false' } }
            );

            // 4. 区间 BETWEEN
            const condBetween: ConditionDefinition = {
                type: 'atomic',
                field: 'engineRpm',
                op: 'BETWEEN',
                min: 2000,
                max: 3000
            };
            ctx.assert(
                evaluateCondition(condBetween, mockTelemetry) === true, 
                '2500 in [2000, 3000] Should be True',
                undefined,
                { key: 'assert.eval.between_true', params: { val: 2500, min: 2000, max: 3000 } }
            );
        }
    },
    {
        id: 'UNIT-EVAL-GROUP',
        category: 'UNIT',
        name: 'test.unit_eval_group.name',
        description: 'test.unit_eval_group.desc',
        steps: [
            'test.unit_eval_group.s1',
            'test.unit_eval_group.s2',
            'test.unit_eval_group.s3'
        ],
        run: (ctx: UnitContext) => {
            // AND: Speed > 40 AND Gear == 2 (True + True = True)
            const condAndPass: ConditionDefinition = {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'speedKmh', op: 'GT', value: 40 },
                    { type: 'atomic', field: 'gear', op: 'EQ', value: 2 }
                ]
            };
            ctx.assert(
                evaluateCondition(condAndPass, mockTelemetry) === true, 
                'AND (T, T) -> True',
                undefined,
                { key: 'assert.eval.and_true' }
            );

            // AND: Speed > 40 AND Gear == 3 (True + False = False)
            const condAndFail: ConditionDefinition = {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'speedKmh', op: 'GT', value: 40 },
                    { type: 'atomic', field: 'gear', op: 'EQ', value: 3 }
                ]
            };
            ctx.assert(
                evaluateCondition(condAndFail, mockTelemetry) === false, 
                'AND (T, F) -> False',
                undefined,
                { key: 'assert.eval.and_false' }
            );

            // OR: Stalled == True OR EngineOn == True (False + True = True)
            const condOrPass: ConditionDefinition = {
                type: 'or',
                conditions: [
                    { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
                    { type: 'atomic', field: 'engineOn', op: 'EQ', value: true }
                ]
            };
            ctx.assert(
                evaluateCondition(condOrPass, mockTelemetry) === true, 
                'OR (F, T) -> True',
                undefined,
                { key: 'assert.eval.or_true' }
            );

            // NOT: NOT(Stalled == True) -> True (since stalled is false)
            const condNot: ConditionDefinition = {
                type: 'not',
                conditions: [
                    { type: 'atomic', field: 'stalled', op: 'EQ', value: true }
                ]
            };
            ctx.assert(
                evaluateCondition(condNot, mockTelemetry) === true, 
                'NOT (F) -> True',
                undefined,
                { key: 'assert.eval.not_true' }
            );
        }
    },
    {
        id: 'UNIT-EVAL-NESTED',
        category: 'UNIT',
        name: 'test.unit_eval_nested.name',
        description: 'test.unit_eval_nested.desc',
        steps: [
            'test.unit_eval_nested.s1'
        ],
        run: (ctx: UnitContext) => {
            // (Speed > 40) AND (Stalled OR Gear == 2)
            // T AND (F OR T) -> T AND T -> T
            const condNested: ConditionDefinition = {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'speedKmh', op: 'GT', value: 40 },
                    { 
                        type: 'or', 
                        conditions: [
                            { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
                            { type: 'atomic', field: 'gear', op: 'EQ', value: 2 }
                        ]
                    }
                ]
            };
            ctx.assert(
                evaluateCondition(condNested, mockTelemetry) === true, 
                'Nested Logic Passed',
                undefined,
                { key: 'assert.eval.nested_pass' }
            );
        }
    }
];
