
import { CourseDefinition, CourseCategory, LessonDefinition } from '../../game/lessonTypes';

// --- Lesson A1: Smooth Start ---
const LESSON_A1_SMOOTH_START: LessonDefinition = {
    id: 'LESSON_A1_SMOOTH_START',
    levelId: 'lvl1',
    titleKey: 'course.foundation.a1.title',
    descriptionKey: 'course.foundation.a1.desc',
    skills: ['BASIC_CONTROLS', 'SMOOTH_START'],
    recommendedOrder: 1,
    scoring: {
        baseScore: 100,
        stallPenalty: 20,
        timePenaltyPerSecond: 1,
        benchmarkTimeSeconds: 20
    },
    hints: [
        {
            id: 'hint_more_gas',
            messageKey: 'hint.more_gas',
            delayMs: 2000,
            once: true,
            // Trigger: Clutch is engaging (input < 0.9), but RPM dropping low (< 800)
            trigger: {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'clutchInput', op: 'LT', value: 0.9 },
                    { type: 'atomic', field: 'engineRpm', op: 'LT', value: 800 },
                    { type: 'atomic', field: 'engineOn', op: 'EQ', value: true }
                ]
            }
        },
        {
            id: 'hint_release_handbrake',
            messageKey: 'hint.release_handbrake',
            delayMs: 3000,
            once: true,
            // Trigger: Trying to move (Throttle > 0.1) but Handbrake is On
            trigger: {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'throttleInput', op: 'GT', value: 0.1 },
                    { type: 'atomic', field: 'handbrakeInput', op: 'GT', value: 0.1 }
                ]
            }
        }
    ],
    objectives: [
        {
            id: 'obj_engine_start',
            titleKey: 'obj.engine_start',
            required: true,
            condition: {
                type: 'atomic',
                field: 'engineOn',
                op: 'EQ',
                value: true
            }
        },
        {
            id: 'obj_reach_speed',
            titleKey: 'obj.reach_speed_15',
            required: true,
            condition: {
                type: 'atomic',
                field: 'speedKmh',
                op: 'GT',
                value: 15
            },
            mustHoldForMs: 1000 // Hold speed for 1s
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true }
    ]
};

// --- Lesson A2: Precision Stop ---
const LESSON_A2_PRECISION_STOP: LessonDefinition = {
    id: 'LESSON_A2_PRECISION_STOP',
    levelId: 'lvl1',
    titleKey: 'course.foundation.a2.title',
    descriptionKey: 'course.foundation.a2.desc',
    skills: ['BRAKE', 'CLUTCH_CONTROL', 'PARKING'],
    recommendedOrder: 2,
    scoring: {
        baseScore: 100,
        stallPenalty: 15, // Stall on stop is common
        collisionPenalty: 50,
        timePenaltyPerSecond: 0.5,
        benchmarkTimeSeconds: 30
    },
    hints: [
        {
            id: 'hint_clutch_in_stop',
            messageKey: 'hint.press_clutch_stop',
            delayMs: 500,
            once: false,
            // Trigger: Speed low (<5km/h), Brake pressed, but Clutch NOT pressed
            trigger: {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'speedKmh', op: 'LT', value: 5 },
                    { type: 'atomic', field: 'brakeInput', op: 'GT', value: 0.5 },
                    { type: 'atomic', field: 'clutchInput', op: 'LT', value: 0.5 },
                    { type: 'atomic', field: 'engineOn', op: 'EQ', value: true }
                ]
            }
        }
    ],
    objectives: [
        {
            id: 'obj_reach_speed',
            titleKey: 'obj.reach_speed_20',
            required: true,
            condition: { type: 'atomic', field: 'speedKmh', op: 'GT', value: 20 },
            mustHoldForMs: 500
        },
        {
            id: 'obj_stop_in_zone',
            titleKey: 'obj.stop_in_zone',
            required: true,
            // Condition: In Zone AND Speed almost 0
            condition: {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'isInTargetZone', op: 'EQ', value: true },
                    { type: 'atomic', field: 'speedKmh', op: 'LT', value: 1.0 }
                ]
            },
            mustHoldForMs: 2000 // Must stay stopped for 2s
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true }
    ]
};

// --- Lesson A3: Low Speed Control ---
const LESSON_A3_LOW_SPEED: LessonDefinition = {
    id: 'LESSON_A3_LOW_SPEED',
    levelId: 'lvl1',
    titleKey: 'course.foundation.a3.title',
    descriptionKey: 'course.foundation.a3.desc',
    skills: ['THROTTLE_CONTROL', 'CLUTCH_CONTROL'],
    recommendedOrder: 3,
    scoring: {
        baseScore: 100,
        stallPenalty: 30,
        collisionPenalty: 30,
    },
    hints: [
        {
            id: 'hint_too_fast',
            messageKey: 'hint.too_fast',
            delayMs: 1000,
            // Trigger: Speed > 12km/h (Limit is 15, target is 10)
            trigger: {
                type: 'atomic',
                field: 'speedKmh',
                op: 'GT',
                value: 12
            }
        }
    ],
    objectives: [
        {
            id: 'obj_maintain_crawl',
            titleKey: 'obj.maintain_crawl',
            required: true,
            // Keep speed between 3 and 10 km/h
            condition: {
                type: 'atomic',
                field: 'speedKmh',
                op: 'BETWEEN',
                min: 3,
                max: 10
            },
            mustHoldForMs: 8000 // Maintain for 8 seconds
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true },
        { type: 'atomic', field: 'speedKmh', op: 'GT', value: 15 } // Fail if speeding
    ]
};

// --- Lesson A4: Hill Start ---
const LESSON_A4_HILL_START: LessonDefinition = {
    id: 'LESSON_A4_HILL_START',
    levelId: 'lvl3', // 15% Slope level
    titleKey: 'course.foundation.a4.title',
    descriptionKey: 'course.foundation.a4.desc',
    skills: ['HILL_START', 'THROTTLE_CONTROL', 'HANDBRAKE'],
    recommendedOrder: 4,
    scoring: {
        baseScore: 100,
        stallPenalty: 25,
        timePenaltyPerSecond: 0.2, // Generous time
        benchmarkTimeSeconds: 40
    },
    hints: [
        {
            id: 'hint_rolling_back',
            messageKey: 'hint.rolling_back',
            delayMs: 200, // Quick trigger
            // Trigger: Rolling back > 0.5km/h
            trigger: {
                type: 'atomic',
                field: 'speedKmh',
                op: 'LT',
                value: -0.5
            }
        }
    ],
    objectives: [
        {
            id: 'obj_climb_hill',
            titleKey: 'obj.climb_hill',
            required: true,
            condition: { type: 'atomic', field: 'speedKmh', op: 'GT', value: 10 },
            mustHoldForMs: 1000
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true },
        // Fail if rolling back significantly (> 0.5 m/s approx 1.8 km/h)
        { type: 'atomic', field: 'speedKmh', op: 'LT', value: -2.0 } 
    ]
};

export const FOUNDATION_COURSES: CourseDefinition = {
    id: 'course_foundation',
    category: CourseCategory.FOUNDATION,
    titleKey: 'course.foundation.title', 
    descriptionKey: 'course.foundation.desc', 
    order: 1,
    lessons: [
        LESSON_A1_SMOOTH_START,
        LESSON_A2_PRECISION_STOP,
        LESSON_A3_LOW_SPEED,
        LESSON_A4_HILL_START
    ] 
};
