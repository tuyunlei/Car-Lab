
import { CourseDefinition, CourseCategory, LessonDefinition } from '../../game/lessonTypes';

// --- Lesson B1: Reverse Parking ---
const LESSON_B1_REVERSE_PARKING: LessonDefinition = {
    id: 'LESSON_B1_REVERSE_PARKING',
    levelId: 'lvl2', // Uses the parking lot level
    titleKey: 'lesson.sub2.reverse_park.title',
    descriptionKey: 'lesson.sub2.reverse_park.desc',
    skills: ['REVERSE', 'CLUTCH_CONTROL', 'PARKING'],
    recommendedOrder: 1,
    // Prerequisite: Must have completed Precision Stop (A2) and Low Speed Control (A3)
    prereqLessonIds: ['LESSON_A2_PRECISION_STOP', 'LESSON_A3_LOW_SPEED'],
    scoring: {
        baseScore: 100,
        stallPenalty: 10,
        collisionPenalty: 100, // Instant fail essentially, but defined here
        timePenaltyPerSecond: 0.5,
        benchmarkTimeSeconds: 60
    },
    hints: [
        {
            id: 'hint_reverse_clutch',
            messageKey: 'hint.reverse_clutch',
            delayMs: 3000,
            trigger: {
                type: 'and',
                conditions: [
                     { type: 'atomic', field: 'gear', op: 'EQ', value: -1 },
                     { type: 'atomic', field: 'speedKmh', op: 'GT', value: 8 } // Too fast in reverse
                ]
            }
        }
    ],
    objectives: [
        {
            id: 'obj_park_success',
            titleKey: 'obj.park_success',
            required: true,
            // Condition: In Zone AND Stopped
            condition: {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'isInTargetZone', op: 'EQ', value: true },
                    { type: 'atomic', field: 'speedKmh', op: 'BETWEEN', min: -0.1, max: 0.1 }
                ]
            },
            mustHoldForMs: 2000 // Hold for 2s to confirm
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true }
    ]
};

// --- Lesson B2: Hill Start Exam ---
const LESSON_B2_HILL_EXAM: LessonDefinition = {
    id: 'LESSON_B2_HILL_EXAM',
    levelId: 'lvl3', // Uses the 15% slope level
    titleKey: 'lesson.sub2.hill_exam.title',
    descriptionKey: 'lesson.sub2.hill_exam.desc',
    skills: ['HILL_START', 'HANDBRAKE', 'THROTTLE_CONTROL'],
    recommendedOrder: 2,
    // Prerequisite: Must have completed basic Hill Start (A4)
    prereqLessonIds: ['LESSON_A4_HILL_START'],
    scoring: {
        baseScore: 100,
        stallPenalty: 50, // Strict
        timePenaltyPerSecond: 1,
        benchmarkTimeSeconds: 30
    },
    objectives: [
        {
            id: 'obj_hill_climb',
            titleKey: 'obj.hill_climb_exam',
            required: true,
            condition: { type: 'atomic', field: 'speedKmh', op: 'GT', value: 15 },
            mustHoldForMs: 1000
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'stalled', op: 'EQ', value: true },
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true },
        // Strict Rollback Check: Fail if rolling back more than ~1km/h
        { type: 'atomic', field: 'speedKmh', op: 'LT', value: -1.0 }
    ]
};

export const SUBJECT2_COURSES: CourseDefinition = {
    id: 'course_subject2',
    category: CourseCategory.SUBJECT_2,
    titleKey: 'course.subject2.title',
    descriptionKey: 'course.subject2.desc',
    order: 2,
    lessons: [
        LESSON_B1_REVERSE_PARKING,
        LESSON_B2_HILL_EXAM
    ]
};
