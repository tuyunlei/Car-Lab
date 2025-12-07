
import { useState, useCallback } from 'react';
import { LevelData, GameMode, AppGameMode } from '../../game/types';
import { CarConfig } from '../../config/types';
import { LessonDefinition } from '../../game/lessonTypes';
import { LEVELS } from '../../config/levels';
import { DEFAULT_CAR_CONFIG } from '../../config/cars';
import { loadProgress, saveProgress, updateProgress, GameProgress } from '../../game/progress';

export interface GameState {
    currentLevel: LevelData;
    gameMode: AppGameMode;
    carConfig: CarConfig;
    activeLesson: LessonDefinition | undefined;
    progress: GameProgress;
}

export interface GameStateActions {
    setCurrentLevel: (level: LevelData) => void;
    setGameMode: (mode: AppGameMode) => void;
    setCarConfig: (config: CarConfig) => void;
    enterSandbox: () => void;
    startLesson: (lesson: LessonDefinition) => void;
    exitLesson: () => void;
    handleLessonFinish: (lessonId: string, result: 'success' | 'failed') => void;
}

export function useGameState(): [GameState, GameStateActions] {
    const [currentLevel, setCurrentLevel] = useState<LevelData>(LEVELS[0]);
    const [gameMode, setGameMode] = useState<AppGameMode>(GameMode.LEVELS);
    const [carConfig, setCarConfig] = useState<CarConfig>(DEFAULT_CAR_CONFIG);
    const [activeLesson, setActiveLesson] = useState<LessonDefinition | undefined>(undefined);
    const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

    const enterSandbox = useCallback(() => {
        setGameMode(GameMode.SANDBOX);
        setActiveLesson(undefined);
    }, []);

    const startLesson = useCallback((lesson: LessonDefinition) => {
        const status = progress[lesson.id]?.status || 'LOCKED';
        if (status === 'LOCKED') return;

        const targetLevel = LEVELS.find(l => l.id === lesson.levelId);
        if (targetLevel) {
            setCurrentLevel(targetLevel);
            setActiveLesson(lesson);
            setGameMode('LESSON');
        } else {
            console.error(`Level ${lesson.levelId} not found for lesson ${lesson.id}`);
        }
    }, [progress]);

    const exitLesson = useCallback(() => {
        setActiveLesson(undefined);
        setGameMode(GameMode.LEVELS);
    }, []);

    const handleLessonFinish = useCallback((lessonId: string, result: 'success' | 'failed') => {
        if (result === 'success') {
            const newProgress = updateProgress(progress, lessonId, result);
            setProgress(newProgress);
            saveProgress(newProgress);
        }
    }, [progress]);

    const state: GameState = {
        currentLevel,
        gameMode,
        carConfig,
        activeLesson,
        progress
    };

    const actions: GameStateActions = {
        setCurrentLevel,
        setGameMode,
        setCarConfig,
        enterSandbox,
        startLesson,
        exitLesson,
        handleLessonFinish
    };

    return [state, actions];
}
