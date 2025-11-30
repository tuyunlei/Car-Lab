
import { CourseDefinition, CourseCategory, LessonDefinition } from '../../game/lessonTypes';

// --- Lesson B1-EXAM: Reverse Parking Exam ---
const LESSON_B1_REVERSE_PARKING_EXAM: LessonDefinition = {
    id: 'LESSON_B1_REVERSE_PARKING_EXAM',
    mode: 'EXAM',
    levelId: 'lvl2', 
    titleKey: 'lesson.sub2.reverse_park_exam.title',
    descriptionKey: 'lesson.sub2.reverse_park_exam.desc',
    skills: ['REVERSE', 'EXAM_MODE'],
    recommendedOrder: 1,
    // Prereq: The Practice Version
    prereqLessonIds: ['LESSON_B1_REVERSE_PARKING'],
    scoring: {
        baseScore: 100,
        stallPenalty: 10,
        collisionPenalty: 100, // Instant Fail Score-wise
        timePenaltyPerSecond: 1,
        benchmarkTimeSeconds: 50, // Stricter time
        passingScore: 90 // High passing standard
    },
    objectives: [
        {
            id: 'obj_park_success',
            titleKey: 'obj.park_success',
            required: true,
            condition: {
                type: 'and',
                conditions: [
                    { type: 'atomic', field: 'isInTargetZone', op: 'EQ', value: true },
                    { type: 'atomic', field: 'speedKmh', op: 'BETWEEN', min: -0.1, max: 0.1 }
                ]
            },
            mustHoldForMs: 3000 // Hold longer for exam
        }
    ],
    failConditions: [
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true } // Instant fail logic still applies
    ]
};

// --- Lesson B2-EXAM: Hill Start Exam (Strict) ---
const LESSON_B2_HILL_EXAM_EXAM: LessonDefinition = {
    id: 'LESSON_B2_HILL_EXAM_EXAM',
    mode: 'EXAM',
    levelId: 'lvl3',
    titleKey: 'lesson.sub2.hill_exam_exam.title',
    descriptionKey: 'lesson.sub2.hill_exam_exam.desc',
    skills: ['HILL_START', 'EXAM_MODE'],
    recommendedOrder: 2,
    // Prereq: The Practice Version
    prereqLessonIds: ['LESSON_B2_HILL_EXAM'],
    scoring: {
        baseScore: 100,
        stallPenalty: 20, 
        collisionPenalty: 100,
        timePenaltyPerSecond: 1,
        benchmarkTimeSeconds: 25,
        passingScore: 80
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
        { type: 'atomic', field: 'COLLISION', op: 'EQ', value: true },
        // Strict Rollback: Fail if > 0.5 km/h rollback
        { type: 'atomic', field: 'speedKmh', op: 'LT', value: -0.5 } 
    ]
};

export const SUBJECT2_EXAM_COURSES: CourseDefinition = {
    id: 'course_subject2_exam',
    category: CourseCategory.SUBJECT_2_EXAM,
    titleKey: 'course.subject2.exam.title',
    descriptionKey: 'course.subject2.exam.desc',
    order: 3,
    lessons: [
        LESSON_B1_REVERSE_PARKING_EXAM,
        LESSON_B2_HILL_EXAM_EXAM
    ]
};
