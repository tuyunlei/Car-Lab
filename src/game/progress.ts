
import { ALL_COURSES } from '../config/courses';

export type LessonStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED';

export interface LessonProgress {
    status: LessonStatus;
    highScore?: number;
}

export type GameProgress = Record<string, LessonProgress>;

const STORAGE_KEY = 'ds_progress_v2';

// 检查某个 Lesson 是否满足解锁条件
const checkIsUnlockable = (lessonId: string, currentProgress: GameProgress): boolean => {
    // 1. 找到 Lesson 定义
    let lessonDef = null;
    let courseDef = null;
    for (const c of ALL_COURSES) {
        const l = c.lessons.find(x => x.id === lessonId);
        if (l) {
            lessonDef = l;
            courseDef = c;
            break;
        }
    }
    if (!lessonDef || !courseDef) return false;

    // 2. 检查前置课程 (Prerequisites)
    // 如果定义了 prereqLessonIds，则必须所有前置课都 COMPLETED
    if (lessonDef.prereqLessonIds && lessonDef.prereqLessonIds.length > 0) {
        const allPrereqsMet = lessonDef.prereqLessonIds.every(pid => {
            return currentProgress[pid]?.status === 'COMPLETED';
        });
        if (!allPrereqsMet) return false;
    } 
    // 如果没有定义显式 Prereqs，则检查同一 Course 内的上一个 Lesson (线性解锁)
    else if (lessonDef.recommendedOrder > 1) {
        const prevLesson = courseDef.lessons.find(l => l.recommendedOrder === lessonDef!.recommendedOrder - 1);
        if (prevLesson) {
            if (currentProgress[prevLesson.id]?.status !== 'COMPLETED') {
                return false;
            }
        }
    }

    return true;
};

// 初始化默认进度
const getDefaultProgress = (): GameProgress => {
    const defaultProgress: GameProgress = {};
    
    // 先把所有置为 LOCKED
    ALL_COURSES.forEach(course => {
        course.lessons.forEach(lesson => {
            defaultProgress[lesson.id] = { status: 'LOCKED' };
        });
    });

    // 第一遍扫描：解锁没有前置条件且顺序为 1 的课程
    ALL_COURSES.forEach(course => {
        course.lessons.forEach(lesson => {
            if (lesson.recommendedOrder === 1 && (!lesson.prereqLessonIds || lesson.prereqLessonIds.length === 0)) {
                defaultProgress[lesson.id] = { status: 'AVAILABLE' };
            }
        });
    });

    return defaultProgress;
};

export const loadProgress = (): GameProgress => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            // 合并默认值以防版本更新增加了新课程
            const parsed = JSON.parse(stored);
            const defaults = getDefaultProgress();
            
            // 简单合并：保留已存在的进度，新增的默认为 LOCKED (并在后续通过 update check 解锁)
            const merged = { ...defaults, ...parsed };
            
            // 重新运行一次解锁检查，以防新增了依赖关系
            return reevaluateUnlocks(merged);
        }
    } catch (e) {
        console.error("Failed to load progress", e);
    }
    return getDefaultProgress();
};

export const saveProgress = (progress: GameProgress) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error("Failed to save progress", e);
    }
};

// 遍历所有 LOCKED 的课程，检查是否满足条件变更为 AVAILABLE
const reevaluateUnlocks = (progress: GameProgress): GameProgress => {
    const newProgress = { ...progress };
    let changed = false;

    ALL_COURSES.forEach(course => {
        course.lessons.forEach(lesson => {
            const currentStatus = newProgress[lesson.id]?.status || 'LOCKED';
            if (currentStatus === 'LOCKED') {
                if (checkIsUnlockable(lesson.id, newProgress)) {
                    newProgress[lesson.id] = { ...newProgress[lesson.id], status: 'AVAILABLE' };
                    changed = true;
                }
            }
        });
    });

    return changed ? newProgress : progress;
};

export const updateProgress = (
    currentProgress: GameProgress, 
    lessonId: string, 
    result: 'success' | 'failed'
): GameProgress => {
    if (result !== 'success') return currentProgress;

    const newProgress = { ...currentProgress };
    
    // 1. 标记当前课程为已完成
    const currentStatus = newProgress[lessonId]?.status || 'LOCKED';
    if (currentStatus !== 'COMPLETED') {
        newProgress[lessonId] = { ...newProgress[lessonId], status: 'COMPLETED' };
    }

    // 2. 全局重新计算解锁状态 (处理跨课程依赖)
    // 比如完成 A4 后，可能解锁 B2
    return reevaluateUnlocks(newProgress);
};
